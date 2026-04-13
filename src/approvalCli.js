'use strict';

const { loadConfig } = require('./config');
const { getCached } = require('./cachedGithub');
const { annotateApproval, buildApprovalSummary, formatApprovalSummary } = require('./approval');
const { applyFilters } = require('./filter');

async function fetchAllPRs(repos, token) {
  const results = [];
  for (const repo of repos) {
    const [owner, name] = repo.split('/');
    const prs = await getCached(owner, name, token);
    for (const pr of prs) {
      results.push({ ...pr, repo });
    }
  }
  return results;
}

async function printApprovalReport(argv = {}) {
  const config = loadConfig();
  const token = process.env.GITHUB_TOKEN || config.token;
  const repos = argv.repo ? [argv.repo] : config.repos;

  if (!repos || repos.length === 0) {
    console.error('No repos configured. Add repos to .stackpulse.json or pass --repo.');
    process.exit(1);
  }

  let prs = await fetchAllPRs(repos, token);
  prs = applyFilters(prs, argv);
  const annotated = annotateApproval(prs);
  const summary = buildApprovalSummary(annotated);

  if (argv.json) {
    console.log(JSON.stringify({ prs: annotated, summary }, null, 2));
    return;
  }

  console.log(formatApprovalSummary(summary));

  if (argv.verbose) {
    console.log('\nPR Detail:');
    for (const pr of annotated) {
      console.log(`  [${pr.approvalState.padEnd(18)}] #${pr.number} ${pr.title} (${pr.repo})`);
    }
  }
}

module.exports = { printApprovalReport };
