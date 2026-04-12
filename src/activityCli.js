'use strict';

/**
 * activityCli.js — CLI entry point for the activity report command.
 * Usage: node src/activityCli.js [--repo owner/repo] [--token TOKEN]
 */

const { loadConfig } = require('./config');
const { getCached } = require('./cache');
const { fetchPRs } = require('./prs');
const {
  annotateActivity,
  buildActivitySummary,
  formatActivitySummary,
} = require('./activity');
const { colorize } = require('./display');
const { truncate, formatPRNumber } = require('./format');

const LEVEL_ICON = {
  hot: '🔥',
  warm: '♨️ ',
  cold: '🧊',
  frozen: '❄️ ',
};

function printActivityReport(repo, prs) {
  console.log(colorize(`\n── ${repo} ──`, 'cyan'));
  if (!prs.length) {
    console.log('  No open PRs.');
    return;
  }
  const annotated = annotateActivity(prs);
  for (const pr of annotated) {
    const icon = LEVEL_ICON[pr.activityLevel] || '  ';
    const num = formatPRNumber(pr.number);
    const title = truncate(pr.title, 55);
    const author = pr.user ? `@${pr.user.login}` : '';
    console.log(`  ${icon} ${num} ${title} ${colorize(author, 'dim')}`);
  }
  const summary = buildActivitySummary(annotated);
  console.log(colorize(`  ${formatActivitySummary(summary)}`, 'dim'));
}

async function runActivityMode(argv) {
  const config = loadConfig(argv);
  const repos = config.repos || [];
  if (!repos.length) {
    console.error('No repos configured. Add repos to ~/.stackpulse.json or pass --repo.');
    process.exit(1);
  }

  let totalPRs = 0;
  for (const repo of repos) {
    try {
      const prs = await fetchPRs(repo, config.token);
      printActivityReport(repo, prs);
      totalPRs += prs.length;
    } catch (err) {
      console.error(colorize(`  Error fetching ${repo}: ${err.message}`, 'red'));
    }
  }
  console.log(colorize(`\nTotal open PRs: ${totalPRs}`, 'bold'));
}

if (require.main === module) {
  const argv = require('minimist')(process.argv.slice(2));
  runActivityMode(argv).catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { printActivityReport, runActivityMode };
