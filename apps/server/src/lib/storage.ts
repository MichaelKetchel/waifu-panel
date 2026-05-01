import fs from 'node:fs';
import path from 'node:path';

import { prismaDir } from './env.js';

type StorageDriver = 'local';

const storageDriver = (process.env.STORAGE_DRIVER ?? 'local') as StorageDriver;
const rawLocalPath = process.env.STORAGE_LOCAL_PATH ?? '../../data/uploads';

export function resolveFromPrismaDir(targetPath: string) {
  return path.isAbsolute(targetPath) ? targetPath : path.resolve(prismaDir, targetPath);
}

function resolveLocalPath() {
  const absolute = resolveFromPrismaDir(rawLocalPath);

  if (!fs.existsSync(absolute)) {
    fs.mkdirSync(absolute, { recursive: true });
  }

  return absolute;
}

const uploadsDir = resolveLocalPath();

export function getUploadsDir() {
  return uploadsDir;
}

export function getPublicPathForFile(filename: string) {
  const baseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, '');
  const relativePath = `/uploads/${filename}`;
  return baseUrl ? `${baseUrl}${relativePath}` : relativePath;
}

export function getStorageDriver(): StorageDriver {
  return storageDriver;
}
