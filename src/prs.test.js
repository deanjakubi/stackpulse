const { fetchOpenPRs, fetchAllPRs } = require('./prs');

jest.mock('./github');
const { githubRequest } = require('./github');

const makePR = (overrides = {}) => ({
  number: 1,
  title: 'Fix bug',
  user: { login: 'alice' },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  draft: false,
  requested_reviewers: [{ login: 'bob' }],
  labels: [{ name: 'bug' }],
  html_url: 'https://github.com/owner/repo/pull/1',
  ...overrides,
});

describe('fetchOpenPRs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns simplified PR objects', async () => {
    githubRequest.mockResolvedValue([makePR()]);
    const prs = await fetchOpenPRs('owner', 'repo', 'token123');

    expect(githubRequest).toHaveBeenCalledWith(
      '/repos/owner/repo/pulls?state=open&per_page=50',
      'token123'
    );
    expect(prs).toHaveLength(1);
    expect(prs[0]).toMatchObject({
      number: 1,
      title: 'Fix bug',
      author: 'alice',
      draft: false,
      reviewers: ['bob'],
      labels: ['bug'],
      repo: 'owner/repo',
    });
  });

  it('handles PRs with no reviewers or labels', async () => {
    githubRequest.mockResolvedValue([
      makePR({ requested_reviewers: undefined, labels: undefined }),
    ]);
    const prs = await fetchOpenPRs('owner', 'repo', 'token');
    expect(prs[0].reviewers).toEqual([]);
    expect(prs[0].labels).toEqual([]);
  });
});

describe('fetchAllPRs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('merges PRs from multiple repos sorted by updatedAt', async () => {
    githubRequest
      .mockResolvedValueOnce([makePR({ number: 1, updated_at: '2024-01-01T00:00:00Z' })])
      .mockResolvedValueOnce([makePR({ number: 2, updated_at: '2024-01-03T00:00:00Z' })]);

    const repos = [
      { owner: 'org', repo: 'alpha' },
      { owner: 'org', repo: 'beta' },
    ];
    const prs = await fetchAllPRs(repos, 'token');

    expect(prs).toHaveLength(2);
    expect(prs[0].number).toBe(2); // more recently updated first
  });

  it('skips failed repos and still returns successful ones', async () => {
    githubRequest
      .mockRejectedValueOnce(new Error('Not found'))
      .mockResolvedValueOnce([makePR({ number: 5 })]);

    const repos = [
      { owner: 'org', repo: 'missing' },
      { owner: 'org', repo: 'present' },
    ];
    const prs = await fetchAllPRs(repos, 'token');
    expect(prs).toHaveLength(1);
    expect(prs[0].number).toBe(5);
  });
});
