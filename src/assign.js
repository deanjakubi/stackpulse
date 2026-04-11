/**
 * assign.js — utilities for grouping and summarising PRs by assignee
 */

/**
 * Count PRs per assignee across a list of PR objects.
 * PRs with no assignees are grouped under '(unassigned)'.
 * @param {Array} prs
 * @returns {Object} map of assignee login -> count
 */
function countByAssignee(prs) {
  const counts = {};
  for (const pr of prs) {
    const assignees = pr.assignees && pr.assignees.length > 0
      ? pr.assignees.map(a => a.login)
      : ['(unassigned)'];
    for (const login of assignees) {
      counts[login] = (counts[login] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Return assignees sorted by PR count descending.
 * @param {Object} counts
 * @returns {Array<{login, count}>}
 */
function sortedAssignees(counts) {
  return Object.entries(counts)
    .map(([login, count]) => ({ login, count }))
    .sort((a, b) => b.count - a.count || a.login.localeCompare(b.login));
}

/**
 * Build a formatted text summary of assignee workload.
 * @param {Array} prs
 * @returns {string}
 */
function formatAssigneeSummary(prs) {
  const counts = countByAssignee(prs);
  const sorted = sortedAssignees(counts);
  if (sorted.length === 0) return 'No PRs found.';
  const lines = sorted.map(({ login, count }) => {
    const bar = '█'.repeat(Math.min(count, 20));
    return `  ${login.padEnd(24)} ${String(count).padStart(3)}  ${bar}`;
  });
  return ['Assignee Workload', '─'.repeat(50), ...lines].join('\n');
}

module.exports = { countByAssignee, sortedAssignees, formatAssigneeSummary };
