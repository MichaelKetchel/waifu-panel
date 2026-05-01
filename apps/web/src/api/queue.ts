import { apiFetch } from './client';
import type { QueueEntry } from '@waifu-panel/shared';

export type { QueueEntry };

export interface QueueResponse {
  queue: QueueEntry[];
}

export function fetchQueue() {
  return apiFetch<QueueResponse>('/api/characters/queue');
}

export function moveQueueItem(characterId: string, position: number) {
  return apiFetch<QueueResponse>(`/api/characters/queue/${characterId}`, {
    method: 'PATCH',
    body: JSON.stringify({ position })
  });
}
