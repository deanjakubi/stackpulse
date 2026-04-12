// reviewers.js — summarise PR review request activity

/**
 * Count how many PRs each reviewer has been requested on.
 * @param {Array} prs
 * @returns {Object} map of login -> count
 */
function countByReviewer(prs) {
  const counts = {};
  for (const pr of prs) {
    const reviewers = pr.requested_reviewers || [];
    for (const reviewer of reviewers) {
      const login = reviewer.login || reviewer;
      counts[login] = (counts[login] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Return reviewers sorted by PR count descending.
 * @param {Object} counts
 * @returns {Array<{login, count}>}
 */
function sortedReviewers(counts) {
  return Object.entries(counts)
    .map(([login, count]) => ({ login, count }))
    .sort((a, b) => b.count - a.count || a.login.localeCompare(b.login));
}

/**
 * Format a reviewer summary as a string.
 * @param {Array<{login, count}>} sorted
 * @returns {string}
 */
function formatReviewerSummary(sorted) {
  if (sorted.length === 0) return 'No review requests found.';
  const lines = sorted.map(
    ({ login, count }) =>
      `  ${login.padEnd(24)} ${String(count).padStart(4)} PR${count === 1 ? ' ' : 's'}`
  );
  return ['Reviewer Requests:', ...lines].join('\n');
}

module.exports = { countByReviewer, sortedReviewers, formatReviewerSummary };
