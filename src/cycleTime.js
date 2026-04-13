// cycleTime.js — computes PR cycle time (open → merge) statistics

'use strict';

function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.max(0, (b - a) / (1000 * 60 * 60 * 24));
}

function getCycleTime(pr) {
  if (!pr.merged_at) return null;
  return daysBetween(pr.created_at, pr.merged_at);
}

function classifyCycleTime(days) {
  if (days === null) return 'unmerged';
  if (days <= 1) return 'fast';       // <= 1 day
  if (days <= 3) return 'normal';     // 1–3 days
  if (days <= 7) return 'slow';       // 3–7 days
  return 'very slow';                 // > 7 days
}

function annotateCycleTime(prs) {
  return prs.map((pr) => {
    const cycleTimeDays = getCycleTime(pr);
    return {
      ...pr,
      cycleTimeDays,
      cycleTimeClass: classifyCycleTime(cycleTimeDays),
    };
  });
}

function buildCycleTimeSummary(prs) {
  const merged = prs.filter((pr) => pr.merged_at);
  if (merged.length === 0) {
    return { count: 0, avgDays: null, minDays: null, maxDays: null, buckets: {} };
  }

  const times = merged.map((pr) => getCycleTime(pr));
  const avg = times.reduce((s, v) => s + v, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  const buckets = { fast: 0, normal: 0, slow: 0, 'very slow': 0 };
  times.forEach((t) => {
    buckets[classifyCycleTime(t)] += 1;
  });

  return { count: merged.length, avgDays: avg, minDays: min, maxDays: max, buckets };
}

function formatCycleTimeSummary(summary) {
  if (summary.count === 0) return 'No merged PRs found.';
  const lines = [
    `Cycle Time (${summary.count} merged PRs)`,
    `  Avg : ${summary.avgDays.toFixed(1)} days`,
    `  Min : ${summary.minDays.toFixed(1)} days`,
    `  Max : ${summary.maxDays.toFixed(1)} days`,
    '',
    '  Breakdown:',
    `    Fast      (<= 1d) : ${summary.buckets.fast}`,
    `    Normal    (1–3d)  : ${summary.buckets.normal}`,
    `    Slow      (3–7d)  : ${summary.buckets.slow}`,
    `    Very Slow (> 7d)  : ${summary.buckets['very slow']}`,
  ];
  return lines.join('\n');
}

module.exports = {
  daysBetween,
  getCycleTime,
  classifyCycleTime,
  annotateCycleTime,
  buildCycleTimeSummary,
  formatCycleTimeSummary,
};
