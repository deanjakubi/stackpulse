const { cachedGithubRequestWithRetry } = require('./cachedGithubWithRetry');
const cache = require('./cache');
const github = require('./github');

jest.mock('./cache');
jest.mock('./github');

describe('cachedGithubRequestWithRetry', () => {
  const TOKEN = 'test-token';
  const PATH = '/repos/org/repo/pulls';
  const MOCK_DATA = [{ id: 1, title: 'Fix bug' }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns cached data without calling githubRequest', async () => {
    cache.getCached.mockResolvedValue(MOCK_DATA);

    const result = await cachedGithubRequestWithRetry(PATH, TOKEN);

    expect(result).toEqual(MOCK_DATA);
    expect(github.githubRequest).not.toHaveBeenCalled();
    expect(cache.setCached).not.toHaveBeenCalled();
  });

  it('fetches from GitHub and caches when no cached value', async () => {
    cache.getCached.mockResolvedValue(null);
    github.githubRequest.mockResolvedValue(MOCK_DATA);
    cache.setCached.mockResolvedValue(undefined);

    const result = await cachedGithubRequestWithRetry(PATH, TOKEN, { ttl: 120 });

    expect(result).toEqual(MOCK_DATA);
    expect(github.githubRequest).toHaveBeenCalledWith(PATH, TOKEN);
    expect(cache.setCached).toHaveBeenCalledWith(PATH, MOCK_DATA, 120);
  });

  it('retries on 503 and returns data after recovery', async () => {
    const err = Object.assign(new Error('Service Unavailable'), { statusCode: 503 });
    cache.getCached.mockResolvedValue(null);
    github.githubRequest
      .mockRejectedValueOnce(err)
      .mockResolvedValue(MOCK_DATA);
    cache.setCached.mockResolvedValue(undefined);

    const result = await cachedGithubRequestWithRetry(PATH, TOKEN, { baseDelay: 1 });

    expect(result).toEqual(MOCK_DATA);
    expect(github.githubRequest).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries on persistent 500 error', async () => {
    const err = Object.assign(new Error('Internal Server Error'), { statusCode: 500 });
    cache.getCached.mockResolvedValue(null);
    github.githubRequest.mockRejectedValue(err);

    await expect(
      cachedGithubRequestWithRetry(PATH, TOKEN, { maxRetries: 1, baseDelay: 1 })
    ).rejects.toMatchObject({ statusCode: 500 });

    expect(github.githubRequest).toHaveBeenCalledTimes(2);
    expect(cache.setCached).not.toHaveBeenCalled();
  });

  it('does not retry on 404', async () => {
    const err = Object.assign(new Error('Not Found'), { statusCode: 404 });
    cache.getCached.mockResolvedValue(null);
    github.githubRequest.mockRejectedValue(err);

    await expect(
      cachedGithubRequestWithRetry(PATH, TOKEN, { maxRetries: 3, baseDelay: 1 })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(github.githubRequest).toHaveBeenCalledTimes(1);
  });
});
