// prHealth.js — composite health score for a PR based on multiple signals

const WEIGHTS = {
  hasApproval: 25,
  checksPass: 25,
  notStale: 20,
  notBlocked: 15,
  hasReviewers: 10,
  notDraft: 5,
};

/**
 * Compute a 0–100 health score for a single PR.
 * @param {object} pr
 * @returns {number}
 */
function computeHealthScore(pr) {
  let score = 0;

  if (pr.approvalState === 'approved') score += WEIGHTS.hasApproval;
  if (pr.checkState === 'success') score += WEIGHTS.checksPass;
  if (!pr.isStale) score += WEIGHTS.notStale;
  if (!pr.isBlocked) score += WEIGHTS.notBlocked;
  if (Array.isArray(pr.requested_reviewers) && pr.requested_reviewers.length > 0) {
    score += WEIGHTS.hasReviewers;
  }
  if (!pr.draft) score += WEIGHTS.notDraft;

  return score;
}

/**
 * Classify a health score into a band.
 * @param {number} score
 * @returns {'healthy'|'fair'|'at-risk'|'critical'}
 */
function classifyHealth(score) {
  if (score >= 80) return 'healthy';
  if (score >= 55) return 'fair';
  if (score >= 30) return 'at-risk';
  return 'critical';
}

/**
 * Annotate each PR with healthScore and healthBand.
 * @param {object[]} prs
 * @returns {object[]}
 */
function annotateHealth(prs) {
  return prs.map((pr) => {
    const healthScore = computeHealthScore(pr);
    const healthBand = classifyHealth(healthScore);
    return { ...pr, healthScore, healthBand };
  });
}

/**
 * Build a summary object from annotated PRs.
 * @param {object[]} prs  — already annotated
 * @returns {object}
 */
function buildHealthSummary(prs) {
  const bands = { healthy: 0, fair: 0, 'at-risk': 0, critical: 0 };
  let total = 0;
  for (const pr of prs) {
    if (pr.healthBand) bands[pr.healthBand] = (bands[pr.healthBand] || 0) + 1;
    total++;
  }
  const avg =
    total > 0
      ? Math.round(prs.reduce((s, p) => s + (p.healthScore || 0), 0) / total)
      : 0;
  return { total, avg, bands };
}

/**
 * Format summary as a human-readable string.
 * @param {object} summary
 * @returns {string}
 */
function formatHealthSummary(summary) {
  const { total, avg, bands } = summary;
  const lines = [
    `PR Health  (${total} PRs, avg score ${avg}/100)`,
    `  ✅ Healthy  : ${bands.healthy}`,
    `  🟡 Fair     : ${bands.fair}`,
    `  🟠 At-risk  : ${bands['at-risk']}`,
    `  🔴 Critical : ${bands.critical}`,
  ];
  return lines.join('\n');
}

module.exports = {
  computeHealthScore,
  classifyHealth,
  annotateHealth,
  buildHealthSummary,
  formatHealthSummary,
};
