import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./github.js');
vi.mock('./cache.js');

import { githubRequest } from './github.js';
import { getCached, setCached } from './cache.js';
import { cachedGithubRequest, fetchPRsCached } from './cachedGithub.js';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('cachedGithubRequest', () => {
  it('returns cached value when available', async () => {
    getCached.mockReturnValue([{ id: 1 }]);
    const result = await cachedGithubRequest('/repos/a/b/pulls', 'token');
    expect(result).toEqual([{ id: 1 }]);
    expect(githubRequest).not.toHaveBeenCalled();
  });

  it('fetches from API and caches when no cached value', async () => {
    getCached.mockReturnValue(null);
    githubRequest.mockResolvedValue([{ id: 2 }]);
    const result = await cachedGithubRequest('/repos/a/b/pulls', 'token');
    expect(githubRequest).toHaveBeenCalledWith('/repos/a/b/pulls', 'token');
    expect(setCached).toHaveBeenCalledWith('/repos/a/b/pulls', [{ id: 2 }]);
    expect(result).toEqual([{ id: 2 }]);
  });

  it('bypasses cache when force=true', async () => {
    getCached.mockReturnValue([{ id: 1 }]);
    githubRequest.mockResolvedValue([{ id: 99 }]);
    const result = await cachedGithubRequest('/repos/a/b/pulls', 'token', { force: true });
    expect(getCached).not.toHaveBeenCalled();
    expect(githubRequest).toHaveBeenCalled();
    expect(result).toEqual([{ id: 99 }]);
  });

  it('passes ttlMs to getCached', async () => {
    getCached.mockReturnValue(null);
    githubRequest.mockResolvedValue([]);
    await cachedGithubRequest('/path', 'token', { ttlMs: 1000 });
    expect(getCached).toHaveBeenCalledWith('/path', 1000);
  });
});

describe('fetchPRsCached', () => {
  it('calls cachedGithubRequest with correct API path', async () => {
    getCached.mockReturnValue([{ number: 5 }]);
    const result = await fetchPRsCached('myorg', 'myrepo', 'tok');
    expect(getCached).toHaveBeenCalledWith(
      '/repos/myorg/myrepo/pulls?state=open&per_page=50',
      expect.any(Number)
    );
    expect(result).toEqual([{ number: 5 }]);
  });
});
