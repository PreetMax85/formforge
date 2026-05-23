import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { SubmitResponseSchema, ListResponsesSchema } from '@repo/shared';

const successEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
  });

const responsesRouter = router({
  submit: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/responses/submit' } })
    .input(SubmitResponseSchema)
    .output(successEnvelope(z.object({ duplicate: z.boolean() })))
    .mutation(async ({ input }) => {
      return { success: true as const, message: 'Response submitted — scaffolded', data: { duplicate: false } };
    }),

  list: protectedProcedure
    .input(ListResponsesSchema)
    .output(successEnvelope(z.object({ items: z.array(z.unknown()), nextCursor: z.string().nullable() })))
    .query(async ({ input }) => {
      return { success: true as const, message: 'Responses list — scaffolded', data: { items: [], nextCursor: null } };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(successEnvelope(z.unknown().nullable()))
    .query(async ({ input }) => {
      return { success: true as const, message: 'Response by ID — scaffolded', data: null };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(successEnvelope(z.null()))
    .mutation(async ({ input }) => {
      return { success: true as const, message: 'Response deleted', data: null };
    }),
});

export { responsesRouter };
