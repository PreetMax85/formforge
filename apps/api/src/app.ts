import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import pinoHttpLib from 'pino-http';

/** pino-http v10 type workaround: default export not recognized as callable in ESM */
const pinoHttp = pinoHttpLib as unknown as (opts?: Record<string, unknown>) => express.RequestHandler;
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createOpenApiExpressMiddleware } from 'trpc-to-openapi';
import { apiReference } from '@scalar/express-api-reference';
import { env } from './common/config/env.js';
import { logger } from './common/logger.js';
import { appRouter, openApiDocument } from './trpc/router.js';
import { createContext } from './trpc/context.js';
import { errorHandler } from './common/middleware/error.js';
import {
  globalLimiter,
  apiWriteLimiter,
  passwordResetLimiter,
} from './common/middleware/rateLimit.js';
import { optionalAuth } from './common/middleware/optionalAuth.js';
import { sql } from 'drizzle-orm';
import * as Sentry from '@sentry/node';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: env.APP_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }) as express.RequestHandler);
  app.use(globalLimiter);

  app.use('/api/auth/login',           apiWriteLimiter);
  app.use('/api/auth/signup',          apiWriteLimiter);
  app.use('/api/auth/forgot-password', passwordResetLimiter);
  app.use('/api/auth/reset-password',  passwordResetLimiter);

  app.use(optionalAuth);

  // tRPC internal endpoint
  app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));

  // OpenAPI REST adapter
  app.use('/api/v1', createOpenApiExpressMiddleware({ router: appRouter, createContext }));

  // AWS Application Load Balancer friendly alternative
  // /api path for tRPC — works with both Express and AWS ALB
  // Note: Scalar docs remain on separate path
  app.use('/api', createOpenApiExpressMiddleware({ router: appRouter, createContext }));

  // OpenAPI spec + Scalar docs
  app.get('/openapi.json', (_req, res) => res.json(openApiDocument));
  app.use('/docs', apiReference({
    url:   '/openapi.json',
    theme: 'saturn',
  }));

  // Health check
  app.get('/health', async (_req, res) => {
    let dbStatus = 'connected';
    try {
      const { db } = await import('./common/db/index.js');
      await db.execute(sql`SELECT 1`);
    } catch {
      dbStatus = 'disconnected';
    }
    res.json({
      status: 'ok',
      version: '1.0.0',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      db: dbStatus,
    });
  });

  // Sentry error handler — must be registered before custom errorHandler
  Sentry.setupExpressErrorHandler(app);

  app.use(errorHandler);

  return app;
}
