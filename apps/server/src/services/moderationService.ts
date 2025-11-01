import { prisma } from '../lib/prisma.js';
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

  return character;
}

async function rejectCharacter(characterId: string, reason?: string) {
  const character = await prisma.character.update({
    where: { id: characterId },
    data: {
      status: CHARACTER_STATUSES.REJECTED,
      moderatedAt: new Date(),
      description: appendModerationNote('Rejected', reason)
    }
  });

  await prisma.queuePosition.deleteMany({ where: { characterId } });

  return character;
}

async function skipCharacter(characterId: string, reason?: string) {
  const character = await prisma.character.update({
    where: { id: characterId },
    data: {
      status: CHARACTER_STATUSES.ARCHIVED,
      moderatedAt: new Date(),
      description: appendModerationNote('Skipped', reason)
    }
  });

  await prisma.queuePosition.deleteMany({ where: { characterId } });

  return character;
}

function appendModerationNote(label: string, reason?: string) {
  if (!reason) {
    return undefined;
  }

  return `${label} — ${reason}`;
}
