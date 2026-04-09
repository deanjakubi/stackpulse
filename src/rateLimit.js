const { githubRequest } = require('./github');

const RATE_LIMIT_ENDPOINT = '/rate_limit';

/**
 * Fetch current GitHub API rate limit status.
 * @param {object} config
 * @returns {Promise<object>} rate limit info
 */
async function fetchRateLimit(config) {
  const data = await githubRequest(RATE_LIMIT_ENDPOINT, config);
  return data.rate;
}

/**
 * Format a Unix timestamp as a human-readable time string.
 * @param {number} resetTimestamp - Unix epoch seconds
 * @returns {string}
 */
function formatResetTime(resetTimestamp) {
  const date = new Date(resetTimestamp * 1000);
  return date.toLocaleTimeString();
}

/**
 * Build a summary string from a rate limit object.
 * @param {object} rate - { limit, remaining, reset, used }
 * @returns {string}
 */
function formatRateLimitSummary(rate) {
  const resetAt = formatResetTime(rate.reset);
  const pct = Math.round((rate.remaining / rate.limit) * 100);
  return `GitHub API: ${rate.remaining}/${rate.limit} requests remaining (${pct}%) — resets at ${resetAt}`;
}

/**
 * Returns true when remaining requests are below the given threshold.
 * @param {object} rate
 * @param {number} threshold
 * @returns {boolean}
 */
function isRateLimitLow(rate, threshold = 50) {
  return rate.remaining < threshold;
}

module.exports = { fetchRateLimit, formatResetTime, formatRateLimitSummary, isRateLimitLow };
