const { computeMetrics, formatMetrics } = require('./metrics');

function makePR(overrides = {}) {
  return {
    id: Math.random(),
    title: 'Test PR',
    draft: false,
    mergeable_state: 'unknown',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    user: { login: 'alice' },
    labels: [],
    reviews: [],
    ...overrides,
  };
}

describe('computeMetrics', () => {
  test('returns zeroed metrics for empty repos', () => {
    const result = computeMetrics([]);
    expect(result.totalPRs).toBe(0);
    expect(result.totalDrafts).toBe(0);
    expect(result.avgAgeDays).toBe(0);
  });

  test('counts total PRs across repos', () => {
    const repoResults = [
      { repo: 'org/a', prs: [makePR(), makePR()] },
      { repo: 'org/b', prs: [makePR()] },
    ];
    const result = computeMetrics(repoResults);
    expect(result.totalPRs).toBe(3);
  });

  test('counts drafts', () => {
    const repoResults = [
      { repo: 'org/a', prs: [makePR({ draft: true }), makePR({ draft: false })] },
    ];
    const result = computeMetrics(repoResults);
    expect(result.totalDrafts).toBe(1);
  });

  test('counts mergeable PRs', () => {
    const repoResults = [
      {
        repo: 'org/a',
        prs: [
          makePR({ mergeable_state: 'clean' }),
          makePR({ mergeable_state: 'dirty' }),
        ],
      },
    ];
    const result = computeMetrics(repoResults);
    expect(result.totalMergeable).toBe(1);
  });

  test('counts approved PRs', () => {
    const repoResults = [
      {
        repo: 'org/a',
        prs: [
          makePR({ reviews: [{ state: 'APPROVED' }] }),
          makePR({ reviews: [{ state: 'CHANGES_REQUESTED' }] }),
        ],
      },
    ];
    const result = computeMetrics(repoResults);
    expect(result.totalReviewed).toBe(1);
  });

  test('computes average age in days', () => {
    const repoResults = [
      { repo: 'org/a', prs: [makePR()] }, // 2 days old
    ];
    const result = computeMetrics(repoResults);
    expect(result.avgAgeDays).toBe(2);
  });

  test('aggregates author counts', () => {
    const repoResults = [
      {
        repo: 'org/a',
        prs: [
          makePR({ user: { login: 'alice' } }),
          makePR({ user: { login: 'alice' } }),
          makePR({ user: { login: 'bob' } }),
        ],
      },
    ];
    const result = computeMetrics(repoResults);
    expect(result.authorCounts['alice']).toBe(2);
    expect(result.authorCounts['bob']).toBe(1);
  });

  test('aggregates label counts', () => {
    const repoResults = [
      {
        repo: 'org/a',
        prs: [
          makePR({ labels: [{ name: 'bug' }, { name: 'urgent' }] }),
          makePR({ labels: [{ name: 'bug' }] }),
        ],
      },
    ];
    const result = computeMetrics(repoResults);
    expect(result.labelCounts['bug']).toBe(2);
    expect(result.labelCounts['urgent']).toBe(1);
  });

  test('handles repos with empty prs array', () => {
    const repoResults = [
      { repo: 'org/a', prs: [] },
      { repo: 'org/b', prs: [makePR()] },
    ];
    const result = computeMetrics(repoResults);
    expect(result.totalPRs).toBe(1);
    expect(result.avgAgeDays).toBe(2);
  });
});

describe('formatMetrics', () => {
  test('returns a non-empty string', () => {
  
