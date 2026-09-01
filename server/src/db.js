/**
 * Scribe AI — Centralized Prisma ORM Client Singleton
 * Prevents multiple instances of PrismaClient in development & production,
 * and manages PostgreSQL connection pooling safely for Supabase.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__scribe_prisma__ ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__scribe_prisma__ = prisma;
}

export default prisma;
