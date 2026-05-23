import { router } from './trpc.js';
import { generateOpenApiDocument } from 'trpc-to-openapi';
import { authRouter } from './routers/auth.js';
import { formsRouter } from './routers/forms.js';
import { fieldsRouter } from './routers/fields.js';
import { responsesRouter } from './routers/responses.js';
import { analyticsRouter } from './routers/analytics.js';

export const appRouter = router({
  auth:      authRouter,
  forms:     formsRouter,
  fields:    fieldsRouter,
  responses: responsesRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title:       'FormForge API',
  version:     '1.0.0',
  baseUrl:     process.env.APP_URL ?? 'http://localhost:8080',
  description: 'FormForge public API — form retrieval and submission',
  tags:        ['forms', 'responses'],
});
