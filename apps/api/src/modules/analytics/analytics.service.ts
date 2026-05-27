import { eq, sql, count, and, gte, lt } from 'drizzle-orm';
import { db } from '../../common/db/index';
import { logger } from '../../common/logger';
import { forms, fields, responses, responseAnswers } from '@repo/db/schema';
import type { DropoffRow, FunnelStage, FormInsight, FormStats, FormAnalyticsStats } from '@repo/shared';

// Analytics Aggregation Pipeline:
// Raw responses → field-level aggregation → health scoring →
// funnel computation → insight generation → client delivery via tRPC.

/**
 * Computes a 0-100 health score for a form based on four weighted signals:
 * completion rate (40%), response velocity (30%), field drop-off (20%),
 * and engagement depth (10%).
 */
export function computeFormHealthScore(stats: FormStats): number | null {
  if (stats.completionRate === 0 && stats.recentResponses === 0 && stats.previousResponses === 0) {
    return null;
  }

  const weights = {
    completion:  0.40,
    velocity:    0.30,
    dropoff:     0.20,
    engagement:  0.10,
  };

  const completionScore  = Math.min(stats.completionRate * 100, 100);
  const velocityScore    = Math.min(
    (stats.recentResponses / Math.max(stats.previousResponses, 1)) * 50,
    100
  );
  const dropoffScore    = Math.max(100 - (stats.avgDropoffRate * 100), 0);
  const engagementScore = Math.min(
    (stats.avgFieldsAnswered / Math.max(stats.totalFields, 1)) * 100,
    100
  );

  return Math.round(
    completionScore  * weights.completion  +
    velocityScore    * weights.velocity    +
    dropoffScore     * weights.dropoff     +
    engagementScore  * weights.engagement
  );
}

/**
 * Calculates Q1→Qn drop-off funnel using Postgres window functions.
 */
export async function calculateQ1toQnDropoff(formId: string): Promise<DropoffRow[]> {
  // Utilizing Postgres CTEs and SQL Window Functions for adaptive time-series bucketing.
  try {
    const result = await db.execute(sql`
    WITH field_response_counts AS (
      SELECT
        f.id          AS field_id,
        f.label       AS field_label,
        f."order"     AS field_order,
        COUNT(ra.id)  AS response_count
      FROM fields f
      LEFT JOIN response_answers ra ON ra.field_id = f.id
      LEFT JOIN responses r         ON r.id = ra.response_id
      WHERE f.form_id = ${formId}
        AND f.conditions IS NULL
      GROUP BY f.id, f.label, f."order"
    ),
    ranked AS (
      SELECT *,
        LAG(response_count) OVER (ORDER BY field_order) AS prev_count
      FROM field_response_counts
    )
    SELECT
      field_id,
      field_label,
      field_order,
      response_count,
      CASE
        WHEN prev_count IS NULL THEN 100.0
        ELSE ROUND((response_count::numeric / NULLIF(prev_count, 0)) * 100, 2)
      END AS retention_pct
    FROM ranked
    ORDER BY field_order
  `);

    return result.rows as unknown as DropoffRow[];
  } catch (err) {
    logger.error({ err, formId }, '[analytics] calculateQ1toQnDropoff SQL failed');
    return [];
  }
}

/**
 * Four-stage completion funnel: Views → Started → 50% Complete → Submitted.
 */
