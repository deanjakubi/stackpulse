// prAge.js — classify and summarise PRs by how long they have been open

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysSinceOpened(pr) {
  const created = new Date(pr.created_at);
  return Math.floor((Date.now() - created.getTime()) / MS_PER_DAY);
}

function classifyPRAge(days) {
  if (days <= 1) return 'fresh';
  if (days <= 7) return 'recent';
  if (days <= 30) return 'aging';
  return 'stale';
}

function annotatePRAge(prs) {
  return prs.map((pr) => {
    const days = daysSinceOpened(pr);
    return { ...pr, _ageDays: days, _ageBand: classifyPRAge(days) };
  });
}

function groupByAgeBand(prs) {
  const groups = { fresh: [], recent: [], aging: [], stale: [] };
  for (const pr of prs) {
    const band = pr._ageBand || classifyPRAge(daysSinceOpened(pr));
    groups[band].push(pr);
  }
  return groups;
}

function buildPRAgeSummary(prs) {
  const annotated = annotatePRAge(prs);
  const groups = groupByAgeBand(annotated);
  const total = prs.length;
  return {
    total,
    fresh: groups.fresh.length,
    recent: groups.recent.length,
    aging: groups.aging.length,
    stale: groups.stale.length,
    groups,
  };
}

function formatPRAgeSummary(summary) {
  const lines = [
    `PR Age Summary (${summary.total} total)`,
    `  Fresh   (0-1d)  : ${summary.fresh}`,
    `  Recent  (2-7d)  : ${summary.recent}`,
    `  Aging   (8-30d) : ${summary.aging}`,
    `  Stale   (>30d)  : ${summary.stale}`,
  ];
  return lines.join('\n');
}

module.exports = {
  daysSinceOpened,
  classifyPRAge,
  annotatePRAge,
  groupByAgeBand,
  buildPRAgeSummary,
  formatPRAgeSummary,
};
