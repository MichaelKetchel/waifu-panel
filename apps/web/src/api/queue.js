import { apiFetch } from './client';
export function fetchQueue() {
    return apiFetch('/api/characters/queue');
}
