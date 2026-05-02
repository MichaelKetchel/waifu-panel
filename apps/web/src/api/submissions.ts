import { apiFetch } from './client';
import type { CharacterStatus } from '@waifu-panel/shared';

export interface SubmissionInput {
  name: string;
  series?: string;
  description?: string;
  submitterAlias?: string;
  imageFile?: File | null;
  imageUrl?: string;
}

export interface SubmissionResponse {
  message: string;
  submissionId: string;
  queuePosition: number;
  remainingSlots: number;
  status: CharacterStatus;
  imagePath: string;
  submissions: SubmitterSubmission[];
  submissionLimit: number;
}

export interface SubmitterSubmission {
  submissionId: string;
  name: string;
  series: string | null;
  imagePath: string;
  status: CharacterStatus;
  queuePosition: number | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface MySubmissionsResponse {
  submissions: SubmitterSubmission[];
  remainingSlots: number;
  submissionLimit: number;
}

export function submitCharacter(payload: SubmissionInput) {
  const formData = new FormData();
  formData.append('name', payload.name);
  if (payload.series) formData.append('series', payload.series);
  if (payload.description) formData.append('description', payload.description);
  if (payload.submitterAlias) formData.append('submitterAlias', payload.submitterAlias);
  if (payload.imageFile) {
    formData.append('image', payload.imageFile);
  } else if (payload.imageUrl) {
    formData.append('imageUrl', payload.imageUrl);
  }

  return apiFetch<SubmissionResponse>('/api/submissions', {
    method: 'POST',
    body: formData
  });
}

export function fetchMySubmissions() {
  return apiFetch<MySubmissionsResponse>('/api/submissions/mine');
}

export function deleteSubmission(submissionId: string) {
  return apiFetch<{ message: string; submissionId: string }>(`/api/submissions/${submissionId}`, {
    method: 'DELETE'
  });
}
