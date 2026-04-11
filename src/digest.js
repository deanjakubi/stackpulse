/**
 * digest.js — generates a daily/periodic digest summary of PR activity
 */

const { computeMetrics } = require('./metrics');
const { formatDuration, formatCount, formatRepoSlug } = require('./format');

/**
 * Builds a per-repo digest entry.
 * @param {string} repo
 * @param {Array} prs
 * @returns {object}
 */
function buildRepoDigest(repo, prs) {
  const metrics = computeMetrics(prs);
  return {
    repo,
    total: prs.length,
    open: prs.filter(p => p.state === 'open').length,
    drafts: prs.filter(p => p.draft).length,
    avgAge: metrics.avgAgeDays,
    stalePRs: metrics.stalePRs,
    authors: [...new Set(prs.map(p => p.user?.login).filter(Boolean))],
  };
}

/**
 * Builds a full digest across all repos.
 * @param {Record<string, Array>} prsByRepo — map of repo slug -> PR list
 * @returns {object}
 */
function buildDigest(prsByRepo) {
  const repos = Object.entries(prsByRepo).map(([repo, prs]) =>
    buildRepoDigest(repo, prs)
  );

  const totalPRs = repos.reduce((s, r) => s + r.total, 0);
  const totalOpen = repos.reduce((s, r) => s + r.open, 0);
  const totalStale = repos.reduce((s, r) => s + r.stalePRs, 0);
  const allAuthors = [...new Set(repos.flatMap(r => r.authors))];

  return {
    generatedAt: new Date().toISOString(),
    totalRepos: repos.length,
    totalPRs,
    totalOpen,
    totalStale,
    uniqueAuthors: allAuthors.length,
    repos,
  };
}

/**
 * Formats a digest object into a human-readable string.
 * @param {object} digest
 * @returns {string}
 */
function formatDigest(digest) {
  const lines = [
    `📋 StackPulse Digest — ${new Date(digest.generatedAt).toLocaleString()}`,
    `Repos: ${formatCount(digest.totalRepos)} | PRs: ${formatCount(digest.totalPRs)} open: ${formatCount(digest.totalOpen)} | Stale: ${formatCount(digest.totalStale)} | Authors: ${formatCount(digest.uniqueAuthors)}`,
    '',
  ];

  for (const r of digest.repos) {
    lines.push(
      `  ${formatRepoSlug(r.repo).padEnd(40)} ` +
        `open: ${String(r.open).padStart(3)}  ` +
        `drafts: ${String(r.drafts).padStart(2)}  ` +
        `stale: ${String(r.stalePRs).padStart(2)}  ` +
        `avg age: ${formatDuration(r.avgAge * 24 * 60 * 60 * 1000)}`
    );
  }

  return lines.join('\n');
}

module.exports = { buildRepoDigest, buildDigest, formatDigest };
