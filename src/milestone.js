/**
 * milestone.js — group and summarise PRs by milestone
 */

'use strict';

/**
 * Extract the milestone title from a PR, or null if none.
 * @param {object} pr
 * @returns {string|null}
 */
function getMilestone(pr) {
  return pr.milestone ? pr.milestone.title : null;
}

/**
 * Group PRs by their milestone title.
 * PRs without a milestone are grouped under the key '__none__'.
 * @param {object[]} prs
 * @returns {Map<string, object[]>}
 */
function groupByMilestone(prs) {
  const groups = new Map();
  for (const pr of prs) {
    const key = getMilestone(pr) || '__none__';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(pr);
  }
  return groups;
}

/**
 * Build a summary object for a single milestone group.
 * @param {string} title
 * @param {object[]} prs
 * @returns {object}
 */
function buildMilestoneSummary(title, prs) {
  const open = prs.filter(p => p.state === 'open').length;
  const closed = prs.filter(p => p.state === 'closed').length;
  const drafts = prs.filter(p => p.draft).length;
  return { title, total: prs.length, open, closed, drafts };
}

/**
 * Build summaries for all milestones found in prs.
 * @param {object[]} prs
 * @returns {object[]}
 */
function buildMilestoneReport(prs) {
  const groups = groupByMilestone(prs);
  const report = [];
  for (const [title, grouped] of groups) {
    report.push(buildMilestoneSummary(title, grouped));
  }
  return report.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Format the milestone report as a human-readable string.
 * @param {object[]} summaries
 * @returns {string}
 */
function formatMilestoneReport(summaries) {
  if (summaries.length === 0) return 'No milestone data available.';
  const lines = ['Milestone Report', '================'];
  for (const s of summaries) {
    const label = s.title === '__none__' ? '(no milestone)' : s.title;
    lines.push(`${label}: ${s.total} PRs  [open: ${s.open}  closed: ${s.closed}  drafts: ${s.drafts}]`);
  }
  return lines.join('\n');
}

module.exports = { getMilestone, groupByMilestone, buildMilestoneSummary, buildMilestoneReport, formatMilestoneReport };
