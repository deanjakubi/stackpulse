const { normalise, prMatchesQuery, searchPRs } = require('./search');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Fix login bug',
    user: { login: 'alice' },
    labels: [{ name: 'bug' }, { name: 'urgent' }],
    state: 'open',
    draft: false,
    ...overrides,
  };
}

describe('normalise', () => {
  it('lowercases and trims', () => {
    expect(normalise('  Hello World  ')).toBe('hello world');
  });

  it('handles null / undefined gracefully', () => {
    expect(normalise(null)).toBe('');
    expect(normalise(undefined)).toBe('');
  });
});

describe('prMatchesQuery', () => {
  it('returns true for empty query', () => {
    expect(prMatchesQuery(makePR(), '')).toBe(true);
    expect(prMatchesQuery(makePR(), '   ')).toBe(true);
  });

  it('matches on title (case-insensitive)', () => {
    const pr = makePR({ title: 'Refactor Auth Module' });
    expect(prMatchesQuery(pr, 'auth')).toBe(true);
    expect(prMatchesQuery(pr, 'AUTH')).toBe(true);
    expect(prMatchesQuery(pr, 'payment')).toBe(false);
  });

  it('matches on author login', () => {
    const pr = makePR({ user: { login: 'bob-the-dev' } });
    expect(prMatchesQuery(pr, 'bob')).toBe(true);
    expect(prMatchesQuery(pr, 'alice')).toBe(false);
  });

  it('matches on label name', () => {
    const pr = makePR({ labels: [{ name: 'needs-review' }, { name: 'backend' }] });
    expect(prMatchesQuery(pr, 'backend')).toBe(true);
    expect(prMatchesQuery(pr, 'frontend')).toBe(false);
  });

  it('handles missing labels array', () => {
    const pr = makePR({ labels: null });
    expect(prMatchesQuery(pr, 'bug')).toBe(false);
  });

  it('handles missing user object', () => {
    const pr = makePR({ user: null });
    expect(prMatchesQuery(pr, 'fix')).toBe(true); // title still matches
  });
});

describe('searchPRs', () => {
  const prs = [
    makePR({ title: 'Fix login bug', user: { login: 'alice' }, labels: [{ name: 'bug' }] }),
    makePR({ title: 'Add dashboard feature', user: { login: 'bob' }, labels: [{ name: 'feature' }] }),
    makePR({ title: 'Improve performance', user: { login: 'carol' }, labels: [{ name: 'perf' }] }),
  ];

  it('returns all PRs for empty query', () => {
    expect(searchPRs(prs, '')).toHaveLength(3);
  });

  it('filters by partial title match', () => {
    const result = searchPRs(prs, 'dashboard');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Add dashboard feature');
  });

  it('filters by author', () => {
    const result = searchPRs(prs, 'carol');
    expect(result).toHaveLength(1);
    expect(result[0].user.login).toBe('carol');
  });

  it('filters by label', () => {
    const result = searchPRs(prs, 'perf');
    expect(result).toHaveLength(1);
  });

  it('returns empty array for no matches', () => {
    expect(searchPRs(prs, 'zzznomatch')).toHaveLength(0);
  });

  it('handles non-array input gracefully', () => {
    expect(searchPRs(null, 'fix')).toEqual([]);
    expect(searchPRs(undefined, 'fix')).toEqual([]);
  });
});
