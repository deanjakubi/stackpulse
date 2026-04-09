const {
  filterByLabel,
  filterByAuthor,
  filterDrafts,
  sortPRs,
  applyFilters,
} = require('./filter');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    draft: false,
    user: { login: 'alice' },
    labels: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('filterByLabel', () => {
  test('returns all PRs when label is null', () => {
    const prs = [makePR(), makePR({ number: 2 })];
    expect(filterByLabel(prs, null)).toHaveLength(2);
  });

  test('filters PRs matching the given label (case-insensitive)', () => {
    const prs = [
      makePR({ labels: [{ name: 'bug' }] }),
      makePR({ number: 2, labels: [{ name: 'enhancement' }] }),
    ];
    expect(filterByLabel(prs, 'BUG')).toHaveLength(1);
    expect(filterByLabel(prs, 'bug')[0].labels[0].name).toBe('bug');
  });

  test('returns empty array when no PRs match label', () => {
    const prs = [makePR({ labels: [{ name: 'docs' }] })];
    expect(filterByLabel(prs, 'bug')).toHaveLength(0);
  });
});

describe('filterByAuthor', () => {
  test('returns all PRs when author is null', () => {
    const prs = [makePR(), makePR({ number: 2, user: { login: 'bob' } })];
    expect(filterByAuthor(prs, null)).toHaveLength(2);
  });

  test('filters PRs by author login (case-insensitive)', () => {
    const prs = [
      makePR({ user: { login: 'alice' } }),
      makePR({ number: 2, user: { login: 'bob' } }),
    ];
    expect(filterByAuthor(prs, 'ALICE')).toHaveLength(1);
    expect(filterByAuthor(prs, 'alice')[0].user.login).toBe('alice');
  });
});

describe('filterDrafts', () => {
  test('excludes draft PRs when includeDrafts is false', () => {
    const prs = [makePR({ draft: false }), makePR({ number: 2, draft: true })];
    expect(filterDrafts(prs, false)).toHaveLength(1);
  });

  test('includes draft PRs when includeDrafts is true', () => {
    const prs = [makePR({ draft: false }), makePR({ number: 2, draft: true })];
    expect(filterDrafts(prs, true)).toHaveLength(2);
  });

  test('includes all PRs when includeDrafts is undefined', () => {
    const prs = [makePR({ draft: true }), makePR({ number: 2 })];
    expect(filterDrafts(prs, undefined)).toHaveLength(2);
  });
});

describe('sortPRs', () => {
  const prs = [
    makePR({ number: 1, title: 'Zebra', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-03T00:00:00Z' }),
    makePR({ number: 2, title: 'Apple', created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }),
  ];

  test('sorts by created descending by default', () => {
    const sorted = sortPRs(prs, 'created');
    expect(sorted[0].number).toBe(2);
  });

  test('sorts by updated descending', () => {
    const sorted = sortPRs(prs, 'updated');
    expect(sorted[0].number).toBe(1);
  });

  test('sorts by title alphabetically', () => {
    const sorted = sortPRs(prs, 'title');
    expect(sorted[0].title).toBe('Apple');
  });
});

describe('applyFilters', () => {
  test('applies all filters and sorting together', () => {
    const prs = [
      makePR({ number: 1, user: { login: 'alice' }, labels: [{ name: 'bug' }], draft: false, created_at: '2024-01-01T00:00:00Z' }),
      makePR({ number: 2, user: { login: 'alice' }, labels: [{ name: 'bug' }], draft: true, created_at: '2024-01-02T00:00:00Z' }),
      makePR({ number: 3, user: { login: 'bob' }, labels: [{ name: 'bug' }], draft: false, created_at: '2024-01-03T00:00:00Z' }),
    ];
    const result = applyFilters(prs, { label: 'bug', author: 'alice', includeDrafts: false, sortBy: 'created' });
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(1);
  });
});
