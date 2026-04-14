'use strict';

const { loadConfig } = require('./config');
const { getCached } = require('./cachedGithub');
const { applyFilters } = require('./filter');
const {
  buildMergeableSummary,
  formatMergeableSummary,
  groupByMergeability,
  annotateMergeable,
} = require('./mergeable');

const STATE_COLOURS = {
  ready: '\x1b[32m',    // green
  blocked: '\x1b[31m',  // red
  behind: '\x1b[33m',   // yellow
  conflict: '\x1b[35m', // magenta
  draft: '\x1b[90m',    // grey
  unknown: '\x1b[37m',  // white
};
const RESET = '\x1b[0m';

function colourState(state) {
  return `${STATE_COLOURS[state] || ''}${state}${RESET}`;
}

function printMergeableReport(prs, options = {}) {
  const { verbose = false } = options;
  const summary = buildMergeableSummary(prs);
  console.log(formatMergeableSummary(summary));

  if (!verbose) return;

  const groups = groupByMergeability(annotateMergeable(prs));
  for (const [state, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    console.log(`\n${colourState(state).toUpperCase()} (${items.length})`);
    for (const pr of items) {
      console.log(`  #${pr.number} ${pr.title}`);
    }
  }
}

async function runMergeableMode(argv = {}) {
  const config = loadConfig();
  const repos = config.repos || [];
  const filters = {
    label: argv.label,
    author: argv.author,
    includeDrafts: argv.drafts,
  };

  let allPRs = [];
  for (const repo of repos) {
    const prs = await getCached(repo);
    allPRs = allPRs.concat(applyFilters(prs, filters));
  }

  printMergeableReport(allPRs, { verbose: argv.verbose });
}

module.exports = { printMergeableReport, runMergeableMode };
