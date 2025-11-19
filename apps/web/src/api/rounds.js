import { apiFetch } from './client';
export function startRound(payload) {
    return apiFetch('/api/rounds/start', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}
export function endRound(payload) {
    return apiFetch('/api/rounds/end', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}
export function skipRound(payload) {
    return apiFetch('/api/rounds/skip', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}
export async function fetchCurrentRound() {
    const response = await apiFetch('/api/rounds/current');
    return response.round;
}
