import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@repo/db/schema';
import { env } from '../config/env.js';
import { logger } from '../logger.js';

const neonClient = neon(env.DATABASE_URL);

export const db = drizzle(neonClient, {
  schema,
  logger: env.NODE_ENV === 'development',
});

const shutdown = (signal: string) => {
  logger.info(`[DB] Received ${signal}. Shutting down gracefully.`);
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
