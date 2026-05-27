import { describe, it, expect } from 'vitest';
import { computeFormHealthScore, generateFormInsightsSummary } from './analytics.service';
import type { FormStats, FormAnalyticsStats } from '@repo/shared';

const realisticStats: FormStats = {
  completionRate:    0.62,
  recentResponses:   30,
  previousResponses: 20,
  avgDropoffRate:    0.15,
  avgFieldsAnswered: 4,
  totalFields:       6,
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
      completionRate:    1,
      recentResponses:   0,
      previousResponses: 0,
      avgDropoffRate:    1,
      avgFieldsAnswered: 0,
      totalFields:       1,
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
