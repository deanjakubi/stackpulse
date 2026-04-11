const { buildRepoDigest, buildDigest, formatDigest } = require('./digest');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    state: 'open',
    draft: false,
    user: { login: 'alice' },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

describe('buildRepoDigest', () => {
  it('counts open and draft PRs', () => {
    const prs = [
      makePR({ state: 'open' }),
      makePR({ state: 'open', draft: true }),
      makePR({ state: 'closed' }),
    ];
    const result = buildRepoDigest('org/repo', prs);
    expect(result.repo).toBe('org/repo');
    expect(result.total).toBe(3);
    expect(result.open).toBe(2);
    expect(result.drafts).toBe(1);
  });

  it('collects unique authors', () => {
    const prs = [
      makePR({ user: { login: 'alice' } }),
      makePR({ user: { login: 'bob' } }),
      makePR({ user: { login: 'alice' } }),
    ];
    const result = buildRepoDigest('org/repo', prs);
    expect(result.authors).toEqual(expect.arrayContaining(['alice', 'bob']));
    expect(result.authors.length).toBe(2);
  });

  it('handles empty PR list', () => {
    const result = buildRepoDigest('org/empty', []);
    expect(result.total).toBe(0);
    expect(result.authors).toEqual([]);
  });
});

describe('buildDigest', () => {
  it('aggregates across multiple repos', () => {
    const prsByRepo = {
      'org/a': [makePR(), makePR({ user: { login: 'bob' } })],
      'org/b': [makePR({ state: 'closed' })],
    };
    const digest = buildDigest(prsByRepo);
    expect(digest.totalRepos).toBe(2);
    expect(digest.totalPRs).toBe(3);
    expect(digest.totalOpen).toBe(2);
    expect(digest.uniqueAuthors).toBe(2);
  });

  it('includes generatedAt timestamp', () => {
    const digest = buildDigest({});
    expect(typeof digest.generatedAt).toBe('string');
    expect(() => new Date(digest.generatedAt)).not.toThrow();
  });
});

describe('formatDigest', () => {
  it('returns a non-empty string', () => {
    const digest = buildDigest({ 'org/repo': [makePR()] });
    const output = formatDigest(digest);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes repo slug in output', () => {
    const digest = buildDigest({ 'org/myrepo': [makePR()] });
    const output = formatDigest(digest);
    expect(output).toContain('myrepo');
  });

  it('includes summary counts', () => {
    const digest = buildDigest({ 'org/repo': [makePR(), makePR()] });
    const output = formatDigest(digest);
    expect(output).toMatch(/PRs/);
    expect(output).toMatch(/Repos/);
  });
});