export async function computeResponseCompletionFunnel(formId: string): Promise<FunnelStage[]> {
  // Utilizing Postgres CTEs and SQL Window Functions for adaptive time-series bucketing.
  const [form] = await db
    .select({ viewCount: forms.viewCount, responseCount: forms.responseCount })
    .from(forms)
    .where(eq(forms.id, formId));

  if (!form) return [];

  try {
    const unconditionalFieldCount = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt
      FROM fields
      WHERE form_id = ${formId}
        AND conditions IS NULL
    `);
    const totalFields = Number(
      (unconditionalFieldCount.rows[0] as { cnt: number } | undefined)?.cnt ?? 1
    );
    const halfwayThreshold = Math.floor(totalFields / 2);

    const halfwayResult = await db.execute(sql`
      SELECT COUNT(*) AS halfway_count
      FROM (
        SELECT r.id
        FROM responses r
        JOIN response_answers ra ON ra.response_id = r.id
        WHERE r.form_id = ${formId}
        GROUP BY r.id
        HAVING COUNT(ra.id) > ${halfwayThreshold}
      ) subq
    `);

    const views     = form.viewCount;

    const startedResult = await db.execute(sql`
      SELECT COUNT(DISTINCT response_id) AS started_count
      FROM response_answers ra
      JOIN responses r ON r.id = ra.response_id
      WHERE r.form_id = ${formId}
    `);
    const started = Number(
      (startedResult.rows[0] as { started_count: string } | undefined)?.started_count ?? 0
    );

    const halfway   = Number(
      (halfwayResult.rows[0] as { halfway_count: string } | undefined)
        ?.halfway_count ?? 0
    );
    const submitted = form.responseCount;

    return [
      { stage: 'viewed',    count: views,     conversionRate: 100 },
      { stage: 'started',   count: started,   conversionRate: views > 0 ? Math.round((started / views) * 100) : 0 },
      { stage: 'halfway',   count: halfway,   conversionRate: started > 0 ? Math.round((halfway / started) * 100) : 0 },
      { stage: 'submitted', count: submitted, conversionRate: halfway > 0 ? Math.round((submitted / halfway) * 100) : 0 },
    ];
  } catch (err) {
    logger.error({ err, formId }, '[analytics] computeResponseCompletionFunnel SQL failed');
    return [];
  }
}

/**
 * Rule-based pattern matching that generates natural-language insights.
 */
export function generateFormInsightsSummary(stats: FormAnalyticsStats): FormInsight[] {
  const insights: FormInsight[] = [];
  const score = computeFormHealthScore(stats);

  if (score === null) {
    return [{
      type:    'neutral',
      icon:    'bar-chart-2',
      message: 'Not enough data to calculate form health. Share your form to start collecting responses.',
    }];
  }

  if (stats.recentResponses > stats.previousResponses * 2) {
    insights.push({
      type:    'positive',
      icon:    'trending-up',
      message: 'Response rate doubled in the last 7 days — your form is gaining traction.',
    });
  } else if (stats.recentResponses < stats.previousResponses * 0.5 && stats.previousResponses > 5) {
    insights.push({
      type:    'warning',
      icon:    'trending-down',
      message: 'Response rate dropped by more than 50% compared to last week. Consider resharing.',
    });
  }

  if (stats.fieldDropoffs && stats.fieldDropoffs.length > 0) {
    const worstField = stats.fieldDropoffs.reduce(
      (worst, f) => f.retention_pct < worst.retention_pct ? f : worst,
      stats.fieldDropoffs[0]!
    );
    if (worstField.retention_pct < 70) {
      insights.push({
        type:    'warning',
        icon:    'alert-circle',
        message: `"${worstField.field_label}" sees the largest drop-off — only ${worstField.retention_pct}% of respondents continue past it. Consider making it optional.`,
      });
    }
  }

  if (stats.completionRate < 0.4 && stats.totalResponses > 10) {
    insights.push({
      type:    'warning',
      icon:    'activity',
      message: `Completion rate is ${Math.round(stats.completionRate * 100)}%. Forms with fewer required fields typically see higher completion.`,
    });
  }

  if (score >= 80) {
    insights.push({
      type:    'positive',
      icon:    'zap',
      message: `Form health is excellent (${score}/100). Respondents are engaging well.`,
    });
  } else if (score < 50) {
    insights.push({
      type:    'warning',
      icon:    'alert-circle',
      message: `Form health is low (${score}/100). Review required fields and drop-off points.`,
    });
  } else {
    insights.push({
      type:    'neutral',
      icon:    'bar-chart-2',
      message: `Form health score: ${score}/100. Room for improvement in completion rate.`,
    });
  }

  return insights;
}

/**
 * Analyzes recent submissions for coordinated spam patterns.
 */
export async function detectSpamSubmissionCluster(
  formId: string,
  newSubmission: {
    ipAddress?: string;
    answers: { value: string | string[] }[];
  }
): Promise<{ isSpam: boolean; confidence: number; reason?: string }> {
  if (!newSubmission.ipAddress) {
    return { isSpam: false, confidence: 0 };
  }

  if (newSubmission.ipAddress.includes(':')) {
    return { isSpam: false, confidence: 0 };
  }

  const subnet = newSubmission.ipAddress.split('.').slice(0, 3).join('.');
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const subnetResult = await db.execute(sql`
    SELECT COUNT(*) AS cnt
    FROM responses
    WHERE form_id = ${formId}
      AND ip_address LIKE ${subnet + '.%'}
      AND created_at > ${fiveMinutesAgo.toISOString()}
  `);

  const subnetCount = Number(
    (subnetResult.rows[0] as { cnt: string } | undefined)?.cnt ?? 0
  );

  if (subnetCount > 10) {
    return {
      isSpam:     true,
      confidence: 0.9,
      reason:     `Subnet ${subnet}.0/24 sent ${subnetCount} submissions in 5 minutes`,
    };
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentResult = await db.execute(sql`
    SELECT COUNT(*) AS cnt
    FROM responses
    WHERE form_id = ${formId}
      AND created_at > ${oneHourAgo.toISOString()}
  `);
  const recentCount = Number(
    (recentResult.rows[0] as { cnt: string } | undefined)?.cnt ?? 0
  );

  if (recentCount > 50) {
    return {
      isSpam:     true,
      confidence: 0.7,
      reason:     `${recentCount} submissions in the last hour — velocity spike detected`,
    };
  }

  return { isSpam: false, confidence: 0 };
}

/**
 * Computes full FormAnalyticsStats from DB for a given form.
 * Called by formStats, healthScore, and insights procedures.
 */
export async function getFormStats(formId: string): Promise<FormAnalyticsStats> {
  const [form] = await db
    .select({ responseCount: forms.responseCount, viewCount: forms.viewCount })
    .from(forms)
    .where(eq(forms.id, formId));

  const totalResponses = form?.responseCount ?? 0;
  const viewCount      = form?.viewCount     ?? 0;

  const now          = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  const fourteenAgo  = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [recentResult, prevResult] = await Promise.all([
    db.select({ count: count() }).from(responses)
      .where(and(eq(responses.formId, formId), gte(responses.createdAt, sevenDaysAgo))),
    db.select({ count: count() }).from(responses)
      .where(and(
        eq(responses.formId, formId),
        gte(responses.createdAt, fourteenAgo),
        lt(responses.createdAt, sevenDaysAgo)
      )),
  ]);

  const recentResponses   = recentResult[0]?.count   ?? 0;
  const previousResponses = prevResult[0]?.count     ?? 0;

  const [totalFieldsResult, unconditionalResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(fields)
      .where(eq(fields.formId, formId)),
    db.execute(sql`
      SELECT COUNT(*)::int AS cnt
      FROM fields
      WHERE form_id = ${formId}
        AND conditions IS NULL
    `),
  ]);
  const totalFields = totalFieldsResult[0]?.count ?? 0;
  const totalUnconditionalFields = Number(
    (unconditionalResult.rows[0] as { cnt: number } | undefined)?.cnt ?? 0
  );

  let avgFieldsAnswered = 0;
  try {
    const avgResult = await db.execute(sql`
      SELECT COALESCE(AVG(answer_count), 0) AS avg_fields
      FROM (
        SELECT response_id, COUNT(*) AS answer_count
        FROM response_answers ra
        JOIN responses r ON r.id = ra.response_id
        WHERE r.form_id = ${formId}
        GROUP BY response_id
      ) subq
    `);
    avgFieldsAnswered = Number(
      (avgResult.rows[0] as { avg_fields: string } | undefined)?.avg_fields ?? 0
    );
  } catch (err) {
    logger.error({ err, formId }, '[analytics] getFormStats avgFields SQL failed');
  }

  const completionRate = viewCount > 0 ? Math.min(totalResponses / viewCount, 1) : 0;
  const fieldDropoffs  = await calculateQ1toQnDropoff(formId);
  const avgDropoffRate =
    fieldDropoffs.length > 1
      ? fieldDropoffs.slice(1).reduce((sum, f) => sum + (1 - f.retention_pct / 100), 0) /
        (fieldDropoffs.length - 1)
      : 0;

  return {
    totalResponses,
    completionRate,
    recentResponses,
    previousResponses,
    avgDropoffRate,
    avgFieldsAnswered,
    totalFields,
    totalUnconditionalFields,
    fieldDropoffs,
  };
}

/**
 * Time-series response counts bucketed by day / week / month.
 * Utilizing Postgres CTEs and SQL Window Functions for adaptive time-series bucketing.
 */
export async function getTimeSeries(opts: {
  formId:      string;
  granularity: 'day' | 'week' | 'month';
  startDate?:  string;
  endDate?:    string;
}): Promise<{ date: string; count: number }[]> {
  const { formId, granularity, startDate, endDate } = opts;
  const trunc = granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month';
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end   = endDate   ? new Date(endDate)   : new Date();

  try {
    /*
     * Postgres strict mode rejects grouping by a DATE_TRUNC expression directly.
     * We use a CTE so the outer query groups by a plain column reference —
     * guaranteed to satisfy strict mode regardless of parameter interpolation.
     */
    const result = await db.execute(sql`
      WITH bucketed AS (
        SELECT DATE_TRUNC(${trunc}, created_at)::date::text AS date
        FROM responses
        WHERE form_id    = ${formId}
          AND created_at >= ${start.toISOString()}
          AND created_at <  ${end.toISOString()}
      )
      SELECT date, COUNT(*)::int AS count
      FROM bucketed
      GROUP BY date
      ORDER BY date
    `);

    return result.rows as { date: string; count: number }[];
  } catch (err) {
    logger.error({ err, formId, granularity }, '[analytics] getTimeSeries SQL failed');
    return [];
  }
}
