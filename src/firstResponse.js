/**
 * firstResponse.js
 * Tracks time-to-first-response on PRs (first review comment or review event).
 */

'use strict';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(dateA, dateB) {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.max(0, (b - a) / MS_PER_DAY);
}

function getFirstResponseDate(pr) {
  const events = [
    ...(pr.review_comments_dates || []),
    ...(pr.review_dates || []),
  ];
  if (!events.length) return null;
  return events.sort()[0];
}

function classifyResponseTime(days) {
  if (days === null) return 'none';
  if (days < 1) return 'fast';
  if (days < 3) return 'moderate';
  return 'slow';
}

function annotateFirstResponse(prs) {
  return prs.map((pr) => {
    const firstDate = getFirstResponseDate(pr);
    const days = firstDate ? daysBetween(pr.created_at, firstDate) : null;
    return {
      ...pr,
      firstResponseDays: days,
      firstResponseClass: classifyResponseTime(days),
    };
  });
}

function buildFirstResponseSummary(prs) {
  const annotated = annotateFirstResponse(prs);
  const counts = { fast: 0, moderate: 0, slow: 0, none: 0 };
  let totalDays = 0;
  let responded = 0;

  for (const pr of annotated) {
    counts[pr.firstResponseClass]++;
    if (pr.firstResponseDays !== null) {
      totalDays += pr.firstResponseDays;
      responded++;
    }
  }

  const avgDays = responded > 0 ? totalDays / responded : null;
  return { counts, avgDays, total: prs.length, responded };
}

function formatFirstResponseSummary(summary) {
  const { counts, avgDays, total, responded } = summary;
  const avg = avgDays !== null ? avgDays.toFixed(1) + 'd' : 'N/A';
  const lines = [
    `First Response Summary (${total} PRs, ${responded} with response)`,
    `  Avg response time : ${avg}`,
    `  Fast   (<1d)      : ${counts.fast}`,
    `  Moderate (1-3d)   : ${counts.moderate}`,
    `  Slow   (>3d)      : ${counts.slow}`,
    `  No response       : ${counts.none}`,
  ];
  return lines.join('\n');
}

module.exports = {
  daysBetween,
  getFirstResponseDate,
  classifyResponseTime,
  annotateFirstResponse,
  buildFirstResponseSummary,
  formatFirstResponseSummary,
};
