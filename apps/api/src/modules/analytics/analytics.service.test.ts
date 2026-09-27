import { describe, it, expect } from 'vitest';
import { averageDropoffRate, computeFormHealthScore, generateFormInsightsSummary } from './analytics.service';
import type { DropoffRow, FormStats, FormAnalyticsStats } from '@repo/shared';

const realisticStats: FormStats = {
  completionRate:           0.62,
  recentResponses:          30,
  previousResponses:        20,
  avgDropoffRate:           0.15,
  avgFieldsAnswered:        4,
  totalFields:              6,
  totalUnconditionalFields: 5,
};

describe('computeFormHealthScore', () => {
  it('returns integer between 0 and 100', () => {
    const score = computeFormHealthScore(realisticStats);
    expect(score).not.toBeNull();
    expect(Number.isInteger(score as number)).toBe(true);
    expect(score as number).toBeGreaterThanOrEqual(0);
    expect(score as number).toBeLessThanOrEqual(100);
  });

  it('weights completion rate at 40%', () => {
    // Isolate completion's contribution: max completion (1.0), zero everything else.
    // - completionScore = 100 → contributes 100 * 0.40 = 40
    // - velocityScore   = 0   → 0
    // - dropoffScore    = 0   (avgDropoffRate = 1.0 zeroes it out)
    // - engagementScore = 0   (avgFieldsAnswered / totalFields = 0)
    const score = computeFormHealthScore({
      completionRate:           1,
      recentResponses:          0,
      previousResponses:        0,
      avgDropoffRate:           1,
      avgFieldsAnswered:        0,
      totalFields:              1,
      totalUnconditionalFields: 1,
    });
    expect(score).toBe(40);
  });
});

describe('generateFormInsightsSummary', () => {
  it('returns array of FormInsight objects', () => {
    const stats: FormAnalyticsStats = {
      ...realisticStats,
      totalResponses: 50,
    };
    const insights = generateFormInsightsSummary(stats);
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBeGreaterThan(0);
    for (const insight of insights) {
      expect(['positive', 'warning', 'neutral']).toContain(insight.type);
      expect(typeof insight.icon).toBe('string');
      expect(typeof insight.message).toBe('string');
      expect(insight.message.length).toBeGreaterThan(0);
    }
  });
});

/** A drop-off row as the SQL returns it: Postgres numerics arrive as strings. */
function dropoffRow(order: number, responseCount: number, retention: string | null): DropoffRow {
  return {
    field_id:       `field-${order}`,
    field_label:    `Question ${order}`,
    field_order:    order,
    response_count: String(responseCount) as unknown as number,
    retention_pct:  retention as unknown as number | null,
  };
}

describe('averageDropoffRate', () => {
  it('averages drop-off across fields after the first', () => {
    const rows = [dropoffRow(1, 10, '100.00'), dropoffRow(2, 8, '80.00'), dropoffRow(3, 6, '75.00')];
    expect(averageDropoffRate(rows)).toBeCloseTo((0.2 + 0.25) / 2);
  });

  it('skips fields with no retention data instead of counting them as 100% drop-off', () => {
    const rows = [dropoffRow(1, 10, '100.00'), dropoffRow(2, 0, '0.00'), dropoffRow(3, 0, null)];
    expect(averageDropoffRate(rows)).toBe(1);
  });

  it('is 0 when no field has retention data', () => {
    const rows = [dropoffRow(1, 0, null), dropoffRow(2, 0, null)];
    expect(averageDropoffRate(rows)).toBe(0);
  });
});

describe('generateFormInsightsSummary with sparse data', () => {
  it('never names a field without retention data as the worst drop-off', () => {
    const insights = generateFormInsightsSummary({
      ...realisticStats,
      totalResponses: 50,
      fieldDropoffs:  [dropoffRow(1, 50, '100.00'), dropoffRow(2, 40, '80.00'), dropoffRow(3, 0, null)],
    });
    for (const insight of insights) expect(insight.message).not.toContain('null');
    expect(insights.some((i) => i.message.includes('Question 3'))).toBe(false);
  });
});
