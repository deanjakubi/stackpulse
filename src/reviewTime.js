// reviewTime.js — measures how long PRs have been waiting for review

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysSince(dateStr) {
  if (!dateStr) return null;
  return (Date.now() - new Date(dateStr).getTime()) / MS_PER_DAY;
}

function getReviewWaitDays(pr) {
  // If there is a review, measure from open to first review
  const reviews = pr.reviews || [];
  if (reviews.length > 0) {
    const firstReview = reviews
      .map(r => new Date(r.submitted_at).getTime())
      .sort((a, b) => a - b)[0];
    const opened = new Date(pr.created_at).getTime();
    return (firstReview - opened) / MS_PER_DAY;
  }
  // No review yet — measure from open until now
  return daysSince(pr.created_at);
}

function classifyReviewWait(days) {
  if (days === null) return 'unknown';
  if (days < 1) return 'fast';
  if (days < 3) return 'normal';
  if (days < 7) return 'slow';
  return 'blocked';
}

function annotateReviewTime(prs) {
  return prs.map(pr => {
    const waitDays = getReviewWaitDays(pr);
    return {
      ...pr,
      reviewWaitDays: waitDays !== null ? Math.round(waitDays * 10) / 10 : null,
      reviewWaitBand: classifyReviewWait(waitDays),
    };
  });
}

function groupByReviewWait(prs) {
  const groups = { fast: [], normal: [], slow: [], blocked: [], unknown: [] };
  for (const pr of prs) {
    const band = pr.reviewWaitBand || classifyReviewWait(getReviewWaitDays(pr));
    (groups[band] = groups[band] || []).push(pr);
  }
  return groups;
}

function buildReviewTimeSummary(prs) {
  const annotated = annotateReviewTime(prs);
  const groups = groupByReviewWait(annotated);
  const withDays = annotated.filter(p => p.reviewWaitDays !== null);
  const avg = withDays.length
    ? withDays.reduce((s, p) => s + p.reviewWaitDays, 0) / withDays.length
    : null;
  return {
    total: prs.length,
    avgWaitDays: avg !== null ? Math.round(avg * 10) / 10 : null,
    groups,
  };
}

function formatReviewTimeSummary(summary) {
  const lines = ['Review Wait Time Summary', '------------------------'];
  lines.push(`Total PRs : ${summary.total}`);
  if (summary.avgWaitDays !== null) {
    lines.push(`Avg wait  : ${summary.avgWaitDays} days`);
  }
  const order = ['fast', 'normal', 'slow', 'blocked', 'unknown'];
  for (const band of order) {
    const count = (summary.groups[band] || []).length;
    if (count > 0) lines.push(`  ${band.padEnd(8)}: ${count}`);
  }
  return lines.join('\n');
}

module.exports = {
  getReviewWaitDays,
  classifyReviewWait,
  annotateReviewTime,
  groupByReviewWait,
  buildReviewTimeSummary,
  formatReviewTimeSummary,
};
