/**
 * checks.js — Summarise CI/status-check results across PRs.
 */

'use strict';

/** Extract the overall check state from a PR's combined status. */
function getCheckState(pr) {
  return pr.checkState || 'unknown';
}

/** Count PRs by their check state. */
function countByCheckState(prs) {
  const counts = { success: 0, failure: 0, pending: 0, unknown: 0 };
  for (const pr of prs) {
    const state = getCheckState(pr);
    if (state in counts) {
      counts[state]++;
    } else {
      counts.unknown++;
    }
  }
  return counts;
}

/** Annotate each PR with a normalised checkState field. */
function annotateCheckState(prs) {
  return prs.map((pr) => ({
    ...pr,
    checkState: getCheckState(pr),
  }));
}

/** Build a summary object for check states. */
function buildCheckSummary(prs) {
  const counts = countByCheckState(prs);
  const total = prs.length;

  return {
    total,
    counts,
    passRate: total > 0 ? Math.round((counts.success / total) * 100) : 0,
    failingPRs: prs.filter((pr) => getCheckState(pr) === 'failure'),
    pendingPRs: prs.filter((pr) => getCheckState(pr) === 'pending'),
  };
}

/** Format the summary as a human-readable string. */
function formatCheckSummary(summary) {
  const { total, counts, passRate } = summary;
  const lines = [
    `CI Check Summary (${total} PRs):`,
    `  ✅ Success : ${counts.success}`,
    `  ❌ Failure : ${counts.failure}`,
    `  ⏳ Pending : ${counts.pending}`,
    `  ❓ Unknown : ${counts.unknown}`,
    `  Pass rate  : ${passRate}%`,
  ];
  return lines.join('\n');
}

module.exports = {
  getCheckState,
  countByCheckState,
  annotateCheckState,
  buildCheckSummary,
  formatCheckSummary,
};
