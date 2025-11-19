const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
export function resolveImageUrl(imagePath) {
    if (!imagePath)
        return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    const base = API_BASE.replace(/\/$/, '');
    return `${base}${imagePath}`;
}
