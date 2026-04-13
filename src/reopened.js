/**
 * Detect and summarise reopened PRs.
 * A PR is considered "reopened" when its closed_at field was previously set
 * but the current state is 'open'.
 */

'use strict';

function isReopened(pr) {
  return pr.state === 'open' && pr.closed_at != null;
}

function partitionReopened(prs) {
  const reopened = [];
  const normal = [];
  for (const pr of prs) {
    if (isReopened(pr)) {
      reopened.push(pr);
    } else {
      normal.push(pr);
    }
  }
  return { reopened, normal };
}

function annotateReopened(prs) {
  return prs.map(pr => ({
    ...pr,
    isReopened: isReopened(pr),
  }));
}

function buildReopenedSummary(prs) {
  const { reopened, normal } = partitionReopened(prs);
  return {
    total: prs.length,
    reopenedCount: reopened.length,
    normalCount: normal.length,
    reopened,
  };
}

function formatReopenedSummary(summary) {
  const lines = [];
  lines.push(`Reopened PRs: ${summary.reopenedCount} / ${summary.total}`);
  if (summary.reopened.length === 0) {
    lines.push('  No reopened PRs found.');
  } else {
    for (const pr of summary.reopened) {
      const repo = pr.repo || 'unknown';
      lines.push(`  [${repo}] #${pr.number} — ${pr.title}`);
    }
  }
  return lines.join('\n');
}

module.exports = {
  isReopened,
  partitionReopened,
  annotateReopened,
  buildReopenedSummary,
  formatReopenedSummary,
};
