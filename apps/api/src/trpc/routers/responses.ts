import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { SubmitResponseSchema, ListResponsesSchema } from '@repo/shared';

const responsesRouter = router({
  submit: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/responses/submit' } })
    .input(SubmitResponseSchema)
    .mutation(async ({ input }) => {
      return { success: true, message: 'Response submitted — scaffolded', data: { duplicate: false } };
    }),

  list: protectedProcedure
    .input(ListResponsesSchema)
    .query(async ({ input }) => {
      return { success: true, message: 'Responses list — scaffolded', data: { items: [], nextCursor: null } };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return { success: true, message: 'Response by ID — scaffolded', data: null };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Response deleted', data: null };
    }),
});

export { responsesRouter };
