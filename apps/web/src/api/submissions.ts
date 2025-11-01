import { apiFetch } from './client';
export interface SubmissionInput {
  name: string;
  series?: string;
  description?: string;
  imageFile?: File | null;
  imageUrl?: string;
}

export interface SubmissionResponse {
  message: string;
  submissionId: string;
  queuePosition: number;
  remainingSlots: number;
  status: string;
  imagePath: string;
}

export function submitCharacter(payload: SubmissionInput) {
  const formData = new FormData();
  formData.append('name', payload.name);
  if (payload.series) formData.append('series', payload.series);
  if (payload.description) formData.append('description', payload.description);
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
