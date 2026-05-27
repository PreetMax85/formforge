import { router } from './trpc';
import { generateOpenApiDocument } from 'trpc-to-openapi';
import { authRouter } from './routers/auth';
import { formsRouter } from './routers/forms';
import { fieldsRouter } from './routers/fields';
import { responsesRouter } from './routers/responses';
import { analyticsRouter } from './routers/analytics';

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
  securitySchemes: {
    bearerAuth: {
      type:         'http',
      scheme:       'bearer',
      bearerFormat: 'JWT',
      description:  'Paste a JWT access token here to call protected endpoints from the Try-It panel.',
    },
  },
});
