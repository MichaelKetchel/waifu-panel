import { prisma } from '../lib/prisma.js';
import { CHARACTER_STATUSES, VOTE_MODES, type VoteMode } from '../utils/constants.js';

interface StartRoundInput {
  characterId: string;
  mode: VoteMode;
  scale?: {
    min: number;
    max: number;
  };
}

export async function startRound({ characterId, mode, scale }: StartRoundInput) {
  const existingLive = await prisma.round.findFirst({
    where: { endedAt: null }
  });

  if (existingLive) {
    throw Object.assign(new Error('A round is already in progress'), { code: 'ROUND_IN_PROGRESS' });
  }

  const character = await prisma.character.update({
    where: { id: characterId },
    data: {
      status: CHARACTER_STATUSES.LIVE,
      queuePosition: {
        delete: true
      }
    }
  });

  const { min, max } = normalizeScale(mode, scale);

  const round = await prisma.round.create({
    data: {
      characterId: character.id,
      mode,
      scaleMin: min,
      scaleMax: max
    },
    include: {
      character: true
    }
  });

  return round;
}

export async function endRound(roundId: string) {
  const round = await prisma.round.update({
    where: { id: roundId },
    data: {
      endedAt: new Date(),
      character: {
        update: {
          status: CHARACTER_STATUSES.ARCHIVED
        }
      }
    },
    include: {
      votes: true
    }
  });

  const tallies = await prisma.vote.groupBy({
    by: ['value'],
    where: { roundId },
    _count: true
  });

  return {
    round,
    tallies: tallies.map((item) => ({
      value: item.value,
      count: item._count
    }))
  };
}

function normalizeScale(mode: VoteMode, scale?: { min: number; max: number }) {
  if (mode === VOTE_MODES.YES_NO) {
    return { min: 0, max: 1 };
  }

  const min = scale?.min ?? 1;
  const max = scale?.max ?? 5;

  if (min >= max) {
    return { min: 1, max: 5 };
  }

  return { min, max };
}
