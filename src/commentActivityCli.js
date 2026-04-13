'use strict';

const { loadConfig } = require('./config');
const { getCached } = require('./cachedGithub');
const { fetchPRs } = require('./prs');
const { applyFilters } = require('./filter');
const { buildCommentSummary, formatCommentSummary } = require('./commentActivity');

async function runCommentActivityMode(argv = {}) {
  const config = loadConfig();
  const allPRs = [];

  for (const repo of config.repos) {
    try {
      const prs = await fetchPRs(repo, getCached);
      allPRs.push(...prs);
    } catch (err) {
      console.error(`[comment-activity] Failed to fetch ${repo}: ${err.message}`);
    }
  }

  const filtered = applyFilters(allPRs, {
    label: argv.label,
    author: argv.author,
    includeDrafts: argv.drafts,
  });

  if (filtered.length === 0) {
    console.log('No PRs found.');
    return;
  }

  const summary = buildCommentSummary(filtered);

  if (argv.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(formatCommentSummary(summary));

  if (argv.verbose && summary.mostActive) {
    const pr = summary.mostActive;
    console.log(`\nMost Active PR Details:`);
    console.log(`  #${pr.number} ${pr.title}`);
    console.log(`  Comments      : ${pr._commentCount}`);
    console.log(`  Volume class  : ${pr._commentVolume}`);
    console.log(`  Last updated  : ${pr.updated_at}`);
  }
}

module.exports = { runCommentActivityMode };
