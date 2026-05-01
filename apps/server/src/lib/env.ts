import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export const serverRoot = path.resolve(moduleDir, '..', '..');
export const prismaDir = path.resolve(serverRoot, 'prisma');

dotenv.config({ path: path.join(serverRoot, '.env') });

const defaults: Record<string, string> = {
  DATABASE_URL: 'file:../../data/app.db',
  STORAGE_DRIVER: 'local',
  STORAGE_LOCAL_PATH: '../../data/uploads'
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
