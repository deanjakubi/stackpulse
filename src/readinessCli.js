/**
 * readinessCli.js — CLI entry point for merge-readiness report.
 */

const { loadConfig } = require('./config');
const { getCached } = require('./cache');
const { applyFilters } = require('./filter');
const {
  annotateReadiness,
  groupByReadiness,
  buildReadinessSummary,
  formatReadinessSummary,
} = require('./readiness');
const { colorize } = require('./display');

const STATE_COLORS = {
  ready: 'green',
  blocked: 'red',
  pending: 'yellow',
  draft: 'cyan',
};

function printReadinessReport(allPRs, options = {}) {
  const filtered = applyFilters(allPRs, options);
  const annotated = annotateReadiness(filtered);
  const groups = groupByReadiness(annotated);
  const summary = buildReadinessSummary(annotated);

  const order = ['ready', 'pending', 'blocked', 'draft'];

  for (const state of order) {
    const prs = groups[state] || [];
    if (prs.length === 0) continue;

    const label = colorize(state.toUpperCase().padEnd(8), STATE_COLORS[state]);
    console.log(`\n${label}`);

    for (const pr of prs) {
      const repo = pr.repo || 'unknown';
      const num = `#${pr.number}`;
      const title = pr.title.length > 60 ? pr.title.slice(0, 57) + '...' : pr.title;
      console.log(`  ${colorize(num, 'cyan')} [${repo}] ${title}`);
    }
  }

  console.log('\n' + formatReadinessSummary(summary));
}

async function runReadinessMode(options = {}) {
  const config = loadConfig();
  const allPRs = [];

  for (const repo of config.repos) {
    const cached = await getCached(repo, 'prs');
    if (cached) {
      const tagged = cached.map(pr => ({ ...pr, repo }));
      allPRs.push(...tagged);
    }
  }

  if (allPRs.length === 0) {
    console.log('No PR data found. Run stackpulse first to populate cache.');
    return;
  }

  printReadinessReport(allPRs, options);
}

module.exports = { printReadinessReport, runReadinessMode };
