// reopenCount.js — tracks how many times a PR has been reopened
// and surfaces PRs with high reopen counts as potentially problematic

function getReopenCount(pr) {
  const events = pr.timeline_events || [];
  return events.filter(e => e.event === 'reopened').length;
}

function classifyReopenCount(count) {
  if (count === 0) return 'none';
  if (count === 1) return 'once';
  if (count <= 3) return 'several';
  return 'many';
}

function annotateReopenCount(prs) {
  return prs.map(pr => ({
    ...pr,
    reopenCount: getReopenCount(pr),
    reopenClass: classifyReopenCount(getReopenCount(pr)),
  }));
}

function groupByReopenCount(prs) {
  const groups = { none: [], once: [], several: [], many: [] };
  for (const pr of prs) {
    const cls = pr.reopenClass || classifyReopenCount(getReopenCount(pr));
    groups[cls].push(pr);
  }
  return groups;
}

function buildReopenCountSummary(prs) {
  const annotated = annotateReopenCount(prs);
  const groups = groupByReopenCount(annotated);
  const total = prs.length;
  const flagged = annotated.filter(pr => pr.reopenCount > 0);
  const maxReopen = annotated.reduce((m, pr) => Math.max(m, pr.reopenCount), 0);
  return { total, flagged, groups, maxReopen, annotated };
}

function formatReopenCountSummary(summary) {
  const lines = [];
  lines.push(`Reopen Count Report (${summary.total} PRs)`);
  lines.push(`  Reopened at least once : ${summary.flagged.length}`);
  lines.push(`  Max reopen count       : ${summary.maxReopen}`);
  lines.push('');
  const order = ['many', 'several', 'once', 'none'];
  const labels = { many: 'Many (>3)', several: 'Several (2-3)', once: 'Once', none: 'Never reopened' };
  for (const key of order) {
    const group = summary.groups[key];
    if (group.length === 0) continue;
    lines.push(`  ${labels[key]} (${group.length}):`);
    for (const pr of group) {
      lines.push(`    #${pr.number} [x${pr.reopenCount}] ${pr.title}`);
    }
  }
  return lines.join('\n');
}

module.exports = {
  getReopenCount,
  classifyReopenCount,
  annotateReopenCount,
  groupByReopenCount,
  buildReopenCountSummary,
  formatReopenCountSummary,
};
