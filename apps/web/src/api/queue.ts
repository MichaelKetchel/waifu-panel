import { apiFetch } from './client';

export interface QueueEntry {
  id: string;
  position: number;
  status: string;
  name: string;
  series: string | null;
  imagePath: string;
}

export interface QueueResponse {
  queue: QueueEntry[];
}

export function fetchQueue() {
  return apiFetch<QueueResponse>('/api/characters/queue');
}
