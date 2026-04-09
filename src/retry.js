/**
 * Retry logic for GitHub API requests with exponential backoff.
 */

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 500;

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay.
 * @param {number} attempt - Zero-based attempt index.
 * @param {number} baseDelay - Base delay in ms.
 * @returns {number} Delay in ms.
 */
function backoffDelay(attempt, baseDelay = DEFAULT_BASE_DELAY_MS) {
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Determine whether an error is retryable.
 * Retries on network errors and 5xx / 429 HTTP status codes.
 * @param {Error} err
 * @returns {boolean}
 */
function isRetryable(err) {
  if (!err) return false;
  if (err.statusCode === 429) return true;
  if (err.statusCode >= 500 && err.statusCode < 600) return true;
  if (!err.statusCode) return true; // network-level error
  return false;
}

/**
 * Execute an async function with retry and exponential backoff.
 * @param {() => Promise<any>} fn - Async function to execute.
 * @param {object} [options]
 * @param {number} [options.maxRetries]
 * @param {number} [options.baseDelay]
 * @returns {Promise<any>}
 */
async function withRetry(fn, options = {}) {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelay = options.baseDelay ?? DEFAULT_BASE_DELAY_MS;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && isRetryable(err)) {
        const delay = backoffDelay(attempt, baseDelay);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

module.exports = { withRetry, isRetryable, backoffDelay, sleep };
