import './instrument.js'; // Sentry — imported FIRST before all else

import { createApp } from './app';

/**
 * Entry point for serverless hosts (Vercel). The host calls the exported app
 * once per request, so unlike index.ts there is no listen(), no startup
 * database check and no shutdown handling: the instance is paused between
 * requests and discarded when idle.
 */
export default createApp();
