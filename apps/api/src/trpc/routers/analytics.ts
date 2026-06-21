import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TimeSeriesSchema } from '@repo/shared';
import {
  getFormStats,
  getTimeSeries,
  getFieldOptionBreakdowns,
  computeFormHealthScore,
  calculateQ1toQnDropoff,
  computeResponseCompletionFunnel,
  generateFormInsightsSummary,
} from '../../modules/analytics/analytics.service';
import { assertFormOwner } from '../utils/ownership';

export const analyticsRouter = router({
  /* ── formStats ─────────────────────────────────────────────── */
  formStats: protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/analytics/{formId}/stats', tags: ['Analytics'], description: 'Aggregate form statistics: completion rate, response velocity, drop-off, engagement.' } })
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const stats = await getFormStats(input.formId);
      return { success: true as const, message: 'OK', data: stats };
    }),

  /* ── healthScore ────────────────────────────────────────────── */
  healthScore: protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/analytics/{formId}/health', tags: ['Analytics'], description: '0-100 weighted health score (completion 40% + velocity 30% + drop-off 20% + engagement 10%).' } })
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const stats = await getFormStats(input.formId);
      const score = computeFormHealthScore(stats);
      return { success: true as const, message: 'OK', data: score };
    }),

  /* ── dropoffFunnel ──────────────────────────────────────────── */
  dropoffFunnel: protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/analytics/{formId}/dropoff', tags: ['Analytics'], description: 'Q1→Qn field-level retention percentages using Postgres CTEs and window functions.' } })
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const rows = await calculateQ1toQnDropoff(input.formId);
      return { success: true as const, message: 'OK', data: rows };
    }),

  /* ── completionFunnel ───────────────────────────────────────── */
  completionFunnel: protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/analytics/{formId}/completion', tags: ['Analytics'], description: '4-stage funnel: Viewed → Started → Halfway → Submitted with conversion rates.' } })
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const stages = await computeResponseCompletionFunnel(input.formId);
      return { success: true as const, message: 'OK', data: stages };
    }),

  /* ── timeSeries ─────────────────────────────────────────────── */
  timeSeries: protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/analytics/{formId}/timeseries', tags: ['Analytics'], description: 'Response counts over time, bucketed by day / week / month.' } })
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
    .meta({ openapi: { method: 'GET', path: '/analytics/{formId}/insights', tags: ['Analytics'], description: 'Rule-based insight cards: velocity trends, drop-off warnings, health summary.' } })
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const stats    = await getFormStats(input.formId);
      const insights = generateFormInsightsSummary(stats);
      return { success: true as const, message: 'OK', data: insights };
    }),

  /* ── fieldBreakdown ─────────────────────────────────────────── */
  fieldBreakdown: protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/analytics/{formId}/breakdown', tags: ['Analytics'], description: 'Per-option answer distribution for select / multi-select / checkbox / rating fields.' } })
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const breakdown = await getFieldOptionBreakdowns(input.formId);
      return { success: true as const, message: 'OK', data: breakdown };
    }),
});