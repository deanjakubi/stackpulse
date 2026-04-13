#!/usr/bin/env node
// agingCli.js — CLI entry point for the PR aging report

const { loadConfig } = require('./config');
const { getCached, setCached } = require('./cache');
const { githubRequest } = require('./github');
const { buildAgingSummary, formatAgingSummary } = require('./aging');
const { applyFilters } = require('./filter');

async function fetchPRs(repo, token) {
  const cacheKey = `prs:${repo}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;
  const [owner, name] = repo.split('/');
  const data = await githubRequest(`/repos/${owner}/${name}/pulls?state=open&per_page=100`, token);
  await setCached(cacheKey, data);
  return data;
}

async function runAgingMode(argv = process.argv.slice(2)) {
  const config = await loadConfig();
  const repos = config.repos || [];

  if (repos.length === 0) {
    console.error('No repos configured. Add repos to your .stackpulse.json.');
    process.exit(1);
  }

  const filterOpts = {
    label: argv.includes('--label') ? argv[argv.indexOf('--label') + 1] : null,
    author: argv.includes('--author') ? argv[argv.indexOf('--author') + 1] : null,
    includeDrafts: argv.includes('--drafts'),
  };

  let allPRs = [];
  for (const repo of repos) {
    try {
      const prs = await fetchPRs(repo, config.token);
      const tagged = prs.map(pr => ({ ...pr, _repo: repo }));
      allPRs = allPRs.concat(tagged);
    } catch (err) {
      console.error(`Failed to fetch PRs for ${repo}: ${err.message}`);
    }
  }

  const filtered = applyFilters(allPRs, filterOpts);
  const summary = buildAgingSummary(filtered);
  console.log(formatAgingSummary(summary));

  if (argv.includes('--detail')) {
    for (const row of summary) {
      if (row.count === 0) continue;
      console.log(`\n[${row.band}]`);
      for (const pr of row.prs) {
        console.log(`  #${pr.number} ${pr.title} (${pr._repo}) — ${pr._agingDays}d old`);
      }
    }
  }
}

module.exports = { runAgingMode };

if (require.main === module) {
  runAgingMode().catch(err => { console.error(err.message); process.exit(1); });
}
