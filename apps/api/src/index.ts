import './instrument.js'; // Sentry — imported FIRST before all else

import { createApp } from './app.js';
import { env } from './common/config/env.js';
import { logger } from './common/logger.js';
import { db } from './common/db/index.js';
import { tokenBlocklist } from '@repo/db/schema';
import { lt } from 'drizzle-orm';

const app = createApp();

// Periodic cleanup of expired token blocklist entries
setInterval(async () => {
  try {
    await db.delete(tokenBlocklist).where(lt(tokenBlocklist.expiresAt, new Date()));
  } catch (err) {
    logger.error({ err }, '[CLEANUP] Token blocklist cleanup failed');
  }
}, 15 * 60 * 1000);

app.listen(env.PORT, () => {
  logger.info(`[API] FormForge running on port ${env.PORT} (${env.NODE_ENV})`);
  logger.info(`[API] Docs: http://localhost:${env.PORT}/docs`);
});
