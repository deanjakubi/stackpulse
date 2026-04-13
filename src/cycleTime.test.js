'use strict';

const {
  daysBetween,
  getCycleTime,
  classifyCycleTime,
  annotateCycleTime,
  buildCycleTimeSummary,
  formatCycleTimeSummary,
} = require('./cycleTime');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    created_at: '2024-01-01T00:00:00Z',
    merged_at: null,
    ...overrides,
  };
}

describe('daysBetween', () => {
  it('returns correct number of days', () => {
    expect(daysBetween('2024-01-01T00:00:00Z', '2024-01-04T00:00:00Z')).toBe(3);
  });

  it('returns 0 when dates are equal', () => {
    expect(daysBetween('2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z')).toBe(0);
  });
});

describe('getCycleTime', () => {
  it('returns null for unmerged PR', () => {
    expect(getCycleTime(makePR())).toBeNull();
  });

  it('returns days from created_at to merged_at', () => {
    const pr = makePR({ created_at: '2024-01-01T00:00:00Z', merged_at: '2024-01-03T00:00:00Z' });
    expect(getCycleTime(pr)).toBe(2);
  });
});

describe('classifyCycleTime', () => {
  it('classifies null as unmerged', () => {
    expect(classifyCycleTime(null)).toBe('unmerged');
  });
  it('classifies 0.5 days as fast', () => {
    expect(classifyCycleTime(0.5)).toBe('fast');
  });
  it('classifies 2 days as normal', () => {
    expect(classifyCycleTime(2)).toBe('normal');
  });
  it('classifies 5 days as slow', () => {
    expect(classifyCycleTime(5)).toBe('slow');
  });
  it('classifies 10 days as very slow', () => {
    expect(classifyCycleTime(10)).toBe('very slow');
  });
});

describe('annotateCycleTime', () => {
  it('adds cycleTimeDays and cycleTimeClass to each PR', () => {
    const prs = [
      makePR({ created_at: '2024-01-01T00:00:00Z', merged_at: '2024-01-02T00:00:00Z' }),
      makePR(),
    ];
    const result = annotateCycleTime(prs);
    expect(result[0].cycleTimeDays).toBe(1);
    expect(result[0].cycleTimeClass).toBe('fast');
    expect(result[1].cycleTimeDays).toBeNull();
    expect(result[1].cycleTimeClass).toBe('unmerged');
  });
});

describe('buildCycleTimeSummary', () => {
  it('returns empty summary when no merged PRs', () => {
    const summary = buildCycleTimeSummary([makePR()]);
    expect(summary.count).toBe(0);
    expect(summary.avgDays).toBeNull();
  });

  it('computes avg, min, max and buckets', () => {
    const prs = [
      makePR({ created_at: '2024-01-01T00:00:00Z', merged_at: '2024-01-02T00:00:00Z' }), // 1 day fast
      makePR({ created_at: '2024-01-01T00:00:00Z', merged_at: '2024-01-05T00:00:00Z' }), // 4 days slow
    ];
    const summary = buildCycleTimeSummary(prs);
    expect(summary.count).toBe(2);
    expect(summary.avgDays).toBeCloseTo(2.5);
    expect(summary.minDays).toBe(1);
    expect(summary.maxDays).toBe(4);
    expect(summary.buckets.fast).toBe(1);
    expect(summary.buckets.slow).toBe(1);
  });
});

describe('formatCycleTimeSummary', () => {
  it('returns message when no merged PRs', () => {
    expect(formatCycleTimeSummary({ count: 0 })).toBe('No merged PRs found.');
  });

  it('includes avg, min, max in output', () => {
    const summary = { count: 2, avgDays: 2.5, minDays: 1, maxDays: 4, buckets: { fast: 1, normal: 0, slow: 1, 'very slow': 0 } };
    const output = formatCycleTimeSummary(summary);
    expect(output).toContain('Avg');
    expect(output).toContain('2.5');
    expect(output).toContain('Min');
    expect(output).toContain('Max');
  });
});
