import path from 'node:path';

import { PrismaClient } from '@prisma/client';

import { resolveFromPrismaDir } from './storage.js';

const rawDatabaseUrl = process.env.DATABASE_URL;

if (rawDatabaseUrl?.startsWith('file:')) {
  const relativePath = rawDatabaseUrl.slice('file:'.length);

  if (!relativePath.startsWith('/')) {
    const absolutePath = resolveFromPrismaDir(relativePath);
    process.env.DATABASE_URL = `file:${absolutePath}`;
  } else {
    // normalize absolute path to avoid '..' segments
    process.env.DATABASE_URL = `file:${path.normalize(relativePath)}`;
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
