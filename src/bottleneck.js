// Identifies PRs that are bottlenecks: open long, no review, many comments

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSinceCreated(pr) {
  return Math.floor((Date.now() - new Date(pr.created_at).getTime()) / DAY_MS);
}

function bottleneckScore(pr) {
  const age = daysSinceCreated(pr);
  const comments = pr.comments || 0;
  const reviews = (pr.requested_reviewers || []).length;
  const noReview = reviews === 0 ? 10 : 0;
  return age + comments * 2 + noReview;
}

function classifyBottleneck(score) {
  if (score >= 40) return 'critical';
  if (score >= 20) return 'high';
  if (score >= 10) return 'medium';
  return 'low';
}

function annotateBottleneck(prs) {
  return prs.map(pr => {
    const score = bottleneckScore(pr);
    return { ...pr, bottleneckScore: score, bottleneckLevel: classifyBottleneck(score) };
  });
}

function groupByBottleneck(prs) {
  const groups = { critical: [], high: [], medium: [], low: [] };
  for (const pr of prs) {
    groups[pr.bottleneckLevel].push(pr);
  }
  return groups;
}

function buildBottleneckSummary(prs) {
  const annotated = annotateBottleneck(prs);
  const groups = groupByBottleneck(annotated);
  return { annotated, groups, total: prs.length };
}

function formatBottleneckSummary(summary) {
  const { groups } = summary;
  const lines = ['Bottleneck Report:'];
  for (const level of ['critical', 'high', 'medium', 'low']) {
    const count = groups[level].length;
    if (count > 0) lines.push(`  ${level}: ${count} PR(s)`);
  }
  return lines.join('\n');
}

module.exports = { bottleneckScore, classifyBottleneck, annotateBottleneck, groupByBottleneck, buildBottleneckSummary, formatBottleneckSummary };
