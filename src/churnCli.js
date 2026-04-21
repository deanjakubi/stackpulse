'use strict';

const { loadConfig } = require('./config');
const { getCached } = require('./cachedGithub');
const { fetchAllPRs } = require('./prs');
const { applyFilters } = require('./filter');
const { buildChurnSummary, formatChurnSummary, annotateChurn } = require('./churn');

const CHURN_COLOURS = {
  'very-high': '\x1b[31m', // red
  high: '\x1b[33m',        // yellow
  medium: '\x1b[36m',      // cyan
  low: '\x1b[32m',         // green
};
const RESET = '\x1b[0m';

function colourLevel(level) {
  return `${CHURN_COLOURS[level] || ''}${level}${RESET}`;
}

function printChurnReport(prs, options = {}) {
  const annotated = annotateChurn(prs);
  const summary = buildChurnSummary(prs);
  const { groups, total } = summary;

  console.log('\n=== PR Churn Report ===');
  console.log(`Total PRs analysed: ${total}\n`);

  for (const level of ['very-high', 'high', 'medium', 'low']) {
    const group = groups[level];
    if (!group.length) continue;
    console.log(`${colourLevel(level)} (${group.length})`);
    for (const pr of group) {
      const { files, lines, additions, deletions } = pr._churnScore;
      const title = (pr.title || '').slice(0, 55);
      console.log(`  #${String(pr.number).padEnd(6)} ${title.padEnd(56)} +${additions}/-${deletions} (${files} files, ${lines} lines)`);
    }
    console.log('');
  }

  if (options.summary) {
    console.log(formatChurnSummary(summary));
  }
}

async function runChurnMode(argv = {}) {
  const config = loadConfig();
  const repos = config.repos || [];
  if (!repos.length) {
    console.error('No repos configured.');
    process.exit(1);
  }

  const allPRs = [];
  for (const repo of repos) {
    const prs = await fetchAllPRs(repo, { getCached });
    allPRs.push(...prs);
  }

  const filtered = applyFilters(allPRs, argv);
  printChurnReport(filtered, { summary: argv.summary });
}

module.exports = { printChurnReport, runChurnMode };
