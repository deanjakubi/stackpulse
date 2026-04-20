'use strict';

const {
  buildDailyBuckets,
  fillBuckets,
  computeBurndown,
  formatBurndownSummary,
} = require('./burndown');

function daysAgo(n) {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    created_at: daysAgo(5),
    merged_at: null,
    closed_at: null,
    ...overrides,
  };
}

describe('buildDailyBuckets', () => {
  test('returns correct number of buckets', () => {
    const buckets = buildDailyBuckets(7);
    expect(buckets).toHaveLength(7);
  });

  test('last bucket is today', () => {
    const buckets = buildDailyBuckets(3);
    const today = new Date().toISOString().slice(0, 10);
    expect(buckets[buckets.length - 1].date).toBe(today);
  });

  test('each bucket starts at zero', () => {
    const buckets = buildDailyBuckets(5);
    for (const b of buckets) {
      expect(b.opened).toBe(0);
      expect(b.closed).toBe(0);
    }
  });
});

describe('fillBuckets', () => {
  test('increments opened for PR created within window', () => {
    const buckets = buildDailyBuckets(7);
    const pr = makePR({ created_at: daysAgo(2) });
    fillBuckets([pr], buckets);
    const total = buckets.reduce((s, b) => s + b.opened, 0);
    expect(total).toBe(1);
  });

  test('increments closed for merged PR within window', () => {
    const buckets = buildDailyBuckets(7);
    const pr = makePR({ merged_at: daysAgo(1) });
    fillBuckets([pr], buckets);
    const total = buckets.reduce((s, b) => s + b.closed, 0);
    expect(total).toBe(1);
  });

  test('ignores PRs outside window', () => {
    const buckets = buildDailyBuckets(7);
    const pr = makePR({ created_at: daysAgo(30) });
    fillBuckets([pr], buckets);
    const total = buckets.reduce((s, b) => s + b.opened, 0);
    expect(total).toBe(0);
  });
});

describe('computeBurndown', () => {
  test('returns correct totals', () => {
    const prs = [
      makePR({ created_at: daysAgo(3) }),
      makePR({ created_at: daysAgo(2), merged_at: daysAgo(1) }),
    ];
    const result = computeBurndown(prs, 7);
    expect(result.totalOpened).toBe(2);
    expect(result.totalClosed).toBe(1);
    expect(result.rows).toHaveLength(7);
  });

  test('cumulative is running net', () => {
    const prs = [makePR({ created_at: daysAgo(1) })];
    const result = computeBurndown(prs, 3);
    const last = result.rows[result.rows.length - 1];
    expect(typeof last.cumulative).toBe('number');
  });
});

describe('formatBurndownSummary', () => {
  test('includes header and totals', () => {
    const prs = [makePR({ created_at: daysAgo(2) })];
    const summary = computeBurndown(prs, 7);
    const out = formatBurndownSummary(summary);
    expect(out).toContain('PR Burndown');
    expect(out).toContain('Opened');
    expect(out).toContain('Closed');
  });

  test('contains one row per day', () => {
    const summary = computeBurndown([], 5);
    const out = formatBurndownSummary(summary);
    const dataRows = out.split('\n').filter((l) => /\d{4}-\d{2}-\d{2}/.test(l));
    expect(dataRows).toHaveLength(5);
  });
});
