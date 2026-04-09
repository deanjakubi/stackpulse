const { colorize, renderSummary } = require('./display');
const { formatRateLimitSummary } = require('./rateLimit');
const { formatMetrics } = require('./metrics');

/**
 * Print a repo section header.
 * @param {string} repo  "owner/name"
 */
function printRepoHeader(repo) {
  console.log('\n' + colorize(`=== ${repo} ===`, 'cyan'));
}

/**
 * Print all PR rows for a single repo.
 * @param {Array} prs
 * @param {Function} renderRow  renderPRRow from display.js
 */
function printRepoPRs(prs, renderRow) {
  if (prs.length === 0) {
    console.log(colorize('  No open PRs', 'dim'));
    return;
  }
  for (const pr of prs) {
    console.log(renderRow(pr));
  }
}

/**
 * Print the overall summary block.
 * @param {number} totalRepos
 * @param {number} totalPRs
 */
function printSummary(totalRepos, totalPRs) {
  console.log('\n' + renderSummary(totalRepos, totalPRs));
}

/**
 * Print a rate-limit warning when remaining calls are low.
 * @param {object} rateLimitInfo  { remaining, reset }
 */
function printRateLimitWarning(rateLimitInfo) {
  if (!rateLimitInfo) return;
  const msg = formatRateLimitSummary(rateLimitInfo);
  if (msg) {
    console.warn(colorize(`\n⚠  ${msg}`, 'yellow'));
  }
}

/**
 * Print per-run metrics derived from all repo results.
 * @param {object} metrics  result of computeMetrics()
 */
function printMetrics(metrics) {
  console.log('\n' + colorize('── Metrics ──', 'magenta'));
  console.log(formatMetrics(metrics));
}

/**
 * Orchestrate the full output render.
 * @param {Array<{repo: string, prs: Array}>} repoResults
 * @param {Function} renderRow
 * @param {object|null} rateLimitInfo
 * @param {object} metrics
 */
function renderOutput(repoResults, renderRow, rateLimitInfo, metrics) {
  for (const { repo, prs } of repoResults) {
    printRepoHeader(repo);
    printRepoPRs(prs, renderRow);
  }

  const totalPRs = repoResults.reduce((sum, r) => sum + r.prs.length, 0);
  printSummary(repoResults.length, totalPRs);

  if (metrics) {
    printMetrics(metrics);
  }

  printRateLimitWarning(rateLimitInfo);
}

module.exports = {
  printRepoHeader,
  printRepoPRs,
  printSummary,
  printRateLimitWarning,
  printMetrics,
  renderOutput,
};
