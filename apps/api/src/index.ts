import './instrument.js'; // Sentry — imported FIRST before all else

import * as Sentry from '@sentry/node';
import { createApp } from './app';
import { env } from './common/config/env';
import { logger } from './common/logger';
import { closeDb, db } from './common/db/index';
import { tokenBlocklist } from '@repo/db/schema';
import { lt } from 'drizzle-orm';

import { sql } from 'drizzle-orm';

const app = createApp();

// Verify database connectivity before accepting traffic
try {
  await db.execute(sql`SELECT 1`);
  logger.info('[API] Database connection verified');
} catch (err) {
  logger.error({ err }, '[API] Database connection failed — aborting startup');
  process.exit(1);
}

// Periodic cleanup of expired token blocklist entries
const cleanupTimer = setInterval(async () => {
  try {
    await db.delete(tokenBlocklist).where(lt(tokenBlocklist.expiresAt, new Date()));
  } catch (err) {
    logger.error({ err }, '[CLEANUP] Token blocklist cleanup failed');
  }
}, 15 * 60 * 1000);

const server = app.listen(env.PORT, () => {
  logger.info(`[API] FormForge running on port ${env.PORT} (${env.NODE_ENV})`);
  logger.info(`[API] Docs: http://localhost:${env.PORT}/docs`);
});

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return; // ignore repeated Ctrl+C
  shuttingDown = true;

  logger.info(`[API] Received ${signal} — shutting down gracefully.`);
  clearInterval(cleanupTimer);

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
