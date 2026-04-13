'use strict';

const { loadConfig } = require('./config');
const { getCached, setCached } = require('./cache');
const { githubRequest } = require('./github');
const { applyFilters } = require('./filter');
const {
  buildFirstResponseSummary,
  formatFirstResponseSummary,
  annotateFirstResponse,
} = require('./firstResponse');

async function fetchPRsWithResponseDates(repo, token) {
  const [owner, name] = repo.split('/');
  const prs = await githubRequest(`/repos/${owner}/${name}/pulls?state=open&per_page=50`, token);
  return prs.map((pr) => ({
    ...pr,
    review_comments_dates: [],
    review_dates: [],
  }));
}

function printFirstResponseReport(prs, repo) {
  const annotated = annotateFirstResponse(prs);
  const summary = buildFirstResponseSummary(prs);

  console.log(`\n=== First Response Report: ${repo} ===`);
  for (const pr of annotated) {
    const days =
      pr.firstResponseDays !== null ? pr.firstResponseDays.toFixed(1) + 'd' : 'no response';
    console.log(
      `  #${pr.number} [${pr.firstResponseClass.padEnd(8)}] ${days.padStart(11)}  ${pr.title}`
    );
  }
  console.log();
  console.log(formatFirstResponseSummary(summary));
}

async function runFirstResponseMode(argv) {
  const config = loadConfig();
  const token = process.env.GITHUB_TOKEN || config.token;
  const repos = argv.repo ? [argv.repo] : config.repos || [];

  if (!repos.length) {
    console.error('No repos configured. Use --repo or set repos in config.');
    process.exit(1);
  }

  for (const repo of repos) {
    const cacheKey = `first-response-${repo}`;
    let prs = getCached(cacheKey);
    if (!prs) {
      prs = await fetchPRsWithResponseDates(repo, token);
      setCached(cacheKey, prs);
    }

    const filtered = applyFilters(prs, argv);
    printFirstResponseReport(filtered, repo);
  }
}

module.exports = { printFirstResponseReport, runFirstResponseMode };
