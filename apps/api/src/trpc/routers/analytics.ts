import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TimeSeriesSchema } from '@repo/shared';
import {
  getFormStats,
  getTimeSeries,
  computeFormHealthScore,
  calculateQ1toQnDropoff,
  computeResponseCompletionFunnel,
  generateFormInsightsSummary,
} from '../../modules/analytics/analytics.service';
import { assertFormOwner } from '../utils/ownership';

export const analyticsRouter = router({
  /* ── formStats ─────────────────────────────────────────────── */
  formStats: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const stats = await getFormStats(input.formId);
      return { success: true as const, message: 'OK', data: stats };
    }),

  /* ── healthScore ────────────────────────────────────────────── */
  healthScore: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const stats = await getFormStats(input.formId);
      const score = computeFormHealthScore(stats);
      return { success: true as const, message: 'OK', data: score };
    }),

  /* ── dropoffFunnel ──────────────────────────────────────────── */
  dropoffFunnel: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const rows = await calculateQ1toQnDropoff(input.formId);
      return { success: true as const, message: 'OK', data: rows };
    }),

  /* ── completionFunnel ───────────────────────────────────────── */
  completionFunnel: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const stages = await computeResponseCompletionFunnel(input.formId);
      return { success: true as const, message: 'OK', data: stages };
    }),

  /* ── timeSeries ─────────────────────────────────────────────── */
  timeSeries: protectedProcedure
    .input(TimeSeriesSchema)
    .query(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const series = await getTimeSeries({
        formId:      input.formId,
        granularity: input.granularity,
        startDate:   input.startDate,
        endDate:     input.endDate,
      });
      return { success: true as const, message: 'OK', data: series };
    }),

  /* ── insights ───────────────────────────────────────────────── */
  insights: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const stats    = await getFormStats(input.formId);
      const insights = generateFormInsightsSummary(stats);
      return { success: true as const, message: 'OK', data: insights };
    }),
});