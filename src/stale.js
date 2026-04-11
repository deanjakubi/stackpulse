/**
 * Stale PR detection — flags PRs that have had no activity
 * beyond a configurable threshold (default 7 days).
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Returns the age in days since the given ISO date string.
 * @param {string} isoDate
 * @param {Date} [now]
 * @returns {number}
 */
function daysSince(isoDate, now = new Date()) {
  const then = new Date(isoDate);
  return (now - then) / MS_PER_DAY;
}

/**
 * Determines whether a PR is stale.
 * Uses updated_at if available, otherwise created_at.
 * @param {object} pr
 * @param {number} thresholdDays
 * @param {Date} [now]
 * @returns {boolean}
 */
function isStale(pr, thresholdDays = 7, now = new Date()) {
  const lastActivity = pr.updated_at || pr.created_at;
  if (!lastActivity) return false;
  return daysSince(lastActivity, now) >= thresholdDays;
}

/**
 * Annotates each PR with a `stale` boolean field.
 * @param {object[]} prs
 * @param {number} thresholdDays
 * @param {Date} [now]
 * @returns {object[]}
 */
function annotateStalePRs(prs, thresholdDays = 7, now = new Date()) {
  return prs.map((pr) => ({
    ...pr,
    stale: isStale(pr, thresholdDays, now),
  }));
}

/**
 * Filters and returns only stale PRs.
 * @param {object[]} prs
 * @param {number} thresholdDays
 * @param {Date} [now]
 * @returns {object[]}
 */
function filterStalePRs(prs, thresholdDays = 7, now = new Date()) {
  return prs.filter((pr) => isStale(pr, thresholdDays, now));
}

module.exports = { daysSince, isStale, annotateStalePRs, filterStalePRs };
