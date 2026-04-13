'use strict';

const { loadConfig } = require('./config');
const { getCached, setCached } = require('./cache');
const { githubRequest } = require('./github');
const { buildCoverageSummary, formatCoverageSummary } = require('./coverage');

async function fetchPRsWithReviews(repo, token) {
  const cacheKey = `coverage:${repo}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const [owner, name] = repo.split('/');
  const prs = await githubRequest(`/repos/${owner}/${name}/pulls?state=open&per_page=50`, token);

  const withReviews = await Promise.all(
    prs.map(async (pr) => {
      const reviews = await githubRequest(
        `/repos/${owner}/${name}/pulls/${pr.number}/reviews`,
        token
      );
      return { ...pr, reviews };
    })
  );

  await setCached(cacheKey, withReviews);
  return withReviews;
}

async function printCoverageReport(repos, token) {
  for (const repo of repos) {
    console.log(`\n=== ${repo} ===`);
    try {
      const prs = await fetchPRsWithReviews(repo, token);
      if (prs.length === 0) {
        console.log('  No open PRs.');
        continue;
      }
      const summary = buildCoverageSummary(prs);
      console.log(formatCoverageSummary(summary));
    } catch (err) {
      console.error(`  Error fetching ${repo}: ${err.message}`);
    }
  }
}

async function runCoverageMode() {
  const config = await loadConfig();
  const { repos, token } = config;

  if (!repos || repos.length === 0) {
    console.error('No repos configured.');
    process.exit(1);
  }

  await printCoverageReport(repos, token);
}

module.exports = { printCoverageReport, runCoverageMode };
