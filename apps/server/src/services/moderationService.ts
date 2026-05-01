import { prisma } from '../lib/prisma.js';
import { queueService } from './queueService.js';
import { CHARACTER_STATUSES } from '../utils/constants.js';

type ModerationAction = 'approve' | 'reject' | 'skip';

export async function moderateCharacter(characterId: string, action: ModerationAction, reason?: string) {
  switch (action) {
    case 'approve':
      return approveCharacter(characterId);
    case 'reject':
      return rejectCharacter(characterId, reason);
    case 'skip':
      return skipCharacter(characterId, reason);
    default:
      throw new Error(`Unsupported moderation action: ${action satisfies never}`);
  }
}

async function approveCharacter(characterId: string) {
  const character = await prisma.character.update({
    where: { id: characterId },
    data: {
      status: CHARACTER_STATUSES.APPROVED,
      rejectionReason: null,
      moderatedAt: new Date()
    }
  });

  await queueService.publishSnapshot();
  return character;
}

async function rejectCharacter(characterId: string, reason?: string) {
  const character = await prisma.$transaction(async (tx) => {
    const updated = await tx.character.update({
      where: { id: characterId },
      data: {
        status: CHARACTER_STATUSES.REJECTED,
        rejectionReason: reason?.trim() || null,
        moderatedAt: new Date()
      }
    });

    await queueService.removePosition(characterId, tx);

    return updated;
  });

  if (reason) {
    console.info(`Character ${characterId} rejected: ${reason}`);
  }

  await queueService.publishSnapshot();

  return character;
}

export async function deleteCharacter(characterId: string) {
  await prisma.$transaction(async (tx) => {
    const character = await tx.character.findUnique({
      where: { id: characterId },
      include: {
        rounds: {
          where: { endedAt: null },
          select: { id: true }
        }
      }
    });

    if (!character) {
      throw Object.assign(new Error('Character not found'), { code: 'CHARACTER_NOT_FOUND' });
    }

    if (character.status === CHARACTER_STATUSES.LIVE || character.rounds.length > 0) {
      throw Object.assign(new Error('Cannot delete a live character'), { code: 'CHARACTER_LIVE' });
    }

    const rounds = await tx.round.findMany({
      where: { characterId },
      select: { id: true }
    });
    const roundIds = rounds.map((round) => round.id);

    if (roundIds.length > 0) {
      await tx.vote.deleteMany({ where: { roundId: { in: roundIds } } });
      await tx.round.deleteMany({ where: { id: { in: roundIds } } });
    }

    await tx.queuePosition.deleteMany({ where: { characterId } });
    await tx.character.delete({ where: { id: characterId } });
    await queueService.compactPositions(tx);
  });

  await queueService.publishSnapshot();
}

async function skipCharacter(characterId: string, reason?: string) {
  const character = await prisma.$transaction(async (tx) => {
    const updated = await tx.character.update({
      where: { id: characterId },
      data: {
        status: CHARACTER_STATUSES.ARCHIVED,
        moderatedAt: new Date()
      }
    });

    await queueService.removePosition(characterId, tx);

    return updated;
  });

  if (reason) {
    console.info(`Character ${characterId} skipped: ${reason}`);
  }

  await queueService.publishSnapshot();

  return character;
}
