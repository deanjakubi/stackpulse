#!/usr/bin/env node
// CLI entry-point for the dependabot report

const { loadConfig } = require('./config');
const { getCached } = require('./cachedGithub');
const { buildDependabotSummary, formatDependabotSummary, isDependabot } = require('./dependabot');

/**
 * Print a table of open dependabot PRs.
 * @param {object[]} prs
 */
function printDependabotPRs(prs) {
  const open = prs.filter(p => p.state === 'open');
  if (open.length === 0) {
    console.log('  (no open dependabot PRs)');
    return;
  }
  for (const pr of open) {
    console.log(`  #${pr.number}  ${pr.title}`);
  }
}

/**
 * Run the dependabot report for all configured repos.
 * @param {object} [opts]
 * @param {boolean} [opts.list]  Also list individual open bot PRs
 */
async function runDependabotMode(opts = {}) {
  const config = loadConfig();
  const allPRs = [];

  for (const repo of config.repos) {
    const prs = await getCached(repo, config);
    allPRs.push(...prs);
  }

  const botPRs = allPRs.filter(isDependabot);

  if (opts.list) {
    console.log('\nOpen Dependabot PRs:');
    printDependabotPRs(botPRs);
    console.log();
  }

  const summary = buildDependabotSummary(allPRs);
  console.log(formatDependabotSummary(summary));
}

module.exports = { printDependabotPRs, runDependabotMode };

if (require.main === module) {
  const list = process.argv.includes('--list');
  runDependabotMode({ list }).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
