import { apiFetch } from './client';

export interface SubmissionInput {
  name: string;
  series?: string;
  description?: string;
  imagePath: string;
}

export interface SubmissionResponse {
  message: string;
  submissionId: string;
  queuePosition: number;
  remainingSlots: number;
  status: string;
}

export function submitCharacter(payload: SubmissionInput) {
  return apiFetch<SubmissionResponse>('/api/submissions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
