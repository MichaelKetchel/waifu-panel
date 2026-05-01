import { prisma } from '../lib/prisma.js';
import { queueService } from './queueService.js';
import { roundsEvents } from '../events/roundEvents.js';
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
  const { min, max } = normalizeScale(mode, scale);

  const round = await prisma.$transaction(async (tx) => {
    const existingLive = await tx.round.findFirst({
      where: { endedAt: null }
    });

    if (existingLive) {
      throw Object.assign(new Error('A round is already in progress'), { code: 'ROUND_IN_PROGRESS' });
    }

    const character = await tx.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      throw Object.assign(new Error('Character not found'), { code: 'CHARACTER_NOT_FOUND' });
    }

    if (!isStartableCharacterStatus(character.status)) {
      throw Object.assign(new Error('Character must be approved before starting a round'), {
        code: 'CHARACTER_NOT_APPROVED'
      });
    }

    const previousRound = await tx.round.findUnique({
      where: { characterId }
    });

    if (previousRound) {
      throw Object.assign(new Error('Character already has a round'), { code: 'CHARACTER_ALREADY_USED' });
    }

    await tx.queuePosition.deleteMany({ where: { characterId } });
    await tx.character.update({
      where: { id: characterId },
      data: { status: CHARACTER_STATUSES.LIVE }
    });

    return tx.round.create({
      data: {
        characterId,
        mode,
        scaleMin: min,
        scaleMax: max
      },
      include: {
        character: true
      }
    });
  });

  await queueService.publishSnapshot();

  roundsEvents.broadcastRoundStart({
    round: {
      id: round.id,
      characterId: round.characterId,
      mode: round.mode,
      scaleMin: round.scaleMin,
      scaleMax: round.scaleMax,
      startedAt: round.startedAt.toISOString(),
      character: {
        id: round.character.id,
        name: round.character.name,
        imagePath: round.character.imagePath,
        series: round.character.series ?? null
      }
    }
  });

  return round;
}

export async function endRound(roundId: string) {
  const activeRound = await prisma.round.findUnique({
    where: { id: roundId }
  });

  if (!activeRound) {
    throw Object.assign(new Error('Round not found'), { code: 'ROUND_NOT_FOUND' });
  }

  if (activeRound.endedAt) {
    throw Object.assign(new Error('Round not active'), { code: 'ROUND_NOT_ACTIVE' });
  }

  const formattedTallies = await getFormattedTallies(roundId);

  const round = await prisma.round.update({
    where: { id: roundId },
    data: {
      endedAt: new Date(),
      character: {
        update: {
          status: CHARACTER_STATUSES.ARCHIVED
        }
      }
    }
  });

  roundsEvents.broadcastRoundEnd({
    roundId: round.id,
    tallies: formattedTallies
  });

  return {
    round,
    tallies: formattedTallies
  };
}

export async function skipRound(roundId: string, reason?: string) {
  const activeRound = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      character: true
    }
  });

  if (!activeRound) {
    throw Object.assign(new Error('Round not found'), { code: 'ROUND_NOT_FOUND' });
  }

  if (activeRound.endedAt) {
    throw Object.assign(new Error('Round not active'), { code: 'ROUND_NOT_ACTIVE' });
  }

  const result = await prisma.$transaction(async (tx) => {
    const deletedVotes = await tx.vote.deleteMany({
      where: { roundId }
    });

    const round = await tx.round.update({
      where: { id: roundId },
      data: {
        endedAt: new Date(),
        character: {
          update: {
            status: CHARACTER_STATUSES.ARCHIVED
          }
        }
      }
    });

    return {
      round,
      discardedVotes: deletedVotes.count
    };
  });

  roundsEvents.broadcastCharacterSkipped({
    characterId: activeRound.characterId,
    roundId,
    reason
  });

  roundsEvents.broadcastRoundEnd({
    roundId,
    tallies: []
  });

  return {
    ...result,
    tallies: []
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

export function isStartableCharacterStatus(status: string) {
  return status === CHARACTER_STATUSES.APPROVED;
}

async function getFormattedTallies(roundId: string) {
  const tallies = await prisma.vote.groupBy({
    by: ['value'],
    where: { roundId },
    _count: true
  });

  return tallies.map((item) => ({
    value: item.value,
    count: item._count
  }));
}

export async function getCurrentRound() {
  const round = await prisma.round.findFirst({
    where: { endedAt: null },
    include: {
      character: true
    },
    orderBy: {
      startedAt: 'desc'
    }
  });

  if (!round) {
    return null;
  }

  const tallies = await prisma.vote.groupBy({
    by: ['value'],
    where: { roundId: round.id },
    _count: true
  });

  return {
    id: round.id,
    character: {
      id: round.character.id,
      name: round.character.name,
      imagePath: round.character.imagePath,
      series: round.character.series ?? null
    },
    mode: round.mode,
    scale: {
      min: round.scaleMin,
      max: round.scaleMax
    },
    startedAt: round.startedAt.toISOString(),
    tallies: tallies.map((item) => ({ value: item.value, count: item._count })),
    status: 'live'
  };
}
