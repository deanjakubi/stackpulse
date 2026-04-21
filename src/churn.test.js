'use strict';

const { getChurnScore, classifyChurn, annotateChurn, groupByChurn, buildChurnSummary, formatChurnSummary } = require('./churn');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    changed_files: 3,
    additions: 50,
    deletions: 20,
    ...overrides,
  };
}

describe('getChurnScore', () => {
  it('returns files, additions, deletions, lines', () => {
    const pr = makePR({ changed_files: 5, additions: 100, deletions: 40 });
    expect(getChurnScore(pr)).toEqual({ files: 5, additions: 100, deletions: 40, lines: 140 });
  });

  it('defaults missing fields to 0', () => {
    expect(getChurnScore({})).toEqual({ files: 0, additions: 0, deletions: 0, lines: 0 });
  });
});

describe('classifyChurn', () => {
  it('returns low for small PRs', () => {
    expect(classifyChurn(makePR({ changed_files: 2, additions: 10, deletions: 5 }))).toBe('low');
  });

  it('returns medium for moderate PRs', () => {
    expect(classifyChurn(makePR({ changed_files: 7, additions: 80, deletions: 30 }))).toBe('medium');
  });

  it('returns high for large PRs by files', () => {
    expect(classifyChurn(makePR({ changed_files: 25, additions: 200, deletions: 100 }))).toBe('high');
  });

  it('returns very-high for very large PRs by lines', () => {
    expect(classifyChurn(makePR({ changed_files: 10, additions: 1500, deletions: 600 }))).toBe('very-high');
  });

  it('returns very-high when files >= 50', () => {
    expect(classifyChurn(makePR({ changed_files: 55, additions: 10, deletions: 5 }))).toBe('very-high');
  });
});

describe('annotateChurn', () => {
  it('adds _churn and _churnScore to each PR', () => {
    const prs = [makePR(), makePR({ changed_files: 25, additions: 600, deletions: 200 })];
    const result = annotateChurn(prs);
    expect(result[0]._churn).toBe('low');
    expect(result[1]._churn).toBe('very-high');
    expect(result[0]._churnScore.files).toBe(3);
  });
});

describe('groupByChurn', () => {
  it('groups PRs by churn level', () => {
    const prs = annotateChurn([
      makePR(),
      makePR({ changed_files: 25, additions: 600, deletions: 200 }),
      makePR({ changed_files: 7, additions: 80, deletions: 30 }),
    ]);
    const groups = groupByChurn(prs);
    expect(groups.low).toHaveLength(1);
    expect(groups['very-high']).toHaveLength(1);
    expect(groups.medium).toHaveLength(1);
    expect(groups.high).toHaveLength(0);
  });
});

describe('buildChurnSummary', () => {
  it('returns groups, total, and topChurners', () => {
    const prs = [makePR(), makePR({ changed_files: 60, additions: 2500, deletions: 500 })];
    const summary = buildChurnSummary(prs);
    expect(summary.total).toBe(2);
    expect(summary.topChurners[0]._churnScore.lines).toBeGreaterThan(summary.topChurners[1]?._churnScore?.lines ?? -1);
  });
});

describe('formatChurnSummary', () => {
  it('returns a non-empty string', () => {
    const prs = [makePR(), makePR({ changed_files: 25, additions: 600, deletions: 200 })];
    const summary = buildChurnSummary(prs);
    const output = formatChurnSummary(summary);
    expect(typeof output).toBe('string');
    expect(output).toContain('Churn Summary');
    expect(output).toContain('very-high');
  });
});
