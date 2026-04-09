const { fetchOpenPRs } = require('./github');

// Mock the https module
jest.mock('https', () => {
  const mockRequest = jest.fn();
  return { request: mockRequest };
});

const https = require('https');

function mockHttpsResponse(statusCode, body) {
  const EventEmitter = require('events');

  https.request.mockImplementation((options, callback) => {
    const res = new EventEmitter();
    res.statusCode = statusCode;

    const req = new EventEmitter();
    req.end = jest.fn(() => {
      callback(res);
      res.emit('data', JSON.stringify(body));
      res.emit('end');
    });

    return req;
  });
}

describe('fetchOpenPRs', () => {
  const samplePRs = [
    {
      number: 42,
      title: 'Fix critical bug',
      user: { login: 'alice' },
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-11T08:00:00Z',
      html_url: 'https://github.com/org/repo/pull/42',
      draft: false,
    },
    {
      number: 43,
      title: 'WIP: new feature',
      user: { login: 'bob' },
      created_at: '2024-01-12T09:00:00Z',
      updated_at: '2024-01-12T09:30:00Z',
      html_url: 'https://github.com/org/repo/pull/43',
      draft: true,
    },
  ];

  it('returns formatted PR objects', async () => {
    mockHttpsResponse(200, samplePRs);
    const result = await fetchOpenPRs('org', 'repo', 'token123');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      number: 42,
      title: 'Fix critical bug',
      author: 'alice',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-11T08:00:00Z',
      url: 'https://github.com/org/repo/pull/42',
      draft: false,
      repo: 'org/repo',
    });
    expect(result[1].draft).toBe(true);
  });

  it('rejects on non-2xx status codes', async () => {
    mockHttpsResponse(401, { message: 'Unauthorized' });
    await expect(fetchOpenPRs('org', 'repo', 'bad-token')).rejects.toThrow(
      'GitHub API error 401'
    );
  });

  it('returns empty array when no PRs exist', async () => {
    mockHttpsResponse(200, []);
    const result = await fetchOpenPRs('org', 'empty-repo', 'token123');
    expect(result).toEqual([]);
  });
});
