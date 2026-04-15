'use strict';

const {
  flattenRepoPRs,
  countPerRepo,
  busiestRepo,
  buildCrossRepoSummary,
  formatCrossRepoSummary,
} = require('./crossRepo');

function makePR(n, extra = {}) {
  return { number: n, title: `PR #${n}`, state: 'open', ...extra };
}

const repoMap = {
  'org/alpha': [makePR(1), makePR(2), makePR(3)],
  'org/beta': [makePR(4)],
  'org/gamma': [makePR(5), makePR(6)],
};

describe('flattenRepoPRs', () => {
  it('merges all PRs into a single array', () => {
    const flat = flattenRepoPRs(repoMap);
    expect(flat).toHaveLength(6);
  });

  it('annotates each PR with _repo', () => {
    const flat = flattenRepoPRs(repoMap);
    expect(flat[0]._repo).toBe('org/alpha');
    expect(flat[3]._repo).toBe('org/beta');
  });

  it('returns empty array for empty map', () => {
    expect(flattenRepoPRs({})).toEqual([]);
  });

  it('does not mutate original PR objects', () => {
    const flat = flattenRepoPRs(repoMap);
    expect(repoMap['org/alpha'][0]._repo).toBeUndefined();
    expect(flat[0]._repo).toBe('org/alpha');
  });
});

describe('countPerRepo', () => {
  it('returns correct counts', () => {
    const counts = countPerRepo(repoMap);
    expect(counts['org/alpha']).toBe(3);
    expect(counts['org/beta']).toBe(1);
    expect(counts['org/gamma']).toBe(2);
  });

  it('returns empty object for empty map', () => {
    expect(countPerRepo({})).toEqual({});
  });ibe('busiestRepo', () => {
  it('returns the repo with the most PRs', () => {
    expect(busiestRepo(repoMap)).toBe('org/alpha');
  });

  it('returns null for empty map', () => {
    expect(busiestRepo({})).toBeNull();
  });

  it('handles a single repo', () => {
    expect(busiestRepo({ 'org/only': [makePR(1)] })).toBe('org/only');
  });
});

describe('buildCrossRepoSummary', () => {
  it('builds correct summary shape', () => {
    const summary = buildCrossRepoSummary(repoMap);
    expect(summary.repoCount).toBe(3);
    expect(summary.total).toBe(6);
    expect(summary.busiest).toBe('org/alpha');
    expect(summary.repos).toEqual(Object.keys(repoMap));
  });
});

describe('formatCrossRepoSummary', () => {
  it('includes header with repo count and total', () => {
    const summary = buildCrossRepoSummary(repoMap);
    const output = formatCrossRepoSummary(summary);
    expect(output).toContain('3 repos');
    expect(output).toContain('6 open PRs');
  });

  it('marks the busiest repo', () => {
    const summary = buildCrossRepoSummary(repoMap);
    const output = formatCrossRepoSummary(summary);
    expect(output).toContain('← busiest');
    expect(output).toContain('org/alpha');
  });

  it('lists all repos', () => {
    const summary = buildCrossRepoSummary(repoMap);
    const output = formatCrossRepoSummary(summary);
    expect(output).toContain('org/beta');
    expect(output).toContain('org/gamma');
  });
});
