import { githubRequest } from './github.js';
import { getCached, setCached } from './cache.js';

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Wraps githubRequest with a read-through cache.
 * @param {string} path - GitHub API path, used as cache key.
 * @param {string} token - GitHub personal access token.
 * @param {object} options
 * @param {number} [options.ttlMs] - Cache TTL in milliseconds.
 * @param {boolean} [options.force] - Bypass cache and fetch fresh data.
 * @returns {Promise<any>}
 */
export async function cachedGithubRequest(path, token, options = {}) {
  const { ttlMs = DEFAULT_TTL_MS, force = false } = options;

  if (!force) {
    const cached = getCached(path, ttlMs);
    if (cached !== null) {
      return cached;
    }
  }

  const data = await githubRequest(path, token);
  setCached(path, data);
  return data;
}

/**
 * Fetches open PRs for a repo, with caching.
 * @param {string} owner
 * @param {string} repo
 * @param {string} token
 * @param {object} options
 * @returns {Promise<any[]>}
 */
export async function fetchPRsCached(owner, repo, token, options = {}) {
  const apiPath = `/repos/${owner}/${repo}/pulls?state=open&per_page=50`;
  return cachedGithubRequest(apiPath, token, options);
}
