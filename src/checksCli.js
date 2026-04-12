'use strict';

const { loadConfig } = require('./config');
const { getCached } = require('./cache');
const { buildCheckSummary, formatCheckSummary, annotateCheckState } = require('./checks');

/**
 * Print a per-repo CI check report.
 * @param {object[]} prs - Annotated PR objects.
 */
function printCheckReport(prs) {
  const repos = [...new Set(prs.map((pr) => pr.repo))];

  for (const repo of repos) {
    const repoPRs = prs.filter((pr) => pr.repo === repo);
    const annotated = annotateCheckState(repoPRs);
    const summary = buildCheckSummary(annotated);
    console.log(`\n── ${repo} ──`);
    console.log(formatCheckSummary(summary));

    if (summary.failingPRs.length > 0) {
      console.log('  Failing PRs:');
      for (const pr of summary.failingPRs) {
        console.log(`    #${pr.number} ${pr.title}`);
      }
    }
  }
}

/** Entry point for the checks sub-command. */
async function runChecksMode() {
  const config = loadConfig();

  const allPRs = [];
  for (const repo of config.repos) {
    const cacheKey = `prs-${repo}`;
    const cached = getCached(cacheKey);
    if (cached) {
      const prs = cached.map((pr) => ({ ...pr, repo }));
      allPRs.push(...prs);
    } else {
      console.warn(`No cached data for ${repo}. Run stackpulse first.`);
    }
  }

  if (allPRs.length === 0) {
    console.log('No PR data available. Run the main command to populate the cache.');
    return;
  }

  printCheckReport(allPRs);

  const globalAnnotated = annotateCheckState(allPRs);
  const globalSummary = buildCheckSummary(globalAnnotated);
  console.log('\n── Overall ──');
  console.log(formatCheckSummary(globalSummary));
}

module.exports = { printCheckReport, runChecksMode };
