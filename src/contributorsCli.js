/**
 * contributorsCli.js
 * CLI entry point for the contributors report.
 */

const { loadConfig } = require('./config');
const { getCached } = require('./cache');
const { buildContributorSummary, formatContributorSummary } = require('./contributors');
const { applyFilters } = require('./filter');

/**
 * Print the contributor report to stdout.
 * @param {Array} prs
 * @param {Object} options
 */
function printContributorReport(prs, options = {}) {
  const filtered = applyFilters(prs, options);
  const summary = buildContributorSummary(filtered);
  const top = options.top ? summary.slice(0, options.top) : summary;
  console.log(formatContributorSummary(top));
  console.log(`\nTotal contributors: ${top.length}`);
}

/**
 * Run contributors mode from CLI args.
 * @param {Array} argv  process.argv slice
 */
async function runContributorsMode(argv = []) {
  const config = loadConfig();
  const options = {};

  const topIdx = argv.indexOf('--top');
  if (topIdx !== -1 && argv[topIdx + 1]) {
    options.top = parseInt(argv[topIdx + 1], 10);
  }

  const authorIdx = argv.indexOf('--author');
  if (authorIdx !== -1 && argv[authorIdx + 1]) {
    options.author = argv[authorIdx + 1];
  }

  const allPRs = [];
  for (const repo of config.repos) {
    const cacheKey = `prs_${repo.replace('/', '_')}`;
    const prs = (await getCached(cacheKey)) || [];
    for (const pr of prs) {
      allPRs.push({ ...pr, _repo: repo });
    }
  }

  if (!allPRs.length) {
    console.log('No PR data found. Run stackpulse first to populate the cache.');
    return;
  }

  printContributorReport(allPRs, options);
}

module.exports = { printContributorReport, runContributorsMode };
