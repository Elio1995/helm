// Prisma client singleton. Required pattern under Next.js dev mode — without
// the global cache, every HMR pass would spin a new client and exhaust the
// SQLite file lock (or open dozens of pools against Postgres in prod).

import { PrismaClient } from '@prisma/client';

declare global {
  var __helmPrisma: PrismaClient | undefined;
}

export const db: PrismaClient =
  globalThis.__helmPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__helmPrisma = db;
}
