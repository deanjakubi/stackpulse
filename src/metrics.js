/**
 * Compute summary metrics from a collection of PRs across repos.
 */

/**
 * @param {Array<{repo: string, prs: Array}>} repoResults
 * @returns {object} metrics summary
 */
function computeMetrics(repoResults) {
  let totalPRs = 0;
  let totalDrafts = 0;
  let totalReviewed = 0;
  let totalMergeable = 0;
  let ageSum = 0;
  const authorCounts = {};
  const labelCounts = {};

  const now = Date.now();

  for (const { prs } of repoResults) {
    for (const pr of prs) {
      totalPRs++;

      if (pr.draft) totalDrafts++;

      if (pr.mergeable_state === 'clean') totalMergeable++;

      const reviewStates = (pr.reviews || []).map((r) => r.state);
      if (reviewStates.includes('APPROVED')) totalReviewed++;

      const createdAt = new Date(pr.created_at).getTime();
      if (!isNaN(createdAt)) {
        ageSum += now - createdAt;
      }

      const login = pr.user && pr.user.login;
      if (login) {
        authorCounts[login] = (authorCounts[login] || 0) + 1;
      }

      for (const label of pr.labels || []) {
        const name = label.name;
        labelCounts[name] = (labelCounts[name] || 0) + 1;
      }
    }
  }

  const avgAgeMs = totalPRs > 0 ? ageSum / totalPRs : 0;
  const avgAgeDays = Math.round(avgAgeMs / (1000 * 60 * 60 * 24));

  return {
    totalPRs,
    totalDrafts,
    totalReviewed,
    totalMergeable,
    avgAgeDays,
    authorCounts,
    labelCounts,
  };
}

/**
 * Format metrics as a human-readable string.
 * @param {object} metrics
 * @returns {string}
 */
function formatMetrics(metrics) {
  const lines = [
    `Total PRs      : ${metrics.totalPRs}`,
    `Drafts         : ${metrics.totalDrafts}`,
    `Approved       : ${metrics.totalReviewed}`,
    `Mergeable      : ${metrics.totalMergeable}`,
    `Avg age (days) : ${metrics.avgAgeDays}`,
  ];

  const topAuthors = Object.entries(metrics.authorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([login, count]) => `${login}(${count})`)
    .join(', ');

  if (topAuthors) {
    lines.push(`Top authors    : ${topAuthors}`);
  }

  const topLabels = Object.entries(metrics.labelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name}(${count})`)
    .join(', ');

  if (topLabels) {
    lines.push(`Top labels     : ${topLabels}`);
  }

  return lines.join('\n');
}

module.exports = { computeMetrics, formatMetrics };
