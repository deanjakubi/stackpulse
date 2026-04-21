// Identifies PRs that are waiting on the author to respond to review feedback

const WAITING_LABELS = ['waiting-on-author', 'changes-requested', 'needs-update'];

function hasChangesRequested(pr) {
  const reviews = pr.reviews || [];
  return reviews.some(r => r.state === 'CHANGES_REQUESTED');
}

function hasWaitingLabel(pr) {
  const labels = (pr.labels || []).map(l => (l.name || '').toLowerCase());
  return WAITING_LABELS.some(wl => labels.includes(wl));
}

function isWaitingOnAuthor(pr) {
  return hasChangesRequested(pr) || hasWaitingLabel(pr);
}

function partitionWaiting(prs) {
  const waiting = [];
  const other = [];
  for (const pr of prs) {
    (isWaitingOnAuthor(pr) ? waiting : other).push(pr);
  }
  return { waiting, other };
}

function annotateWaiting(prs) {
  return prs.map(pr => ({ ...pr, waitingOnAuthor: isWaitingOnAuthor(pr) }));
}

function buildWaitingSummary(prs) {
  const { waiting, other } = partitionWaiting(prs);
  const byAuthor = {};
  for (const pr of waiting) {
    const author = pr.user?.login || 'unknown';
    byAuthor[author] = (byAuthor[author] || 0) + 1;
  }
  return {
    total: prs.length,
    waitingCount: waiting.length,
    activeCount: other.length,
    byAuthor,
    waitingPRs: waiting,
  };
}

function formatWaitingSummary(summary) {
  const lines = [
    `Waiting on author: ${summary.waitingCount} / ${summary.total} PRs`,
  ];
  const authors = Object.entries(summary.byAuthor).sort((a, b) => b[1] - a[1]);
  for (const [author, count] of authors) {
    lines.push(`  ${author}: ${count}`);
  }
  return lines.join('\n');
}

module.exports = {
  isWaitingOnAuthor,
  partitionWaiting,
  annotateWaiting,
  buildWaitingSummary,
  formatWaitingSummary,
};
