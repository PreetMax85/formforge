import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { TimeSeriesSchema } from '@repo/shared';

const analyticsRouter = router({
  formStats: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input }) => {
      return { success: true, message: 'Form stats — scaffolded', data: null };
    }),

  fieldStats: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input }) => {
      return { success: true, message: 'Field stats — scaffolded', data: null };
    }),

  timeSeries: protectedProcedure
    .input(TimeSeriesSchema)
    .query(async ({ input }) => {
      return { success: true, message: 'Time series — scaffolded', data: null };
    }),

  dropoffFunnel: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input }) => {
      return { success: true, message: 'Dropoff funnel — scaffolded', data: [] };
    }),

  completionFunnel: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input }) => {
      return { success: true, message: 'Completion funnel — scaffolded', data: [] };
    }),

  healthScore: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input }) => {
      return { success: true, message: 'Health score — scaffolded', data: 0 };
    }),

  insights: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input }) => {
      return { success: true, message: 'Insights — scaffolded', data: [] };
    }),
});

export { analyticsRouter };
