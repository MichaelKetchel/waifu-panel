import { apiFetch } from './client';

export type ModerationAction = 'approve' | 'reject' | 'skip';

export interface ModerationResponse {
  message: string;
  characterId: string;
  status: string;
}

export function moderateCharacter(characterId: string, action: ModerationAction, reason?: string) {
  return apiFetch<ModerationResponse>(`/api/moderation/${characterId}`, {
    method: 'POST',
    body: JSON.stringify({ action, reason })
  });
}
