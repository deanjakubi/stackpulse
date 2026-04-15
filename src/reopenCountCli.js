'use strict';

const { loadConfig } = require('./config');
const { getCached } = require('./cachedGithubWithRetry');
const { buildReopenCountSummary, formatReopenCountSummary } = require('./reopenCount');

async function fetchPRsWithTimeline(repo, token) {
  const [owner, name] = repo.split('/');
  const prs = await getCached(`/repos/${owner}/${name}/pulls?state=all&per_page=50`, token);
  // Attach timeline events for each PR (requires extra API calls)
  const withTimeline = await Promise.all(
    prs.map(async pr => {
      try {
        const events = await getCached(
          `/repos/${owner}/${name}/issues/${pr.number}/events?per_page=100`,
          token
        );
        return { ...pr, timeline_events: events };
      } catch {
        return { ...pr, timeline_events: [] };
      }
    })
  );
  return withTimeline;
}

async function runReopenCountMode(argv) {
  const config = loadConfig();
  const token = process.env.GITHUB_TOKEN;
  const minCount = parseInt(argv['--min'] || '1', 10);
  const repos = argv['--repo'] ? [argv['--repo']] : config.repos;

  if (!repos || repos.length === 0) {
    console.error('No repos configured. Add repos to your config or use --repo.');
    process.exit(1);
  }

  for (const repo of repos) {
    console.log(`\n=== ${repo} ===`);
    try {
      const prs = await fetchPRsWithTimeline(repo, token);
      const filtered = prs.filter(pr => {
        const count = (pr.timeline_events || []).filter(e => e.event === 'reopened').length;
        return count >= minCount;
      });
      if (filtered.length === 0) {
        console.log(`  No PRs reopened ${minCount}+ time(s).`);
        continue;
      }
      const summary = buildReopenCountSummary(prs);
      console.log(formatReopenCountSummary(summary));
    } catch (err) {
      console.error(`  Error fetching data for ${repo}: ${err.message}`);
    }
  }
}

module.exports = { runReopenCountMode };
