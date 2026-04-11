/**
 * assignCli.js — CLI entry point for the assignee workload report
 */

const { loadConfig } = require('./config');
const { getCached, setCached } = require('./cache');
const { fetchPRsForRepo } = require('./prs');
const { applyFilters } = require('./filter');
const { formatAssigneeSummary } = require('./assign');

async function runAssignMode(argv = {}) {
  const config = await loadConfig();
  const repos = config.repos || [];

  if (repos.length === 0) {
    console.error('No repos configured. Add repos to your stackpulse config.');
    process.exit(1);
  }

  const allPRs = [];

  for (const repo of repos) {
    try {
      const cacheKey = `prs:${repo}`;
      let prs = await getCached(cacheKey);
      if (!prs) {
        prs = await fetchPRsForRepo(repo, config.token);
        await setCached(cacheKey, prs, config.cacheTtl || 60);
      }
      const filtered = applyFilters(prs, argv);
      allPRs.push(...filtered);
    } catch (err) {
      console.error(`Error fetching PRs for ${repo}: ${err.message}`);
    }
  }

  if (argv.json) {
    const { countByAssignee } = require('./assign');
    console.log(JSON.stringify(countByAssignee(allPRs), null, 2));
    return;
  }

  console.log();
  console.log(formatAssigneeSummary(allPRs));
  console.log();
}

module.exports = { runAssignMode };
