// commentActivity.js — summarise comment activity on PRs

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / MS_PER_DAY);
}

function getCommentCount(pr) {
  return (pr.comments || 0) + (pr.review_comments || 0);
}

function classifyCommentVolume(count) {
  if (count === 0) return 'none';
  if (count <= 3) return 'low';
  if (count <= 10) return 'medium';
  return 'high';
}

function annotateCommentActivity(prs) {
  return prs.map((pr) => ({
    ...pr,
    _commentCount: getCommentCount(pr),
    _commentVolume: classifyCommentVolume(getCommentCount(pr)),
    _daysSinceComment: daysSince(pr.updated_at),
  }));
}

function buildCommentSummary(prs) {
  const annotated = annotateCommentActivity(prs);
  const total = annotated.reduce((sum, pr) => sum + pr._commentCount, 0);
  const avg = prs.length ? (total / prs.length).toFixed(1) : '0.0';
  const volumes = { none: 0, low: 0, medium: 0, high: 0 };
  for (const pr of annotated) volumes[pr._commentVolume]++;
  const mostActive = [...annotated].sort(
    (a, b) => b._commentCount - a._commentCount
  )[0] || null;
  return { total, avg: parseFloat(avg), volumes, mostActive };
}

function formatCommentSummary(summary) {
  const { total, avg, volumes, mostActive } = summary;
  const lines = [
    `Comment Activity Summary`,
    `  Total comments : ${total}`,
    `  Avg per PR     : ${avg}`,
    `  None           : ${volumes.none}`,
    `  Low  (1-3)     : ${volumes.low}`,
    `  Medium (4-10)  : ${volumes.medium}`,
    `  High (11+)     : ${volumes.high}`,
  ];
  if (mostActive) {
    lines.push(
      `  Most active PR : #${mostActive.number} "${mostActive.title}" (${mostActive._commentCount} comments)`
    );
  }
  return lines.join('\n');
}

module.exports = {
  daysSince,
  getCommentCount,
  classifyCommentVolume,
  annotateCommentActivity,
  buildCommentSummary,
  formatCommentSummary,
};
