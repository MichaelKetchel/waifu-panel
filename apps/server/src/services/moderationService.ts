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
      status: CHARACTER_STATUSES.APPROVED
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
