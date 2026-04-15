'use strict';

const {
  commentsPerDay,
  classifyTrend,
  annotateCommentTrend,
  buildCommentTrendSummary,
  formatCommentTrendSummary,
} = require('./commentTrend');

function makePR(overrides = {}) {
  const daysAgo = overrides.daysAgo ?? 10;
  const created_at = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    number: 1,
    title: 'Test PR',
    comments: 5,
    created_at,
    ...overrides,
  };
}

describe('commentsPerDay', () => {
  test('returns correct rate', () => {
    const pr = makePR({ comments: 10, daysAgo: 5 });
    const rate = commentsPerDay(pr);
    expect(rate).toBeCloseTo(2, 0);
  });

  test('returns 0 for no comments', () => {
    const pr = makePR({ comments: 0, daysAgo: 5 });
    expect(commentsPerDay(pr)).toBe(0);
  });

  test('returns 0 if created_at is missing', () => {
    expect(commentsPerDay({ comments: 5, created_at: null })).toBe(0);
  });
});

describe('classifyTrend', () => {
  test('classifies hot at >=2', () => expect(classifyTrend(2)).toBe('hot'));
  test('classifies active at >=0.5', () => expect(classifyTrend(0.7)).toBe('active'));
  test('classifies quiet at >=0.1', () => expect(classifyTrend(0.2)).toBe('quiet'));
  test('classifies idle below 0.1', () => expect(classifyTrend(0.05)).toBe('idle'));
});

describe('annotateCommentTrend', () => {
  test('adds commentRate and commentTrend fields', () => {
    const pr = makePR({ comments: 20, daysAgo: 5 });
    const [result] = annotateCommentTrend([pr]);
    expect(result).toHaveProperty('commentRate');
    expect(result).toHaveProperty('commentTrend');
    expect(result.commentTrend).toBe('hot');
  });

  test('idle PR has trend idle', () => {
    const pr = makePR({ comments: 0, daysAgo: 30 });
    const [result] = annotateCommentTrend([pr]);
    expect(result.commentTrend).toBe('idle');
  });
});

describe('buildCommentTrendSummary', () => {
  test('returns correct counts', () => {
    const prs = [
      makePR({ comments: 20, daysAgo: 5 }),  // hot
      makePR({ comments: 3, daysAgo: 5 }),   // active
      makePR({ comments: 0, daysAgo: 30 }),  // idle
    ];
    const summary = buildCommentTrendSummary(prs);
    expect(summary.total).toBe(3);
    expect(summary.counts.hot).toBe(1);
    expect(summary.counts.active).toBe(1);
    expect(summary.counts.idle).toBe(1);
  });
});

describe('formatCommentTrendSummary', () => {
  test('includes header and all bands', () => {
    const prs = [makePR({ comments: 0, daysAgo: 10 })];
    const summary = buildCommentTrendSummary(prs);
    const output = formatCommentTrendSummary(summary);
    expect(output).toContain('Comment Trend Summary');
    expect(output).toContain('Hot');
    expect(output).toContain('Active');
    expect(output).toContain('Quiet');
    expect(output).toContain('Idle');
  });
});
