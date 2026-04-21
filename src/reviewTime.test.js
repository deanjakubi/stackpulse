'use strict';

const {
  getReviewWaitDays,
  classifyReviewWait,
  annotateReviewTime,
  buildReviewTimeSummary,
  formatReviewTimeSummary,
} = require('./reviewTime');

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    user: { login: 'alice' },
    created_at: daysAgo(5),
    reviews: [],
    ...overrides,
  };
}

describe('getReviewWaitDays', () => {
  test('returns days since creation when no reviews', () => {
    const pr = makePR({ created_at: daysAgo(4) });
    const days = getReviewWaitDays(pr);
    expect(days).toBeGreaterThan(3.9);
    expect(days).toBeLessThan(4.1);
  });

  test('returns days from open to first review when reviews exist', () => {
    const pr = makePR({
      created_at: daysAgo(10),
      reviews: [{ submitted_at: daysAgo(8) }, { submitted_at: daysAgo(6) }],
    });
    const days = getReviewWaitDays(pr);
    expect(days).toBeGreaterThan(1.9);
    expect(days).toBeLessThan(2.1);
  });
});

describe('classifyReviewWait', () => {
  test('fast for < 1 day', () => expect(classifyReviewWait(0.5)).toBe('fast'));
  test('normal for 1–3 days', () => expect(classifyReviewWait(2)).toBe('normal'));
  test('slow for 3–7 days', () => expect(classifyReviewWait(5)).toBe('slow'));
  test('blocked for >= 7 days', () => expect(classifyReviewWait(10)).toBe('blocked'));
  test('unknown for null', () => expect(classifyReviewWait(null)).toBe('unknown'));
});

describe('annotateReviewTime', () => {
  test('adds reviewWaitDays and reviewWaitBand', () => {
    const prs = [makePR({ created_at: daysAgo(2) })];
    const result = annotateReviewTime(prs);
    expect(result[0]).toHaveProperty('reviewWaitDays');
    expect(result[0]).toHaveProperty('reviewWaitBand');
    expect(result[0].reviewWaitBand).toBe('normal');
  });

  test('does not mutate original PR objects', () => {
    const pr = makePR();
    annotateReviewTime([pr]);
    expect(pr).not.toHaveProperty('reviewWaitDays');
  });
});

describe('buildReviewTimeSummary', () => {
  test('counts total and computes avg', () => {
    const prs = [
      makePR({ created_at: daysAgo(0.5) }),
      makePR({ created_at: daysAgo(5) }),
    ];
    const summary = buildReviewTimeSummary(prs);
    expect(summary.total).toBe(2);
    expect(summary.avgWaitDays).toBeGreaterThan(0);
    expect(summary.groups).toHaveProperty('fast');
    expect(summary.groups).toHaveProperty('slow');
  });

  test('handles empty list', () => {
    const summary = buildReviewTimeSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.avgWaitDays).toBeNull();
  });
});

describe('formatReviewTimeSummary', () => {
  test('includes header and avg wait line', () => {
    const prs = [makePR({ created_at: daysAgo(2) })];
    const summary = buildReviewTimeSummary(prs);
    const output = formatReviewTimeSummary(summary);
    expect(output).toContain('Review Wait Time Summary');
    expect(output).toContain('Avg wait');
    expect(output).toContain('normal');
  });
});
