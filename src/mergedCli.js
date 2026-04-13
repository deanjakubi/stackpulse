'use strict';

const { loadConfig } = require('./config');
const { getCached } = require('./cachedGithubWithRetry');
const { partitionMerged, buildMergedSummary, formatMergedSummary } = require('./merged');

const DEFAULT_DAYS = 7;

async function runMergedMode(argv = process.argv) {
  const days = parseInt(
    (argv.find((a) => a.startsWith('--days=')) || `--days=${DEFAULT_DAYS}`).split('=')[1],
    10
  );

  const config = loadConfig();
  const repos = config.repos || [];

  if (repos.length === 0) {
    console.log('No repos configured.');
    return;
  }

  let allMerged = [];

  for (const repo of repos) {
    const prs = await getCached(repo, config);
    const { merged } = partitionMerged(prs, days);
    if (merged.length > 0) {
      console.log(`\n${repo} — ${merged.length} merged`);
      for (const pr of merged) {
        const author = pr.user?.login ?? 'unknown';
        const title = (pr.title || '').slice(0, 60);
        console.log(`  #${pr.number} [${author}] ${title}`);
      }
    }
    allMerged = allMerged.concat(merged);
  }

  console.log('\n' + formatMergedSummary(buildMergedSummary(allMerged), days));
}

module.exports = { runMergedMode };
