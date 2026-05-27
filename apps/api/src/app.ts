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
import { env } from './common/config/env';
import { logger } from './common/logger';
import { appRouter, openApiDocument } from './trpc/router';
import { createContext } from './trpc/context';
import { errorHandler } from './common/middleware/error';
import {
  globalLimiter,
  apiWriteLimiter,
  passwordResetLimiter,
  submissionLimiter,
} from './common/middleware/rateLimit';
import { optionalAuth } from './common/middleware/optionalAuth';
import { asyncHandler } from './common/utils/asyncHandler';
import { sql } from 'drizzle-orm';
import * as Sentry from '@sentry/node';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(cors({
    origin: env.APP_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  // pino-http: log one summary line per request. Default behaviour dumps the
  // full req object including cookies (JWTs!) and the full res object including
  // every header — both noisy and a security smell. We trim to method+url and
  // statusCode, and skip /health to avoid spam.
  app.use(pinoHttp({
    logger,
    autoLogging: {
      ignore: (req: { url?: string }) => req.url === '/health',
    },
    customLogLevel: (_req: unknown, res: { statusCode: number }, err: unknown) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400)        return 'warn';
      return 'info';
    },
    customSuccessMessage: (req: { method: string; url: string }, res: { statusCode: number }) =>
      `${req.method} ${req.url} → ${res.statusCode}`,
    customErrorMessage: (req: { method: string; url: string }, res: { statusCode: number }, err: Error) =>
      `${req.method} ${req.url} ✗ ${res.statusCode} (${err.message})`,
    serializers: {
      req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },
  }) as express.RequestHandler);
  app.use(globalLimiter);

  app.use('/api/auth/login',           apiWriteLimiter);
  app.use('/api/auth/signup',          apiWriteLimiter);
  app.use('/api/auth/forgot-password', passwordResetLimiter);
  app.use('/api/auth/reset-password',  passwordResetLimiter);

  // tRPC auth endpoints also need write-rate limits
  app.use('/trpc/auth.login',  apiWriteLimiter);
  app.use('/trpc/auth.signup', apiWriteLimiter);

  // Public form submission endpoints — stricter limiter on top of globalLimiter
  app.use('/api/v1/responses/submit', submissionLimiter);
  app.use('/trpc/responses.submit',    submissionLimiter);

  // View count increment — rate-limited to prevent abuse
  app.use('/api/v1/forms/:formSlug/view', submissionLimiter);
  app.use('/trpc/forms.incrementView', submissionLimiter);

  app.use(optionalAuth);

  // tRPC internal endpoint
  app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));

  // OpenAPI REST adapter
  app.use('/api/v1', createOpenApiExpressMiddleware({ router: appRouter, createContext }));

  // OpenAPI spec + Scalar docs
  app.get('/openapi.json', (_req, res) => res.json(openApiDocument));
  app.use('/docs', apiReference({
    url:   '/openapi.json',
    theme: 'saturn',
  }));

  // Health check
  app.get('/health', asyncHandler(async (_req, res) => {
    let dbStatus = 'connected';
    try {
      const { db } = await import('./common/db/index');
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
  }));

  // Sentry error handler — must be registered before custom errorHandler
  Sentry.setupExpressErrorHandler(app);

  app.use(errorHandler);

  return app;
}
