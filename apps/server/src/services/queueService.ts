import { prisma } from '../lib/prisma.js';
import { queueEvents } from '../events/queueEvents.js';
import { CHARACTER_STATUSES } from '../utils/constants.js';
import type { Prisma } from '@prisma/client';

type QueuePositionClient = typeof prisma | Prisma.TransactionClient;

interface QueuePositionRecord {
  id: string;
  characterId: string;
  position: number;
}

export function reorderQueueEntries(
  entries: QueuePositionRecord[],
  characterId: string,
  requestedPosition: number
) {
  const sorted = [...entries].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  const currentIndex = sorted.findIndex((entry) => entry.characterId === characterId);

  if (currentIndex === -1) {
    throw Object.assign(new Error('Character not in queue'), { code: 'NOT_IN_QUEUE' });
  }

  const [moved] = sorted.splice(currentIndex, 1);
  const targetIndex = Math.max(0, Math.min(Math.trunc(requestedPosition) - 1, sorted.length));
  sorted.splice(targetIndex, 0, moved);

  return sorted.map((entry, index) => ({
    id: entry.id,
    characterId: entry.characterId,
    position: index + 1
  }));
}

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
    const entries = await tx.queuePosition.findMany({
      orderBy: [{ position: 'asc' }, { insertedAt: 'asc' }]
    });

    const reordered = reorderQueueEntries(entries, characterId, position);

    for (const entry of reordered) {
      await tx.queuePosition.update({
        where: { id: entry.id },
        data: { position: entry.position }
      });
    }
  });

  return publishSnapshot();
}

async function remove(characterId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.queuePosition.deleteMany({
      where: { characterId }
    });

    await tx.character.update({
      where: { id: characterId },
      data: {
        status: CHARACTER_STATUSES.ARCHIVED
      }
    });

    await compactPositions(tx);
  });

  return publishSnapshot();
}

async function removePosition(characterId: string, client: QueuePositionClient = prisma) {
  await client.queuePosition.deleteMany({
    where: { characterId }
  });

  await compactPositions(client);
}

async function compactPositions(client: QueuePositionClient = prisma) {
  const entries = await client.queuePosition.findMany({
    orderBy: [{ position: 'asc' }, { insertedAt: 'asc' }]
  });

  for (const [index, entry] of entries.entries()) {
    const nextPosition = index + 1;
    if (entry.position === nextPosition) continue;

    await client.queuePosition.update({
      where: { id: entry.id },
      data: { position: nextPosition }
    });
  }
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
  removePosition,
  compactPositions,
  publishSnapshot
};
