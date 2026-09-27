import './instrument.js'; // Sentry — imported FIRST before all else

import * as Sentry from '@sentry/node';
import { createApp } from './app';
import { env } from './common/config/env';
import { logger } from './common/logger';
import { closeDb, db } from './common/db/index';
import { sql } from 'drizzle-orm';

const app = createApp();

// Check the database once at startup so a bad DATABASE_URL shows up in the
// logs immediately. A failure is a warning, not a crash: the pool reconnects
// per query, so the server recovers on its own when the database comes back.
// There is deliberately no periodic keep-alive query. Neon only scales to zero
// after 5 idle minutes, and a query every 25 s kept it awake around the clock,
// which exhausted Neon Free's monthly compute allowance.
try {
  await db.execute(sql`SELECT 1`);
  logger.info('[API] Database connection verified');
} catch (err) {
  logger.warn({ err }, '[API] Database unreachable at startup — serving anyway');
}

const server = app.listen(env.PORT, () => {
  logger.info(`[API] FormForge running on port ${env.PORT} (${env.NODE_ENV})`);
  logger.info(`[API] Docs: http://localhost:${env.PORT}/docs`);
});

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return; // ignore repeated Ctrl+C
  shuttingDown = true;

  logger.info(`[API] Received ${signal} — shutting down gracefully.`);

  // Stop accepting new connections; wait for in-flight requests (max 5s).
  await new Promise<void>((resolve) => {
    let resolved = false;
    const done = () => { if (!resolved) { resolved = true; resolve(); } };
    server.close(() => done());
    setTimeout(done, 5_000).unref();
  });

  // Flush Sentry queue (no-op if Sentry isn't configured).
  try { await Sentry.close(2_000); } catch { /* ignore */ }
  try { await closeDb(); } catch (err) {
    logger.error({ err }, '[API] Failed to close database pool');
  }

  process.exit(0);
}

process.on('SIGINT',  () => { void shutdown('SIGINT');  });
process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
