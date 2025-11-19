import { prisma } from '../lib/prisma.js';
import { roundsEvents } from '../events/roundEvents.js';

interface SubmitVoteInput {
  roundId: string;
  value: number;
  submitterId: string;
}

export async function submitVote({ roundId, value, submitterId }: SubmitVoteInput) {
  const round = await prisma.round.findUnique({ where: { id: roundId } });

  if (!round || round.endedAt) {
    throw Object.assign(new Error('Round not active'), { code: 'ROUND_NOT_ACTIVE' });
  }

  const normalizedValue = normalizeVoteValue(round, value);

  await prisma.vote.upsert({
    where: {
      roundId_submitterId: {
        roundId,
        submitterId
      }
    },
    create: {
      roundId,
      submitterId,
      value: normalizedValue
    },
    update: {
      value: normalizedValue
    }
  });

  const tallies = await prisma.vote.groupBy({
    by: ['value'],
    where: { roundId },
    _count: true
  });

  const formattedTallies = tallies.map((item) => ({
    value: item.value,
    count: item._count
  }));

  roundsEvents.broadcastVoteProgress({
    roundId,
    tallies: formattedTallies
  });

  return {
    roundId,
    tallies: formattedTallies
  };
}

export function normalizeVoteValue(
  round: { mode: string; scaleMin: number; scaleMax: number },
  value: number
) {
  if (round.mode === 'yn') {
    return value > 0 ? 1 : 0;
  }

  const clamped = Math.max(round.scaleMin, Math.min(round.scaleMax, Math.round(value)));
  return clamped;
}
