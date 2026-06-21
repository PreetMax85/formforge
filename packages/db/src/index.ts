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

pool.on('error', (err: Error) => {
  // Log to stderr — this package has no pino dependency. The API has its
  // own Drizzle client at apps/api/src/common/db/index.ts with structured
  // pino logging; this client is only used by the standalone seed script.
  console.error('[DB] Neon serverless pool error:', err.message);
});

// Drizzle SQL query log is opt-in (DEBUG_SQL=true). Off by default —
// dev pages fire ~5 queries each and the terminal becomes unreadable.
export const db = drizzle(pool, {
  schema,
  logger: process.env.DEBUG_SQL === 'true',
});
