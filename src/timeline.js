/**
 * timeline.js — groups PRs by creation date buckets (today, this week, older)
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(dateA, dateB) {
  const a = new Date(dateA).setHours(0, 0, 0, 0);
  const b = new Date(dateB).setHours(0, 0, 0, 0);
  return Math.floor((b - a) / MS_PER_DAY);
}

function classifyAge(pr, now = new Date()) {
  const days = daysBetween(pr.created_at, now);
  if (days === 0) return 'today';
  if (days <= 7) return 'this_week';
  if (days <= 30) return 'this_month';
  return 'older';
}

function groupByTimeline(prs, now = new Date()) {
  const buckets = {
    today: [],
    this_week: [],
    this_month: [],
    older: [],
  };
  for (const pr of prs) {
    const bucket = classifyAge(pr, now);
    buckets[bucket].push(pr);
  }
  return buckets;
}

function buildTimelineSummary(buckets) {
  return {
    today: buckets.today.length,
    this_week: buckets.this_week.length,
    this_month: buckets.this_month.length,
    older: buckets.older.length,
    total: buckets.today.length + buckets.this_week.length + buckets.this_month.length + buckets.older.length,
  };
}

function formatTimelineSummary(summary) {
  const lines = [
    'PR Timeline Summary',
    '-------------------',
    `  Today        : ${summary.today}`,
    `  This week    : ${summary.this_week}`,
    `  This month   : ${summary.this_month}`,
    `  Older        : ${summary.older}`,
    `  Total        : ${summary.total}`,
  ];
  return lines.join('\n');
}

module.exports = {
  daysBetween,
  classifyAge,
  groupByTimeline,
  buildTimelineSummary,
  formatTimelineSummary,
};
