import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@repo/db/schema';
import { env } from '../config/env';
import { logger } from '../logger';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err: Error) => {
  logger.error({ err }, '[DB] Neon serverless pool error');
});

// SQL query logging is opt-in (DEBUG_SQL=true) — not auto-on in dev
// because every page hit fires ~5 queries and floods the terminal.
export const db = drizzle(pool, {
  schema,
  logger: env.DEBUG_SQL,
});

/**
 * Closes the Neon serverless connection pool during API shutdown.
 */
export async function closeDb(): Promise<void> {
  await pool.end();
}
