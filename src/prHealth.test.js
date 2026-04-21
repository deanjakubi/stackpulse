'use strict';

const {
  computeHealthScore,
  classifyHealth,
  annotateHealth,
  buildHealthSummary,
  formatHealthSummary,
} = require('./prHealth');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    draft: false,
    isStale: false,
    isBlocked: false,
    approvalState: 'approved',
    checkState: 'success',
    requested_reviewers: [{ login: 'alice' }],
    ...overrides,
  };
}

describe('computeHealthScore', () => {
  test('perfect PR scores 100', () => {
    expect(computeHealthScore(makePR())).toBe(100);
  });

  test('draft PR loses 5 points', () => {
    expect(computeHealthScore(makePR({ draft: true }))).toBe(95);
  });

  test('stale PR loses 20 points', () => {
    expect(computeHealthScore(makePR({ isStale: true }))).toBe(80);
  });

  test('blocked PR loses 15 points', () => {
    expect(computeHealthScore(makePR({ isBlocked: true }))).toBe(85);
  });

  test('no approval loses 25 points', () => {
    expect(computeHealthScore(makePR({ approvalState: 'none' }))).toBe(75);
  });

  test('failing checks loses 25 points', () => {
    expect(computeHealthScore(makePR({ checkState: 'failure' }))).toBe(75);
  });

  test('no reviewers loses 10 points', () => {
    expect(computeHealthScore(makePR({ requested_reviewers: [] }))).toBe(90);
  });

  test('worst-case PR scores 0', () => {
    const pr = makePR({
      draft: true,
      isStale: true,
      isBlocked: true,
      approvalState: 'none',
      checkState: 'failure',
      requested_reviewers: [],
    });
    expect(computeHealthScore(pr)).toBe(0);
  });
});

describe('classifyHealth', () => {
  test('100 -> healthy', () => expect(classifyHealth(100)).toBe('healthy'));
  test('80 -> healthy', () => expect(classifyHealth(80)).toBe('healthy'));
  test('79 -> fair', () => expect(classifyHealth(79)).toBe('fair'));
  test('55 -> fair', () => expect(classifyHealth(55)).toBe('fair'));
  test('54 -> at-risk', () => expect(classifyHealth(54)).toBe('at-risk'));
  test('30 -> at-risk', () => expect(classifyHealth(30)).toBe('at-risk'));
  test('29 -> critical', () => expect(classifyHealth(29)).toBe('critical'));
  test('0 -> critical', () => expect(classifyHealth(0)).toBe('critical'));
});

describe('annotateHealth', () => {
  test('adds healthScore and healthBand to each PR', () => {
    const prs = [makePR(), makePR({ draft: true, isStale: true })];
    const result = annotateHealth(prs);
    expect(result[0].healthScore).toBe(100);
    expect(result[0].healthBand).toBe('healthy');
    expect(result[1].healthScore).toBe(75);
    expect(result[1].healthBand).toBe('fair');
  });

  test('does not mutate original PRs', () => {
    const pr = makePR();
    annotateHealth([pr]);
    expect(pr.healthScore).toBeUndefined();
  });
});

describe('buildHealthSummary', () => {
  test('counts bands and computes average', () => {
    const prs = annotateHealth([makePR(), makePR({ isStale: true, isBlocked: true, approvalState: 'none', checkState: 'failure', requested_reviewers: [], draft: true })]);
    const summary = buildHealthSummary(prs);
    expect(summary.total).toBe(2);
    expect(summary.bands.healthy).toBe(1);
    expect(summary.bands.critical).toBe(1);
    expect(summary.avg).toBe(50);
  });

  test('returns zeros for empty list', () => {
    const summary = buildHealthSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.avg).toBe(0);
  });
});

describe('formatHealthSummary', () => {
  test('includes avg score and band counts', () => {
    const prs = annotateHealth([makePR()]);
    const summary = buildHealthSummary(prs);
    const text = formatHealthSummary(summary);
    expect(text).toContain('avg score 100/100');
    expect(text).toContain('Healthy  : 1');
    expect(text).toContain('Critical : 0');
  });
});
