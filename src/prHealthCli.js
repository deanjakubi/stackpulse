'use strict';

// prHealthCli.js — CLI entry-point for the PR health report

const { loadConfig } = require('./config');
const { getCached } = require('./cachedGithub');
const { applyFilters } = require('./filter');
const { annotateHealth, buildHealthSummary, formatHealthSummary } = require('./prHealth');
const { annotateApproval } = require('./approval');
const { annotateCheckState } = require('./checks');
const { annotateStalePRs } = require('./stale');
const { annotateBottleneck } = require('./bottleneck');

const BAND_ICON = {
  healthy: '✅',
  fair: '🟡',
  'at-risk': '🟠',
  critical: '🔴',
};

/**
 * Print a single PR row for the health report.
 * @param {object} pr
 */
function printHealthRow(pr) {
  const icon = BAND_ICON[pr.healthBand] || '❓';
  const score = String(pr.healthScore).padStart(3);
  const num = `#${pr.number}`.padEnd(6);
  const title = (pr.title || '').slice(0, 55).padEnd(55);
  console.log(`  ${icon} ${score}/100  ${num}  ${title}  [${pr.healthBand}]`);
}

/**
 * Run the health report for all configured repos.
 */
async function runHealthReport() {
  const config = loadConfig();
  const flags = config.flags || {};
  const allPRs = [];

  for (const repo of config.repos) {
    const prs = await getCached(repo, config);
    allPRs.push(...prs);
  }

  let prs = applyFilters(allPRs, flags);

  // Layer in signals required by health scoring
  prs = annotateStalePRs(prs, flags.staleDays || 7);
  prs = annotateApproval(prs);
  prs = annotateCheckState(prs);
  // isBlocked comes from bottleneck annotation (reuses the field)
  prs = annotateBottleneck(prs);

  prs = annotateHealth(prs);

  // Sort worst-first
  prs.sort((a, b) => a.healthScore - b.healthScore);

  console.log('\nPR Health Report\n' + '='.repeat(60));
  for (const pr of prs) {
    printHealthRow(pr);
  }

  const summary = buildHealthSummary(prs);
  console.log('\n' + formatHealthSummary(summary));
}

module.exports = { runHealthReport, printHealthRow };
