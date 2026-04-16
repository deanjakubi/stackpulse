#!/usr/bin/env node
'use strict';

const { loadConfig } = require('./config');
const { getCached } = require('./cache');
const { buildHotspotSummary, formatHotspotSummary } = require('./hotspot');

async function printHotspotReport(options = {}) {
  const config = loadConfig();
  const repos = config.repos || [];
  const topN = options.top ? parseInt(options.top, 10) : 5;

  const allPRs = [];

  for (const repo of repos) {
    const cacheKey = `prs_${repo.replace('/', '_')}`;
    const prs = (await getCached(cacheKey)) || [];
    for (const pr of prs) {
      allPRs.push({ ...pr, repo });
    }
  }

  if (allPRs.length === 0) {
    console.log('No PR data found. Run stackpulse first to populate the cache.');
    return;
  }

  const summary = buildHotspotSummary(allPRs, topN);
  console.log('\n=== PR Hotspots ===\n');
  console.log(formatHotspotSummary(summary));
  console.log();
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--top' && args[i + 1]) {
      options.top = args[++i];
    }
  }
  printHotspotReport(options).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { printHotspotReport };
