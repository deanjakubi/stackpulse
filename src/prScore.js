// prScore.js — compute a composite priority score for each PR
// Score factors: age, comment activity, size, review state, draft status

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.max(0, (Date.now() - new Date(dateStr).getTime()) / MS_PER_DAY);
}

/**
 * Compute a numeric priority score (higher = needs more attention).
 * Weights are intentionally simple and tunable.
 */
function computePRScore(pr) {
  let score = 0;

  // Age contribution: up to 40 points (caps at 30 days)
  const age = daysSince(pr.created_at);
  score += Math.min(age, 30) * (40 / 30);

  // No comments = neglected; penalise up to 20 points
  const comments = pr.comments || 0;
  if (comments === 0) score += 20;
  else score += Math.max(0, 10 - comments);

  // Large PRs are harder to review — add up to 20 points
  const changes = (pr.additions || 0) + (pr.deletions || 0);
  if (changes > 500) score += 20;
  else if (changes > 200) score += 12;
  else if (changes > 50) score += 6;

  // Draft PRs are less urgent — subtract 15 points
  if (pr.draft) score -= 15;

  // Approved PRs just need merging — small bonus so they surface
  const reviews = pr.reviews || [];
  const approved = reviews.some((r) => r.state === 'APPROVED');
  const changesRequested = reviews.some((r) => r.state === 'CHANGES_REQUESTED');
  if (approved) score += 10;
  if (changesRequested) score += 5;

  return Math.round(score);
}

function classifyScore(score) {
  if (score >= 60) return 'critical';
  if (score >= 40) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

function annotatePRScore(prs) {
  return prs.map((pr) => {
    const score = computePRScore(pr);
    return { ...pr, _score: score, _priority: classifyScore(score) };
  });
}

function sortByScore(prs) {
  return [...prs].sort((a, b) => (b._score || 0) - (a._score || 0));
}

function buildScoreSummary(prs) {
  const annotated = annotatePRScore(prs);
  const bands = { critical: [], high: [], medium: [], low: [] };
  for (const pr of annotated) bands[pr._priority].push(pr);
  return { annotated: sortByScore(annotated), bands };
}

function formatScoreSummary(summary) {
  const lines = ['PR Priority Score Summary', '========================='];
  for (const [level, prs] of Object.entries(summary.bands)) {
    lines.push(`${level.toUpperCase()} (${prs.length})`);
    for (const pr of prs) {
      lines.push(`  [${pr._score}] #${pr.number} ${pr.title}`);
    }
  }
  return lines.join('\n');
}

module.exports = {
  computePRScore,
  classifyScore,
  annotatePRScore,
  sortByScore,
  buildScoreSummary,
  formatScoreSummary,
};
