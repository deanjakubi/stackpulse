/**
 * crossRepo.js — cross-repository PR aggregation and summary
 */

'use strict';

/**
 * Flatten PRs from multiple repos into a single list,
 * annotating each with its repo slug.
 * @param {Object} repoMap - { 'owner/repo': [PR, ...], ... }
 * @returns {Array}
 */
function flattenRepoPRs(repoMap) {
  const result = [];
  for (const [repo, prs] of Object.entries(repoMap)) {
    for (const pr of prs) {
      result.push({ ...pr, _repo: repo });
    }
  }
  return result;
}

/**
 * Count open PRs per repo.
 * @param {Object} repoMap
 * @returns {Object} { 'owner/repo': count }
 */
function countPerRepo(repoMap) {
  const counts = {};
  for (const [repo, prs] of Object.entries(repoMap)) {
    counts[repo] = prs.length;
  }
  return counts;
}

/**
 * Find the repo with the most open PRs.
 * @param {Object} repoMap
 * @returns {string|null}
 */
function busiestRepo(repoMap) {
  const counts = countPerRepo(repoMap);
  let max = -1;
  let busiest = null;
  for (const [repo, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      busiest = repo;
    }
  }
  return busiest;
}

/**
 * Build a cross-repo summary object.
 * @param {Object} repoMap
 * @returns {Object}
 */
function buildCrossRepoSummary(repoMap) {
  const counts = countPerRepo(repoMap);
  const total = Object.values(counts).reduce((s, c) => s + c, 0);
  const repos = Object.keys(repoMap);
  return {
    repos,
    repoCount: repos.length,
    total,
    counts,
    busiest: busiestRepo(repoMap),
  };
}

/**
 * Format a cross-repo summary as a human-readable string.
 * @param {Object} summary
 * @returns {string}
 */
function formatCrossRepoSummary(summary) {
  const lines = [
    `Cross-Repo Summary (${summary.repoCount} repos, ${summary.total} open PRs)`,
    '─'.repeat(50),
  ];
  for (const repo of summary.repos) {
    const count = summary.counts[repo];
    const tag = repo === summary.busiest ? ' ← busiest' : '';
    lines.push(`  ${repo.padEnd(40)} ${String(count).padStart(4)} PR(s)${tag}`);
  }
  return lines.join('\n');
}

module.exports = {
  flattenRepoPRs,
  countPerRepo,
  busiestRepo,
  buildCrossRepoSummary,
  formatCrossRepoSummary,
};
