/**
 * contributors.js
 * Analyse PR contributor activity across repos.
 */

/**
 * Count PRs grouped by author login.
 * @param {Array} prs
 * @returns {Object} { login: count }
 */
function countByContributor(prs) {
  return prs.reduce((acc, pr) => {
    const login = pr.user?.login || 'unknown';
    acc[login] = (acc[login] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Return contributors sorted by PR count descending.
 * @param {Object} counts
 * @returns {Array<{ login: string, count: number }>}
 */
function sortedContributors(counts) {
  return Object.entries(counts)
    .map(([login, count]) => ({ login, count }))
    .sort((a, b) => b.count - a.count || a.login.localeCompare(b.login));
}

/**
 * Compute first and last PR dates per contributor.
 * @param {Array} prs
 * @returns {Object} { login: { first: string, last: string } }
 */
function contributorDateRange(prs) {
  const ranges = {};
  for (const pr of prs) {
    const login = pr.user?.login || 'unknown';
    const date = pr.created_at;
    if (!date) continue;
    if (!ranges[login]) {
      ranges[login] = { first: date, last: date };
    } else {
      if (date < ranges[login].first) ranges[login].first = date;
      if (date > ranges[login].last) ranges[login].last = date;
    }
  }
  return ranges;
}

/**
 * Build a summary array enriched with date ranges.
 * @param {Array} prs
 * @returns {Array<{ login, count, first, last }>}
 */
function buildContributorSummary(prs) {
  const counts = countByContributor(prs);
  const sorted = sortedContributors(counts);
  const ranges = contributorDateRange(prs);
  return sorted.map(({ login, count }) => ({
    login,
    count,
    first: ranges[login]?.first || null,
    last: ranges[login]?.last || null,
  }));
}

/**
 * Format contributor summary as a human-readable string.
 * @param {Array} summary
 * @returns {string}
 */
function formatContributorSummary(summary) {
  if (!summary.length) return 'No contributors found.';
  const lines = ['Contributors by PR count:', ''];
  for (const { login, count, first, last } of summary) {
    const range = first ? ` (${first.slice(0, 10)} – ${last.slice(0, 10)})` : '';
    lines.push(`  ${login.padEnd(24)} ${String(count).padStart(4)} PR${count !== 1 ? 's' : ''}${range}`);
  }
  return lines.join('\n');
}

module.exports = {
  countByContributor,
  sortedContributors,
  contributorDateRange,
  buildContributorSummary,
  formatContributorSummary,
};
