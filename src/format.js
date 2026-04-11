/**
 * format.js
 * Utilities for formatting PR data into human-readable strings for CLI output.
 */

'use strict';

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Format a duration in milliseconds to a short human-readable string.
 * @param {number} ms
 * @returns {string}
 */
function formatDuration(ms) {
  if (ms < MS_PER_MINUTE) return `${Math.floor(ms / 1000)}s`;
  if (ms < MS_PER_HOUR) return `${Math.floor(ms / MS_PER_MINUTE)}m`;
  if (ms < MS_PER_DAY) return `${Math.floor(ms / MS_PER_HOUR)}h`;
  return `${Math.floor(ms / MS_PER_DAY)}d`;
}

/**
 * Format a PR count with singular/plural label.
 * @param {number} count
 * @param {string} label
 * @returns {string}
 */
function formatCount(count, label) {
  return `${count} ${label}${count === 1 ? '' : 's'}`;
}

/**
 * Truncate a string to maxLen, appending ellipsis if needed.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
function truncate(str, maxLen) {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/**
 * Format a repo slug as "owner/repo".
 * @param {string} owner
 * @param {string} repo
 * @returns {string}
 */
function formatRepoSlug(owner, repo) {
  if (!owner || !repo) return '';
  return `${owner}/${repo}`;
}

/**
 * Format a PR number with a leading '#'.
 * @param {number|string} number
 * @returns {string}
 */
function formatPRNumber(number) {
  return `#${number}`;
}

module.exports = {
  formatDuration,
  formatCount,
  truncate,
  formatRepoSlug,
  formatPRNumber,
};
