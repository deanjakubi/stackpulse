/**
 * activity.js — Tracks and summarises recent PR activity (comments, reviews, commits)
 */

'use strict';

const { formatAge } = require('./display');

/**
 * Returns the most recent event date from a PR's activity fields.
 * @param {Object} pr
 * @returns {string|null} ISO date string or null
 */
function latestActivityDate(pr) {
  const dates = [
    pr.updated_at,
    pr.created_at,
  ].filter(Boolean);
  if (!dates.length) return null;
  return dates.sort().reverse()[0];
}

/**
 * Classifies a PR's activity level based on days since last update.
 * @param {Object} pr
 * @returns {'hot'|'warm'|'cold'|'frozen'}
 */
function classifyActivity(pr) {
  const last = latestActivityDate(pr);
  if (!last) return 'frozen';
  const days = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
  if (days < 1) return 'hot';
  if (days < 3) return 'warm';
  if (days < 7) return 'cold';
  return 'frozen';
}

/**
 * Annotates each PR with an activityLevel field.
 * @param {Object[]} prs
 * @returns {Object[]}
 */
function annotateActivity(prs) {
  return prs.map(pr => ({
    ...pr,
    activityLevel: classifyActivity(pr),
  }));
}

/**
 * Builds a summary count of PRs per activity level.
 * @param {Object[]} prs — already annotated
 * @returns {Object}
 */
function buildActivitySummary(prs) {
  const counts = { hot: 0, warm: 0, cold: 0, frozen: 0 };
  for (const pr of prs) {
    const level = pr.activityLevel || classifyActivity(pr);
    counts[level] = (counts[level] || 0) + 1;
  }
  return counts;
}

/**
 * Formats the activity summary as a human-readable string.
 * @param {Object} summary
 * @returns {string}
 */
function formatActivitySummary(summary) {
  return [
    `🔥 Hot (<1d): ${summary.hot}`,
    `♨️  Warm (<3d): ${summary.warm}`,
    `🧊 Cold (<7d): ${summary.cold}`,
    `❄️  Frozen (7d+): ${summary.frozen}`,
  ].join('  ');
}

module.exports = {
  latestActivityDate,
  classifyActivity,
  annotateActivity,
  buildActivitySummary,
  formatActivitySummary,
};
