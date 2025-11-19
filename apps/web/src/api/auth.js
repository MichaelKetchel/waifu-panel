import { apiFetch } from './client';
export function fetchControlStatus() {
    return apiFetch('/api/auth/control');
}
export function loginControl(passcode) {
    return apiFetch('/api/auth/control', {
        method: 'POST',
        body: JSON.stringify({ passcode })
    });
}
export function logoutControl() {
    return apiFetch('/api/auth/control', {
        method: 'DELETE'
    });
}
