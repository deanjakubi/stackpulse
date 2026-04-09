/**
 * Wraps cachedGithub requests with retry logic.
 */

const { getCached, setCached } = require('./cache');
const { githubRequest } = require('./github');
const { withRetry } = require('./retry');

const DEFAULT_TTL_SECONDS = 60;

/**
 * Fetch a GitHub API path with caching and retry support.
 * @param {string} path - GitHub API path, e.g. "/repos/owner/repo/pulls".
 * @param {string} token - GitHub personal access token.
 * @param {object} [options]
 * @param {number} [options.ttl] - Cache TTL in seconds.
 * @param {number} [options.maxRetries] - Max retry attempts.
 * @param {number} [options.baseDelay] - Base delay in ms for backoff.
 * @returns {Promise<any>}
 */
async function cachedGithubRequestWithRetry(path, token, options = {}) {
  const ttl = options.ttl ?? DEFAULT_TTL_SECONDS;
  const retryOptions = {
    maxRetries: options.maxRetries ?? 3,
    baseDelay: options.baseDelay ?? 500,
  };

  const cached = await getCached(path);
  if (cached !== null) {
    return cached;
  }

  const data = await withRetry(() => githubRequest(path, token), retryOptions);
  await setCached(path, data, ttl);
  return data;
}

module.exports = { cachedGithubRequestWithRetry };
