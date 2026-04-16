const { loadConfig } = require('./config');
const { getCached, setCached } = require('./cache');
const { githubRequest } = require('./github');
const { buildBottleneckSummary, formatBottleneckSummary, annotateBottleneck } = require('./bottleneck');

async function fetchPRs(repo, token) {
  const cacheKey = `bottleneck_${repo}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;
  const [owner, name] = repo.split('/');
  const data = await githubRequest(`/repos/${owner}/${name}/pulls?state=open&per_page=50`, token);
  await setCached(cacheKey, data);
  return data;
}

function printBottleneckReport(summary, verbose = false) {
  console.log(formatBottleneckSummary(summary));
  if (verbose) {
    const { groups } = summary;
    for (const level of ['critical', 'high', 'medium']) {
      for (const pr of groups[level]) {
        console.log(`  [${level.toUpperCase()}] #${pr.number} ${pr.title} (score: ${pr.bottleneckScore})`);
      }
    }
  }
}

async function runBottleneckMode(argv = []) {
  const config = await loadConfig();
  const verbose = argv.includes('--verbose');
  const allPRs = [];

  for (const repo of config.repos) {
    try {
      const prs = await fetchPRs(repo, config.token);
      allPRs.push(...prs);
    } catch (err) {
      console.error(`Failed to fetch ${repo}: ${err.message}`);
    }
  }

  const summary = buildBottleneckSummary(allPRs);
  printBottleneckReport(summary, verbose);
}

module.exports = { printBottleneckReport, runBottleneckMode };
