'use strict';

const { loadConfig } = require('./config');
const { getCached } = require('./cachedGithub');
const { fetchAllPRs } = require('./prs');
const { buildReopenedSummary, formatReopenedSummary } = require('./reopened');

async function printReopenedReport(options = {}) {
  const config = loadConfig();
  const repos = config.repos || [];

  if (repos.length === 0) {
    console.log('No repos configured.');
    return;
  }

  const allPRs = [];

  for (const repo of repos) {
    try {
      const prs = await fetchAllPRs(repo, getCached);
      for (const pr of prs) {
        allPRs.push({ ...pr, repo });
      }
    } catch (err) {
      console.error(`Error fetching PRs for ${repo}: ${err.message}`);
    }
  }

  const summary = buildReopenedSummary(allPRs);
  console.log(formatReopenedSummary(summary));

  if (options.json) {
    console.log(JSON.stringify(summary.reopened, null, 2));
  }
}

module.exports = { printReopenedReport };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opts = { json: args.includes('--json') };
  printReopenedReport(opts).catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
