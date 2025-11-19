import { apiFetch } from './client';

export interface VotePayload {
  roundId: string;
  value: number;
}

export interface VoteResponse {
  message: string;
  roundId: string;
  tallies: Array<{ value: number; count: number }>;
}

export function submitVote(payload: VotePayload) {
  return apiFetch<VoteResponse>('/api/votes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
