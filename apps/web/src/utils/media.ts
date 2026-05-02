import { getBackendBaseUrl } from '../config/publicConfig';

export function resolveImageUrl(imagePath: string) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${getBackendBaseUrl()}${imagePath}`;
}
