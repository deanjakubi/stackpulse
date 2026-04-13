'use strict';

const {
  isMergedRecently,
  partitionMerged,
  buildMergedSummary,
  formatMergedSummary,
} = require('./merged');

function makePR({ merged_at = null, login = 'alice' } = {}) {
  return { merged_at, user: { login } };
}

const NOW = Date.now();
const daysAgo = (d) => new Date(NOW - d * 24 * 60 * 60 * 1000).toISOString();

describe('isMergedRecently', () => {
  test('returns false for open PR', () => {
    expect(isMergedRecently(makePR())).toBe(false);
  });

  test('returns true when merged within window', () => {
    expect(isMergedRecently(makePR({ merged_at: daysAgo(3) }), 7)).toBe(true);
  });

  test('returns false when merged outside window', () => {
    expect(isMergedRecently(makePR({ merged_at: daysAgo(10) }), 7)).toBe(false);
  });

  test('respects custom day window', () => {
    expect(isMergedRecently(makePR({ merged_at: daysAgo(1) }), 1)).toBe(true);
  });
});

describe('partitionMerged', () => {
  test('splits PRs correctly', () => {
    const prs = [
      makePR({ merged_at: daysAgo(2) }),
      makePR({ merged_at: null }),
      makePR({ merged_at: daysAgo(20) }),
    ];
    const { merged, rest } = partitionMerged(prs, 7);
    expect(merged).toHaveLength(1);
    expect(rest).toHaveLength(2);
  });

  test('returns empty merged when no PRs qualify', () => {
    const prs = [makePR(), makePR()];
    const { merged } = partitionMerged(prs);
    expect(merged).toHaveLength(0);
  });
});

describe('buildMergedSummary', () => {
  test('counts total and groups by author', () => {
    const prs = [
      makePR({ merged_at: daysAgo(1), login: 'alice' }),
      makePR({ merged_at: daysAgo(2), login: 'alice' }),
      makePR({ merged_at: daysAgo(3), login: 'bob' }),
    ];
    const summary = buildMergedSummary(prs);
    expect(summary.total).toBe(3);
    expect(summary.byAuthor.alice).toBe(2);
    expect(summary.byAuthor.bob).toBe(1);
  });

  test('handles missing user gracefully', () => {
    const pr = { merged_at: daysAgo(1) };
    const summary = buildMergedSummary([pr]);
    expect(summary.byAuthor.unknown).toBe(1);
  });
});

describe('formatMergedSummary', () => {
  test('includes day window and total', () => {
    const summary = { total: 5, byAuthor: { alice: 3, bob: 2 } };
    const out = formatMergedSummary(summary, 7);
    expect(out).toContain('last 7 days');
    expect(out).toContain('5');
    expect(out).toContain('alice: 3');
  });

  test('singular day label', () => {
    const out = formatMergedSummary({ total: 0, byAuthor: {} }, 1);
    expect(out).toContain('last 1 day');
    expect(out).not.toContain('days');
  });
});
