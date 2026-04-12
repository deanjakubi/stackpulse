/**
 * velocity.js
 * Computes PR merge velocity metrics: PRs merged per day/week across repos.
 */

/**
 * Returns the number of days between two ISO date strings.
 * @param {string} from
 * @param {string} to
 * @returns {number}
 */
function daysBetween(from, to) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.round((new Date(to) - new Date(from)) / msPerDay));
}

/**
 * Counts merged PRs and computes rates.
 * @param {Array} prs - list of PR objects
 * @param {string} [now] - ISO date string for "now" (defaults to current time)
 * @returns {{ total: number, mergedCount: number, perDay: number, perWeek: number, oldestMergedAt: string|null, newestMergedAt: string|null }}
 */
function computeVelocity(prs, now = new Date().toISOString()) {
  const merged = prs.filter(pr => pr.merged_at);

  if (merged.length === 0) {
    return { total: prs.length, mergedCount: 0, perDay: 0, perWeek: 0, oldestMergedAt: null, newestMergedAt: null };
  }

  const dates = merged.map(pr => pr.merged_at).sort();
  const oldestMergedAt = dates[0];
  const newestMergedAt = dates[dates.length - 1];

  const spanDays = daysBetween(oldestMergedAt, now);
  const perDay = parseFloat((merged.length / spanDays).toFixed(2));
  const perWeek = parseFloat((perDay * 7).toFixed(2));

  return {
    total: prs.length,
    mergedCount: merged.length,
    perDay,
    perWeek,
    oldestMergedAt,
    newestMergedAt,
  };
}

/**
 * Formats a velocity summary as a human-readable string.
 * @param {object} velocity
 * @param {string} [repo]
 * @returns {string}
 */
function formatVelocitySummary(velocity, repo = '') {
  const label = repo ? `[${repo}] ` : '';
  if (velocity.mergedCount === 0) {
    return `${label}No merged PRs found.`;
  }
  return (
    `${label}Merged: ${velocity.mergedCount}/${velocity.total} PRs | ` +
    `${velocity.perDay}/day | ${velocity.perWeek}/week`
  );
}

module.exports = { daysBetween, computeVelocity, formatVelocitySummary };
