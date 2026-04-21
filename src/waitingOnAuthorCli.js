#!/usr/bin/env node
// CLI entry point for the waiting-on-author report

const { loadConfig } = require('./config');
const { fetchAllPRs } = require('./prs');
const { applyFilters } = require('./filter');
const {
  annotateWaiting,
  buildWaitingSummary,
  formatWaitingSummary,
} = require('./waitingOnAuthor');

const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

function printWaitingReport(prs, options = {}) {
  const annotated = annotateWaiting(prs);
  const waiting = annotated.filter(pr => pr.waitingOnAuthor);

  if (waiting.length === 0) {
    console.log(`${DIM}No PRs currently waiting on author.${RESET}`);
    return;
  }

  console.log(`\n${YELLOW}PRs Waiting on Author${RESET}`);
  console.log('─'.repeat(60));

  for (const pr of waiting) {
    const author = pr.user?.login || 'unknown';
    const repo = pr.repo || pr.base?.repo?.full_name || 'unknown';
    const title = pr.title.length > 45 ? pr.title.slice(0, 42) + '...' : pr.title;
    console.log(
      `${CYAN}#${pr.number}${RESET} ${title}  ${DIM}[${repo}] @${author}${RESET}`
    );
  }

  console.log('─'.repeat(60));
  const summary = buildWaitingSummary(annotated);
  console.log(formatWaitingSummary(summary));
  console.log();
}

async function runWaitingMode(argv = process.argv.slice(2)) {
  const config = loadConfig();
  const options = {
    label: argv.find((_, i) => argv[i - 1] === '--label'),
    author: argv.find((_, i) => argv[i - 1] === '--author'),
    noDrafts: argv.includes('--no-drafts'),
  };

  const raw = await fetchAllPRs(config);
  const filtered = applyFilters(raw, options);
  printWaitingReport(filtered, options);
}

if (require.main === module) {
  runWaitingMode().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { printWaitingReport, runWaitingMode };
