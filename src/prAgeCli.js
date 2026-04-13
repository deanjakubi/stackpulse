// prAgeCli.js — CLI entry-point for the PR age report

const { loadConfig } = require('./config');
const { getCached } = require('./cachedGithub');
const { buildPRAgeSummary, formatPRAgeSummary, annotatePRAge } = require('./prAge');
const { colorize } = require('./display');

const BAND_COLORS = {
  fresh: 'green',
  recent: 'cyan',
  aging: 'yellow',
  stale: 'red',
};

function printPRAgeBand(label, prs, color) {
  if (!prs.length) return;
  console.log(colorize(`\n  ${label} (${prs.length})`, color));
  for (const pr of prs) {
    const age = `${pr._ageDays}d`;
    console.log(`    #${pr.number} [${age}] ${pr.title}`);
  }
}

async function runPRAgeMode(argv = {}) {
  const config = loadConfig();
  const repos = config.repos || [];

  if (!repos.length) {
    console.error('No repos configured.');
    process.exit(1);
  }

  const allPRs = [];

  for (const repo of repos) {
    const prs = await getCached(repo);
    allPRs.push(...(prs || []));
  }

  const annotated = annotatePRAge(allPRs);
  const summary = buildPRAgeSummary(annotated);

  console.log(colorize('\n=== PR Age Report ===', 'bold'));
  console.log(formatPRAgeSummary(summary));

  if (argv.verbose) {
    for (const [band, color] of Object.entries(BAND_COLORS)) {
      printPRAgeBand(band.toUpperCase(), summary.groups[band], color);
    }
  }

  console.log('');
}

module.exports = { runPRAgeMode, printPRAgeBand };
