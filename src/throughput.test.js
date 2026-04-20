'use strict';

const {
  filterMerged,
  computeThroughput,
  classifyThroughput,
  buildThroughputSummary,
  formatThroughputSummary,
} = require('./throughput');

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    user: { login: 'alice' },
    merged_at: daysAgo(5),
    created_at: daysAgo(10),
    ...overrides,
  };
}

describe('filterMerged', () => {
  it('includes PRs merged within window', () => {
    const prs = [makePR({ merged_at: daysAgo(10) })];
    expect(filterMerged(prs, 30)).toHaveLength(1);
  });

  it('excludes PRs merged outside window', () => {
    const prs = [makePR({ merged_at: daysAgo(60) })];
    expect(filterMerged(prs, 30)).toHaveLength(0);
  });

  it('excludes unmerged PRs', () => {
    const prs = [makePR({ merged_at: null })];
    expect(filterMerged(prs, 30)).toHaveLength(0);
  });
});

describe('computeThroughput', () => {
  it('returns correct totals', () => {
    const prs = [
      makePR({ merged_at: daysAgo(5) }),
      makePR({ merged_at: daysAgo(10) }),
      makePR({ merged_at: daysAgo(40) }), // outside 30d window
    ];
    const result = computeThroughput(prs, 30);
    expect(result.totalMerged).toBe(2);
    expect(result.windowDays).toBe(30);
    expect(result.perDay).toBeCloseTo(2 / 30, 2);
    expect(result.perWeek).toBeCloseTo((2 / 30) * 7, 2);
  });
});

describe('classifyThroughput', () => {
  it('classifies high throughput', () => {
    expect(classifyThroughput(12)).toBe('high');
  });

  it('classifies medium throughput', () => {
    expect(classifyThroughput(5)).toBe('medium');
  });

  it('classifies low throughput', () => {
    expect(classifyThroughput(1)).toBe('low');
  });
});

describe('buildThroughputSummary', () => {
  it('includes level in output', () => {
    const prs = [makePR({ merged_at: daysAgo(2) })];
    const summary = buildThroughputSummary(prs, 30);
    expect(summary).toHaveProperty('level');
    expect(summary).toHaveProperty('totalMerged', 1);
  });
});

describe('formatThroughputSummary', () => {
  it('returns a non-empty string', () => {
    const prs = [makePR({ merged_at: daysAgo(2) })];
    const summary = buildThroughputSummary(prs, 30);
    const output = formatThroughputSummary(summary);
    expect(typeof output).toBe('string');
    expect(output).toMatch(/Throughput/);
    expect(output).toMatch(/Per week/);
  });
});
