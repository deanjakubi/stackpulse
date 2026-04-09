#!/usr/bin/env node
'use strict';

const { loadConfig } = require('./config');
const { fetchAllPRs } = require('./prs');
const { applyFilters } = require('./filter');
const { renderPRRow, renderSummary, colorize } = require('./display');
const { notifyOnChanges } = require('./notify');
const { loadSnapshot, saveSnapshot } = require('./snapshot');
const { fetchRateLimit, formatRateLimitSummary, isRateLimitLow } = require('./rateLimit');

async function run() {
  let config;
  try {
    config = await loadConfig();
  } catch (err) {
    console.error(colorize('red', `Config error: ${err.message}`));
    process.exit(1);
  }

  // Rate limit check before making API calls
  try {
    const rate = await fetchRateLimit(config);
    const summary = formatRateLimitSummary(rate);
    if (isRateLimitLow(rate)) {
      console.warn(colorize('yellow', `⚠  ${summary}`));
    } else {
      console.log(colorize('dim', summary));
    }
  } catch {
    // Non-fatal — continue even if rate limit check fails
  }

  let allPRs = [];
  for (const repo of config.repos) {
    try {
      const prs = await fetchAllPRs(repo, config);
      allPRs = allPRs.concat(prs);
    } catch (err) {
      console.error(colorize('red', `Failed to fetch PRs for ${repo}: ${err.message}`));
    }
  }

  const filtered = applyFilters(allPRs, config);

  const previous = await loadSnapshot(config);
  await notifyOnChanges(previous, filtered, config);
  await saveSnapshot(filtered, config);

  console.log('');
  filtered.forEach((pr) => console.log(renderPRRow(pr)));
  console.log('');
  console.log(renderSummary(filtered));
}

run();
