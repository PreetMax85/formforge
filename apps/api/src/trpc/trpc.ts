import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context.js';
import { OpenApiMeta } from 'trpc-to-openapi';

const t = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
  .create();

export const router     = t.router;
export const middleware = t.middleware;

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

export const publicProcedure     = t.procedure;
export const protectedProcedure  = t.procedure.use(isAuthed);
export const optionalProcedure   = t.procedure.use(isOptionalAuthed);
