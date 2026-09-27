import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';
import { OpenApiMeta } from 'trpc-to-openapi';
import { ApiError } from '@repo/shared';

const t = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
  .create();

export const router     = t.router;
export const middleware = t.middleware;

const TRPC_CODE_BY_STATUS: Partial<Record<number, TRPCError['code']>> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'TOO_MANY_REQUESTS',
};

/**
 * Services throw ApiError (shared with the frontend), which tRPC doesn't know.
 * Without this, every ApiError reached the client as a 500
 * INTERNAL_SERVER_ERROR: a wrong password, a missing form, a forbidden edit.
 */
const translateApiErrors = middleware(async ({ next }) => {
  const result = await next();
  if (!result.ok && result.error.cause instanceof ApiError) {
    const code = TRPC_CODE_BY_STATUS[result.error.cause.statusCode];
    if (code) {
      throw new TRPCError({ code, message: result.error.cause.message, cause: result.error.cause });
    }
  }
  return result;
});

const baseProcedure = t.procedure.use(translateApiErrors);

const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  });
});

const isOptionalAuthed = middleware(async ({ ctx, next }) => {
  return next({ ctx });
});

export const publicProcedure     = baseProcedure;
export const protectedProcedure  = baseProcedure.use(isAuthed);
export const optionalProcedure   = baseProcedure.use(isOptionalAuthed);
