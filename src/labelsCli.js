/**
 * labelsCli.js — CLI entry point for the --labels report command.
 */

const { loadConfig } = require('./config');
const { getCached } = require('./cache');
const { fetchPRs } = require('./prs');
const { applyFilters } = require('./filter');
const { countLabels, sortedLabels, formatLabelSummary } = require('./labels');

/**
 * Print a per-repo label breakdown to stdout.
 * @param {Array} allPRs  Flat list of PRs already fetched (optional, for testing)
 * @param {object} [opts]
 * @param {number} [opts.limit=10]
 */
function printLabelReport(allPRs, { limit = 10 } = {}) {
  if (!allPRs || allPRs.length === 0) {
    console.log('No PRs to analyse.');
    return;
  }

  // Group by repo
  const byRepo = {};
  for (const pr of allPRs) {
    const repo = pr.repo ?? 'unknown';
    (byRepo[repo] = byRepo[repo] ?? []).push(pr);
  }

  for (const [repo, prs] of Object.entries(byRepo)) {
    console.log(`\n── ${repo} ──`);
    console.log(formatLabelSummary(prs, { limit }));
  }

  console.log('\n── All repos ──');
  console.log(formatLabelSummary(allPRs, { limit }));
}

/**
 * Top-level runner used by the CLI binary.
 * @param {object} [argv]  Parsed CLI arguments
 */
async function runLabelsMode(argv = {}) {
  const config = await loadConfig();
  const limit = Number(argv.limit ?? 10);
  const allPRs = [];

  for (const repo of config.repos) {
    try {
      const prs = await fetchPRs(repo, config);
      const filtered = applyFilters(prs, argv);
      for (const pr of filtered) allPRs.push({ ...pr, repo });
    } catch (err) {
      console.error(`Error fetching ${repo}: ${err.message}`);
    }
  }

  printLabelReport(allPRs, { limit });
}

module.exports = { printLabelReport, runLabelsMode };
