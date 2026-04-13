#!/usr/bin/env node
'use strict';

const { loadConfig } = require('./config');
const { getCached } = require('./cache');
const { annotateBlocked, buildBlockedSummary, formatBlockedSummary } = require('./blocked');
const { colorize } = require('./display');

const REASON_LABELS = {
  label: 'Label',
  changes_requested: 'Changes Requested',
  failing_checks: 'Failing Checks',
};

function printBlockedReport(allPRs, options = {}) {
  const { verbose = false } = options;
  const annotated = annotateBlocked(allPRs);
  const blocked = annotated.filter(pr => pr.blocked);
  const summary = buildBlockedSummary(allPRs);

  if (blocked.length === 0) {
    console.log(colorize('green', 'No blocked PRs found.'));
    return;
  }

  console.log(colorize('red', `\n⛔ Blocked PRs (${blocked.length})\n`));

  blocked.forEach(pr => {
    const reason = REASON_LABELS[pr.blockReason] || pr.blockReason;
    const repo = pr.repo || 'unknown';
    const line = `  #${pr.number} [${repo}] ${pr.title}  — ${colorize('yellow', reason)}`;
    console.log(line);
    if (verbose && pr.blockReason === 'changes_requested') {
      const reviewers = (pr.reviews || [])
        .filter(r => r.state === 'CHANGES_REQUESTED')
        .map(r => r.user && r.user.login)
        .filter(Boolean);
      if (reviewers.length) console.log(`    Reviewers: ${reviewers.join(', ')}`);
    }
  });

  console.log();
  console.log(formatBlockedSummary(summary));
}

async function runBlockedMode(argv = []) {
  const verbose = argv.includes('--verbose') || argv.includes('-v');
  const config = loadConfig();
  const allPRs = [];

  for (const repo of config.repos || []) {
    const cached = await getCached(repo, 'prs') || [];
    cached.forEach(pr => allPRs.push({ ...pr, repo }));
  }

  printBlockedReport(allPRs, { verbose });
}

module.exports = { printBlockedReport, runBlockedMode };
