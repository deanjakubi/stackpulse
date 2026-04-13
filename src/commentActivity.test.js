'use strict';

const {
  getCommentCount,
  classifyCommentVolume,
  annotateCommentActivity,
  buildCommentSummary,
  formatCommentSummary,
} = require('./commentActivity');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    comments: 0,
    review_comments: 0,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('getCommentCount', () => {
  test('sums comments and review_comments', () => {
    expect(getCommentCount(makePR({ comments: 3, review_comments: 2 }))).toBe(5);
  });

  test('returns 0 when both missing', () => {
    expect(getCommentCount({})).toBe(0);
  });
});

describe('classifyCommentVolume', () => {
  test('none for 0', () => expect(classifyCommentVolume(0)).toBe('none'));
  test('low for 1-3', () => expect(classifyCommentVolume(2)).toBe('low'));
  test('medium for 4-10', () => expect(classifyCommentVolume(7)).toBe('medium'));
  test('high for 11+', () => expect(classifyCommentVolume(15)).toBe('high'));
});

describe('annotateCommentActivity', () => {
  test('adds _commentCount, _commentVolume, _daysSinceComment', () => {
    const pr = makePR({ comments: 5, review_comments: 2 });
    const [result] = annotateCommentActivity([pr]);
    expect(result._commentCount).toBe(7);
    expect(result._commentVolume).toBe('medium');
    expect(typeof result._daysSinceComment).toBe('number');
  });

  test('does not mutate original', () => {
    const pr = makePR();
    annotateCommentActivity([pr]);
    expect(pr._commentCount).toBeUndefined();
  });
});

describe('buildCommentSummary', () => {
  test('computes totals and volumes', () => {
    const prs = [
      makePR({ comments: 0 }),
      makePR({ comments: 2 }),
      makePR({ comments: 8 }),
      makePR({ comments: 12 }),
    ];
    const summary = buildCommentSummary(prs);
    expect(summary.total).toBe(22);
    expect(summary.avg).toBe(5.5);
    expect(summary.volumes.none).toBe(1);
    expect(summary.volumes.low).toBe(1);
    expect(summary.volumes.medium).toBe(1);
    expect(summary.volumes.high).toBe(1);
  });

  test('returns zero avg for empty list', () => {
    const summary = buildCommentSummary([]);
    expect(summary.avg).toBe(0);
    expect(summary.mostActive).toBeNull();
  });

  test('mostActive is the PR with highest comment count', () => {
    const prs = [makePR({ number: 1, comments: 3 }), makePR({ number: 2, comments: 15 })];
    const summary = buildCommentSummary(prs);
    expect(summary.mostActive.number).toBe(2);
  });
});

describe('formatCommentSummary', () => {
  test('returns a non-empty string', () => {
    const prs = [makePR({ comments: 4 })];
    const summary = buildCommentSummary(prs);
    const output = formatCommentSummary(summary);
    expect(typeof output).toBe('string');
    expect(output).toMatch('Comment Activity Summary');
    expect(output).toMatch('Total comments');
  });
});
