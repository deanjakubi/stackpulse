const {
  countByContributor,
  sortedContributors,
  contributorDateRange,
  buildContributorSummary,
  formatContributorSummary,
} = require('./contributors');

function makePR(login, created_at = '2024-03-01T10:00:00Z') {
  return { user: { login }, created_at };
}

describe('countByContributor', () => {
  it('counts PRs per author', () => {
    const prs = [makePR('alice'), makePR('alice'), makePR('bob')];
    expect(countByContributor(prs)).toEqual({ alice: 2, bob: 1 });
  });

  it('handles missing user with unknown', () => {
    const prs = [{ user: null, created_at: '2024-01-01T00:00:00Z' }];
    expect(countByContributor(prs)).toEqual({ unknown: 1 });
  });

  it('returns empty object for no PRs', () => {
    expect(countByContributor([])).toEqual({});
  });
});

describe('sortedContributors', () => {
  it('sorts by count descending', () => {
    const counts = { alice: 3, bob: 5, carol: 1 };
    const result = sortedContributors(counts);
    expect(result.map(r => r.login)).toEqual(['bob', 'alice', 'carol']);
  });

  it('breaks ties alphabetically', () => {
    const counts = { zara: 2, alice: 2 };
    const result = sortedContributors(counts);
    expect(result[0].login).toBe('alice');
  });
});

describe('contributorDateRange', () => {
  it('tracks first and last PR dates', () => {
    const prs = [
      makePR('alice', '2024-01-10T00:00:00Z'),
      makePR('alice', '2024-03-05T00:00:00Z'),
      makePR('alice', '2024-02-01T00:00:00Z'),
    ];
    const ranges = contributorDateRange(prs);
    expect(ranges.alice.first).toBe('2024-01-10T00:00:00Z');
    expect(ranges.alice.last).toBe('2024-03-05T00:00:00Z');
  });

  it('handles single PR', () => {
    const prs = [makePR('bob', '2024-06-01T00:00:00Z')];
    const ranges = contributorDateRange(prs);
    expect(ranges.bob.first).toBe(ranges.bob.last);
  });
});

describe('buildContributorSummary', () => {
  it('returns enriched sorted array', () => {
    const prs = [
      makePR('alice', '2024-01-01T00:00:00Z'),
      makePR('alice', '2024-06-01T00:00:00Z'),
      makePR('bob', '2024-03-01T00:00:00Z'),
    ];
    const summary = buildContributorSummary(prs);
    expect(summary[0].login).toBe('alice');
    expect(summary[0].count).toBe(2);
    expect(summary[0].first).toBe('2024-01-01T00:00:00Z');
  });
});

describe('formatContributorSummary', () => {
  it('returns no-contributors message for empty input', () => {
    expect(formatContributorSummary([])).toBe('No contributors found.');
  });

  it('includes login and count in output', () => {
    const summary = [{ login: 'alice', count: 3, first: '2024-01-01T00:00:00Z', last: '2024-06-01T00:00:00Z' }];
    const out = formatContributorSummary(summary);
    expect(out).toContain('alice');
    expect(out).toContain('3 PRs');
    expect(out).toContain('2024-01-01');
  });

  it('uses singular PR for count of 1', () => {
    const summary = [{ login: 'bob', count: 1, first: '2024-02-01T00:00:00Z', last: '2024-02-01T00:00:00Z' }];
    expect(formatContributorSummary(summary)).toContain('1 PR');
  });
});
