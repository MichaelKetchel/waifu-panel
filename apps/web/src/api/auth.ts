import { apiFetch } from './client';

interface ControlAuthResponse {
  authenticated: boolean;
}

export function fetchControlStatus() {
  return apiFetch<ControlAuthResponse>('/api/auth/control');
}

export function loginControl(passcode: string) {
  return apiFetch<ControlAuthResponse>('/api/auth/control', {
    method: 'POST',
    body: JSON.stringify({ passcode })
  });
}

export function logoutControl() {
  return apiFetch<ControlAuthResponse>('/api/auth/control', {
    method: 'DELETE'
  });
}
