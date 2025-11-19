import { apiFetch } from './client';
export function moderateCharacter(characterId, action, reason) {
    return apiFetch(`/api/moderation/${characterId}`, {
        method: 'POST',
        body: JSON.stringify({ action, reason })
    });
}
