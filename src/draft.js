/**
 * draft.js — utilities for analysing draft PR status across repos
 */

/**
 * Returns true when the PR is a draft.
 * @param {object} pr
 * @returns {boolean}
 */
function isDraft(pr) {
  return pr.draft === true;
}

/**
 * Splits PRs into draft and ready buckets.
 * @param {object[]} prs
 * @returns {{ drafts: object[], ready: object[] }}
 */
function partitionDrafts(prs) {
  const drafts = [];
  const ready = [];
  for (const pr of prs) {
    (isDraft(pr) ? drafts : ready).push(pr);
  }
  return { drafts, ready };
}

/**
 * Builds a summary object for draft vs ready PRs.
 * @param {object[]} prs
 * @returns {object}
 */
function buildDraftSummary(prs) {
  const { drafts, ready } = partitionDrafts(prs);
  const total = prs.length;
  const draftCount = drafts.length;
  const readyCount = ready.length;
  const draftPct = total > 0 ? Math.round((draftCount / total) * 100) : 0;
  return { total, draftCount, readyCount, draftPct, drafts, ready };
}

/**
 * Formats a draft summary as a human-readable string.
 * @param {object} summary
 * @returns {string}
 */
function formatDraftSummary(summary) {
  const { total, draftCount, readyCount, draftPct } = summary;
  if (total === 0) return 'No PRs found.';
  const lines = [
    `Draft PRs: ${draftCount} / ${total} (${draftPct}%)`,
    `Ready PRs: ${readyCount}`,
  ];
  if (draftCount > 0) {
    lines.push('');
    lines.push('Draft PRs:');
    for (const pr of summary.drafts) {
      lines.push(`  #${pr.number} ${pr.title} — ${pr.user?.login ?? 'unknown'}`);
    }
  }
  return lines.join('\n');
}

module.exports = { isDraft, partitionDrafts, buildDraftSummary, formatDraftSummary };
