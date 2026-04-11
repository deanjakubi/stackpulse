/**
 * labels.js — Aggregates and summarises label usage across PRs.
 */

/**
 * Count occurrences of each label across all PRs.
 * @param {Array} prs
 * @returns {Map<string, number>}
 */
function countLabels(prs) {
  const counts = new Map();
  for (const pr of prs) {
    const labels = pr.labels ?? [];
    for (const label of labels) {
      const name = typeof label === 'string' ? label : label.name;
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Return labels sorted by frequency (descending), optionally limited.
 * @param {Map<string, number>} counts
 * @param {number} [limit]
 * @returns {Array<{label: string, count: number}>}
 */
function sortedLabels(counts, limit) {
  const entries = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return limit != null ? entries.slice(0, limit) : entries;
}

/**
 * Build a formatted summary string of label usage.
 * @param {Array} prs
 * @param {object} [opts]
 * @param {number} [opts.limit=10]
 * @returns {string}
 */
function formatLabelSummary(prs, { limit = 10 } = {}) {
  const counts = countLabels(prs);
  if (counts.size === 0) return 'No labels found.';
  const top = sortedLabels(counts, limit);
  const lines = top.map(
    ({ label, count }) => `  ${label.padEnd(30)} ${count} PR${count === 1 ? '' : 's'}`
  );
  return `Label summary (top ${top.length}):\n${lines.join('\n')}`;
}

module.exports = { countLabels, sortedLabels, formatLabelSummary };
