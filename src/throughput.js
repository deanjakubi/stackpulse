// Measures PR merge throughput: how many PRs are merged per day/week

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(a, b) {
  return Math.abs(new Date(a) - new Date(b)) / MS_PER_DAY;
}

function getMergedAt(pr) {
  return pr.merged_at || pr.mergedAt || null;
}

function filterMerged(prs, windowDays = 30) {
  const cutoff = Date.now() - windowDays * MS_PER_DAY;
  return prs.filter((pr) => {
    const mergedAt = getMergedAt(pr);
    return mergedAt && new Date(mergedAt).getTime() >= cutoff;
  });
}

function computeThroughput(prs, windowDays = 30) {
  const merged = filterMerged(prs, windowDays);
  const perDay = merged.length / windowDays;
  const perWeek = perDay * 7;
  return {
    windowDays,
    totalMerged: merged.length,
    perDay: Math.round(perDay * 100) / 100,
    perWeek: Math.round(perWeek * 100) / 100,
  };
}

function classifyThroughput(perWeek) {
  if (perWeek >= 10) return 'high';
  if (perWeek >= 4) return 'medium';
  return 'low';
}

function buildThroughputSummary(prs, windowDays = 30) {
  const stats = computeThroughput(prs, windowDays);
  const level = classifyThroughput(stats.perWeek);
  return { ...stats, level };
}

function formatThroughputSummary(summary) {
  const lines = [
    `Throughput (last ${summary.windowDays} days)`,
    `  Merged PRs : ${summary.totalMerged}`,
    `  Per day    : ${summary.perDay}`,
    `  Per week   : ${summary.perWeek}  [${summary.level}]`,
  ];
  return lines.join('\n');
}

module.exports = {
  filterMerged,
  computeThroughput,
  classifyThroughput,
  buildThroughputSummary,
  formatThroughputSummary,
};
