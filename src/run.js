#!/usr/bin/env node
'use strict';

const { loadConfig } = require('./config');
const { getCached, setCached } = require('./cache');
const { fetchPRs } = require('./prs');
const { applyFilters } = require('./filter');
const { notifyOnChanges } = require('./notify');
const { normaliseAll } = require('./snapshot');
const { renderOutput } = require('./output');

async function run() {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(`Configuration error: ${err.message}`);
    process.exit(1);
  }

  const { repos, filters = {}, token } = config;

  if (!repos || repos.length === 0) {
    console.error('No repositories configured. Add repos to your config file.');
    process.exit(1);
  }

  const repoResults = [];
  let rateLimit = null;

  for (const repo of repos) {
    try {
      const { prs, rateLimit: rl } = await fetchPRs(repo, token);
      if (rl) rateLimit = rl;

      const filtered = applyFilters(prs, filters);
      repoResults.push({ repo, prs: filtered });

      const previousSnapshot = await getCached(`snapshot:${repo}`);
      const currentSnapshot = normaliseAll(filtered);
      await notifyOnChanges(repo, previousSnapshot, currentSnapshot);
      await setCached(`snapshot:${repo}`, currentSnapshot);
    } catch (err) {
      console.error(`Failed to fetch PRs for ${repo}: ${err.message}`);
      repoResults.push({ repo, prs: [] });
    }
  }

  renderOutput(repoResults, rateLimit);
}

run().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
