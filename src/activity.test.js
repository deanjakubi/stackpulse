'use strict';

const {
  latestActivityDate,
  classifyActivity,
  annotateActivity,
  buildActivitySummary,
  formatActivitySummary,
} = require('./activity');

function makePR(updatedDaysAgo, createdDaysAgo = 10) {
  const updated = new Date(Date.now() - updatedDaysAgo * 86400000).toISOString();
  const created = new Date(Date.now() - createdDaysAgo * 86400000).toISOString();
  return { updated_at: updated, created_at: created, number: 1, title: 'Test PR' };
}

describe('latestActivityDate', () => {
  test('returns the most recent date', () => {
    const pr = makePR(2, 5);
    const result = latestActivityDate(pr);
    expect(new Date(result).getTime()).toBeCloseTo(new Date(pr.updated_at).getTime(), -3);
  });

  test('returns null when no dates present', () => {
    expect(latestActivityDate({})).toBeNull();
  });
});

describe('classifyActivity', () => {
  test('returns hot for PR updated less than 1 day ago', () => {
    expect(classifyActivity(makePR(0.5))).toBe('hot');
  });

  test('returns warm for PR updated 1-3 days ago', () => {
    expect(classifyActivity(makePR(2))).toBe('warm');
  });

  test('returns cold for PR updated 3-7 days ago', () => {
    expect(classifyActivity(makePR(5))).toBe('cold');
  });

  test('returns frozen for PR updated 7+ days ago', () => {
    expect(classifyActivity(makePR(10))).toBe('frozen');
  });

  test('returns frozen when no date available', () => {
    expect(classifyActivity({})).toBe('frozen');
  });
});

describe('annotateActivity', () => {
  test('adds activityLevel to each PR', () => {
    const prs = [makePR(0.1), makePR(2), makePR(5), makePR(14)];
    const result = annotateActivity(prs);
    expect(result[0].activityLevel).toBe('hot');
    expect(result[1].activityLevel).toBe('warm');
    expect(result[2].activityLevel).toBe('cold');
    expect(result[3].activityLevel).toBe('frozen');
  });

  test('does not mutate original PRs', () => {
    const pr = makePR(1);
    annotateActivity([pr]);
    expect(pr.activityLevel).toBeUndefined();
  });
});

describe('buildActivitySummary', () => {
  test('counts PRs by activity level', () => {
    const prs = annotateActivity([makePR(0.1), makePR(2), makePR(2), makePR(14)]);
    const summary = buildActivitySummary(prs);
    expect(summary.hot).toBe(1);
    expect(summary.warm).toBe(2);
    expect(summary.cold).toBe(0);
    expect(summary.frozen).toBe(1);
  });
});

describe('formatActivitySummary', () => {
  test('formats summary into readable string', () => {
    const result = formatActivitySummary({ hot: 2, warm: 3, cold: 1, frozen: 0 });
    expect(result).toContain('Hot (<1d): 2');
    expect(result).toContain('Warm (<3d): 3');
    expect(result).toContain('Cold (<7d): 1');
    expect(result).toContain('Frozen (7d+): 0');
  });
});
