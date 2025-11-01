import { apiFetch } from './client';
export function submitCharacter(payload) {
    return apiFetch('/api/submissions', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}
