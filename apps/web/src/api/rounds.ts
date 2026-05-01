import { apiFetch } from './client';
import type { RoundState } from '../types/round';

export interface StartRoundPayload {
  characterId: string;
  mode: 'yn' | 'scale';
  scale?: {
    min: number;
    max: number;
  };
}

export interface StartRoundResponse {
  message: string;
  round: {
    id: string;
    characterId: string;
    mode: string;
    scaleMin: number;
    scaleMax: number;
    startedAt: string;
  };
}

export function startRound(payload: StartRoundPayload) {
  return apiFetch<StartRoundResponse>('/api/rounds/start', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export interface EndRoundPayload {
  roundId: string;
}

export interface EndRoundResponse {
  message: string;
  roundId: string;
  tallies: Array<{ value: number; count: number }>;
  discardedVotes?: number;
}

export function endRound(payload: EndRoundPayload) {
  return apiFetch<EndRoundResponse>('/api/rounds/end', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function skipRound(payload: EndRoundPayload) {
  return apiFetch<EndRoundResponse>('/api/rounds/skip', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

interface CurrentRoundResponse {
  round: RoundState | null;
}

export async function fetchCurrentRound() {
  const response = await apiFetch<CurrentRoundResponse>('/api/rounds/current');
  return response.round;
}
