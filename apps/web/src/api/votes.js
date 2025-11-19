import { apiFetch } from './client';
export function submitVote(payload) {
    return apiFetch('/api/votes', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}
