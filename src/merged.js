// merged.js — summarise recently merged PRs

'use strict';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Return true if the PR was merged within the last `days` days.
 * @param {object} pr
 * @param {number} days
 */
function isMergedRecently(pr, days = 7) {
  if (!pr.merged_at) return false;
  const mergedAt = new Date(pr.merged_at).getTime();
  const cutoff = Date.now() - days * DAY_MS;
  return mergedAt >= cutoff;
}

/**
 * Partition PRs into merged (within window) and others.
 * @param {object[]} prs
 * @param {number} days
 */
function partitionMerged(prs, days = 7) {
  const merged = [];
  const rest = [];
  for (const pr of prs) {
    if (isMergedRecently(pr, days)) merged.push(pr);
    else rest.push(pr);
  }
  return { merged, rest };
}

/**
 * Build a summary object from a list of merged PRs.
 * @param {object[]} prs
 */
function buildMergedSummary(prs) {
  const byAuthor = {};
  for (const pr of prs) {
    const author = pr.user?.login ?? 'unknown';
    byAuthor[author] = (byAuthor[author] ?? 0) + 1;
  }
  return {
    total: prs.length,
    byAuthor,
  };
}

/**
 * Format a merged-PR summary as a human-readable string.
 * @param {object} summary
 * @param {number} days
 */
function formatMergedSummary(summary, days = 7) {
  const lines = [];
  lines.push(`Merged PRs (last ${days} day${days === 1 ? '' : 's'}): ${summary.total}`);
  const entries = Object.entries(summary.byAuthor).sort((a, b) => b[1] - a[1]);
  for (const [author, count] of entries) {
    lines.push(`  ${author}: ${count}`);
  }
  return lines.join('\n');
}

module.exports = {
  isMergedRecently,
  partitionMerged,
  buildMergedSummary,
  formatMergedSummary,
};
