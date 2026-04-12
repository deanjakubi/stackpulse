#!/usr/bin/env node
/**
 * draftCli.js — CLI entry point for the draft PR report
 */

const { loadConfig } = require('./config');
const { getCached, setCached } = require('./cache');
const { cachedGithubWithRetry } = require('./cachedGithubWithRetry');
const { fetchAllPRs } = require('./prs');
const { buildDraftSummary, formatDraftSummary } = require('./draft');
const { applyFilters } = require('./filter');

async function runDraftMode(argv = process.argv.slice(2)) {
  const config = await loadConfig();
  const repos = config.repos || [];

  if (repos.length === 0) {
    console.error('No repos configured.');
    process.exit(1);
  }

  const allPRs = [];

  for (const repo of repos) {
    try {
      const prs = await fetchAllPRs(repo, config, cachedGithubWithRetry);
      const filtered = applyFilters(prs, config);
      allPRs.push(...filtered);
    } catch (err) {
      console.error(`Error fetching PRs for ${repo}: ${err.message}`);
    }
  }

  const summary = buildDraftSummary(allPRs);
  console.log(formatDraftSummary(summary));
}

if (require.main === module) {
  runDraftMode().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { runDraftMode };
