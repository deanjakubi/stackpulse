// commentTrend.js — analyse comment velocity trends across PRs

const MS_PER_DAY = 86400000;

function daysSince(dateStr) {
  if (!dateStr) return null;
  return (Date.now() - new Date(dateStr).getTime()) / MS_PER_DAY;
}

function commentsPerDay(pr) {
  const age = daysSince(pr.created_at);
  if (!age || age < 0.01) return 0;
  const count = pr.comments || 0;
  return count / age;
}

function classifyTrend(rate) {
  if (rate >= 2) return 'hot';
  if (rate >= 0.5) return 'active';
  if (rate >= 0.1) return 'quiet';
  return 'idle';
}

function annotateCommentTrend(prs) {
  return prs.map((pr) => {
    const rate = commentsPerDay(pr);
    return {
      ...pr,
      commentRate: parseFloat(rate.toFixed(2)),
      commentTrend: classifyTrend(rate),
    };
  });
}

function groupByTrend(prs) {
  const groups = { hot: [], active: [], quiet: [], idle: [] };
  for (const pr of prs) {
    const key = pr.commentTrend || classifyTrend(commentsPerDay(pr));
    if (groups[key]) groups[key].push(pr);
  }
  return groups;
}

function buildCommentTrendSummary(prs) {
  const annotated = annotateCommentTrend(prs);
  const groups = groupByTrend(annotated);
  const total = prs.length;
  return {
    total,
    groups,
    counts: {
      hot: groups.hot.length,
      active: groups.active.length,
      quiet: groups.quiet.length,
      idle: groups.idle.length,
    },
  };
}

function formatCommentTrendSummary(summary) {
  const { counts, total } = summary;
  const lines = [
    `Comment Trend Summary (${total} PRs)`,
    `  🔥 Hot    (≥2/day):   ${counts.hot}`,
    `  💬 Active (≥0.5/day): ${counts.active}`,
    `  🔇 Quiet  (≥0.1/day): ${counts.quiet}`,
    `  💤 Idle   (<0.1/day): ${counts.idle}`,
  ];
  return lines.join('\n');
}

module.exports = {
  commentsPerDay,
  classifyTrend,
  annotateCommentTrend,
  groupByTrend,
  buildCommentTrendSummary,
  formatCommentTrendSummary,
};
