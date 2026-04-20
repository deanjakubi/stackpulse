'use strict';

const { loadConfig } = require('./config');
const { getCached, setCached } = require('./cache');
const { githubRequest } = require('./github');
const { fetchPRs } = require('./prs');
const { computeBurndown, formatBurndownSummary } = require('./burndown');

async function fetchAllPRs(repos, token) {
  const all = [];
  for (const repo of repos) {
    try {
      const prs = await fetchPRs(repo, token, { state: 'all' });
      all.push(...prs);
    } catch (err) {
      console.error(`  [warn] failed to fetch ${repo}: ${err.message}`);
    }
  }
  return all;
}

async function runBurndownMode(argv = process.argv) {
  const windowDays = parseInt(
    (argv.find((a) => a.startsWith('--days=')) || '--days=14').split('=')[1],
    10
  );

  const config = await loadConfig();
  const { repos, token } = config;

  if (!repos || repos.length === 0) {
    console.error('No repos configured.');
    process.exit(1);
  }

  console.log(`Fetching PRs from ${repos.length} repo(s)...`);
  const prs = await fetchAllPRs(repos, token);

  if (prs.length === 0) {
    console.log('No PRs found.');
    return;
  }

  const summary = computeBurndown(prs, windowDays);
  console.log();
  console.log(formatBurndownSummary(summary));
  console.log();
}

module.exports = { runBurndownMode };

if (require.main === module) {
  runBurndownMode().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
