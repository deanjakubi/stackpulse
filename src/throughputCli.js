#!/usr/bin/env node
'use strict';

const { loadConfig } = require('./config');
const { getCached } = require('./cache');
const { applyFilters } = require('./filter');
const { buildThroughputSummary, formatThroughputSummary } = require('./throughput');

async function printThroughputReport(argv = process.argv.slice(2)) {
  const windowDays = parseInt(
    argv.find((a) => a.startsWith('--days='))?.split('=')[1] || '30',
    10
  );

  const config = loadConfig();
  const allPRs = [];

  for (const repo of config.repos) {
    const cacheKey = `prs_${repo.replace('/', '_')}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      allPRs.push(...cached);
    }
  }

  if (allPRs.length === 0) {
    console.log('No cached PR data found. Run stackpulse first.');
    return;
  }

  const filters = {
    label: argv.find((a) => a.startsWith('--label='))?.split('=')[1],
    author: argv.find((a) => a.startsWith('--author='))?.split('=')[1],
    noDrafts: argv.includes('--no-drafts'),
  };

  const filtered = applyFilters(allPRs, filters);
  const summary = buildThroughputSummary(filtered, windowDays);
  console.log(formatThroughputSummary(summary));
}

if (require.main === module) {
  printThroughputReport().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { printThroughputReport };
