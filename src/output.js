const { renderPRRow, renderSummary } = require('./display');
const { formatRateLimitSummary, isRateLimitLow } = require('./rateLimit');

/**
 * Prints a section header to stdout.
 * @param {string} repoName
 */
function printRepoHeader(repoName) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📦 ${repoName}`);
  console.log('─'.repeat(60));
}

/**
 * Prints all PR rows for a single repo.
 * @param {string} repoName
 * @param {Array} prs
 */
function printRepoPRs(repoName, prs) {
  printRepoHeader(repoName);
  if (!prs || prs.length === 0) {
    console.log('  No open pull requests.');
    return;
  }
  prs.forEach((pr) => console.log(renderPRRow(pr)));
}

/**
 * Prints the aggregate summary across all repos.
 * @param {Array<{repo: string, prs: Array}>} repoResults
 */
function printSummary(repoResults) {
  const allPRs = repoResults.flatMap((r) => r.prs);
  console.log(`\n${'═'.repeat(60)}`);
  console.log(renderSummary(allPRs));
}

/**
 * Prints a rate-limit warning if the remaining quota is low.
 * @param {object} rateLimit
 */
function printRateLimitWarning(rateLimit) {
  if (!rateLimit) return;
  if (isRateLimitLow(rateLimit)) {
    console.warn(`\n⚠️  ${formatRateLimitSummary(rateLimit)}`);
  }
}

/**
 * Main output entry point — renders everything to the terminal.
 * @param {Array<{repo: string, prs: Array}>} repoResults
 * @param {object|null} rateLimit
 */
function renderOutput(repoResults, rateLimit = null) {
  repoResults.forEach(({ repo, prs }) => printRepoPRs(repo, prs));
  printSummary(repoResults);
  printRateLimitWarning(rateLimit);
}

module.exports = { printRepoHeader, printRepoPRs, printSummary, printRateLimitWarning, renderOutput };
