#!/usr/bin/env node
// CLI entry point for the PR size distribution report

const { loadConfig } = require('./config');
const { getCached, setCached } = require('./cache');
const { githubRequest } = require('./github');
const { fetchPRs } = require('./prs');
const { applyFilters } = require('./filter');
const { buildSizeSummary, formatSizeSummary } = require('./size');

async function fetchAllPRs(repos, token) {
  const allPRs = [];
  for (const repo of repos) {
    const cacheKey = `prs:${repo}`;
    let prs = getCached(cacheKey);
    if (!prs) {
      prs = await fetchPRs(repo, token, githubRequest);
      setCached(cacheKey, prs);
    }
    allPRs.push(...prs);
  }
  return allPRs;
}

async function runSizeMode(argv = process.argv.slice(2)) {
  const config = loadConfig();
  const token = config.token || process.env.GITHUB_TOKEN;
  const repos = config.repos || [];

  if (!repos.length) {
    console.error('No repos configured. Add repos to your stackpulse config.');
    process.exit(1);
  }

  const filterOpts = {
    label: argv.includes('--label') ? argv[argv.indexOf('--label') + 1] : null,
    author: argv.includes('--author') ? argv[argv.indexOf('--author') + 1] : null,
    excludeDrafts: argv.includes('--no-drafts'),
  };

  try {
    const allPRs = await fetchAllPRs(repos, token);
    const filtered = applyFilters(allPRs, filterOpts);
    const summary = buildSizeSummary(filtered);
    console.log(formatSizeSummary(summary));
  } catch (err) {
    console.error('Error fetching PRs:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runSizeMode();
}

module.exports = { runSizeMode };
