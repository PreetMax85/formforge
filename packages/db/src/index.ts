import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema/index';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (_err: Error) => {
  // Attach an idle-client error listener so Neon pool events do not crash scripts.
});

// Drizzle SQL query log is opt-in (DEBUG_SQL=true). Off by default —
// dev pages fire ~5 queries each and the terminal becomes unreadable.
export const db = drizzle(pool, {
  schema,
  logger: process.env.DEBUG_SQL === 'true',
});

/**
 * Closes the Neon serverless connection pool for scripts and tests.
 */
export async function closeDb(): Promise<void> {
  await pool.end();
}

export * from 'drizzle-orm';
