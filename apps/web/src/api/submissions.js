import { apiFetch } from './client';
export function submitCharacter(payload) {
    const formData = new FormData();
    formData.append('name', payload.name);
    if (payload.series)
        formData.append('series', payload.series);
    if (payload.description)
        formData.append('description', payload.description);
    if (payload.imageFile) {
        formData.append('image', payload.imageFile);
    }
    else if (payload.imageUrl) {
        formData.append('imageUrl', payload.imageUrl);
    }
    return apiFetch('/api/submissions', {
        method: 'POST',
        body: formData
    });
}
