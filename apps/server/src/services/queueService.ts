import { prisma } from '../lib/prisma.js';
import { queueEvents } from '../events/queueEvents.js';
import { CHARACTER_STATUSES } from '../utils/constants.js';

async function snapshot() {
  const queued = await prisma.queuePosition.findMany({
    include: {
      character: true
    },
    orderBy: {
      position: 'asc'
    }
  });

  return queued.map((entry) => ({
    id: entry.characterId,
    position: entry.position,
    status: entry.character.status,
    name: entry.character.name,
    series: entry.character.series ?? null,
    imagePath: entry.character.imagePath
  }));
}

async function updatePosition(characterId: string, position: number) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.queuePosition.findUnique({
      where: { characterId }
    });

    if (!existing) {
      throw Object.assign(new Error('Character not in queue'), { code: 'NOT_IN_QUEUE' });
    }

    await tx.queuePosition.update({
      where: { id: existing.id },
      data: { position }
    });
  });
}

async function remove(characterId: string) {
  await prisma.queuePosition.deleteMany({
    where: { characterId }
  });

  await prisma.character.update({
    where: { id: characterId },
    data: {
      status: CHARACTER_STATUSES.ARCHIVED
    }
  });
}

async function publishSnapshot() {
  const queue = await snapshot();
  queueEvents.broadcastQueueUpdate({ queue });
  return queue;
}

export const queueService = {
  snapshot,
  updatePosition,
  remove,
  publishSnapshot
};
