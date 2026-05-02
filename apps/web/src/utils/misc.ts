import { getBackendBaseUrl } from '../config/publicConfig';

// Helper function
export const getRandomItem = <T,>(list: T[]): T => {
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}