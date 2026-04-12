// reviewersCli.js — CLI entry point for reviewer report

const { loadConfig } = require('./config');
const { getCached } = require('./cache');
const { fetchAllPRs } = require('./prs');
const { applyFilters } = require('./filter');
const { countByReviewer, sortedReviewers, formatReviewerSummary } = require('./reviewers');

async function runReviewerMode(argv) {
  const config = loadConfig(argv);
  const allPRs = [];

  for (const repo of config.repos) {
    try {
      const prs = await fetchAllPRs(repo, config);
      allPRs.push(...prs);
    } catch (err) {
      console.error(`[reviewers] Failed to fetch ${repo}: ${err.message}`);
    }
  }

  const filtered = applyFilters(allPRs, config);
  const counts = countByReviewer(filtered);
  const sorted = sortedReviewers(counts);

  console.log('');
  console.log(formatReviewerSummary(sorted));
  console.log('');
  console.log(`Total PRs scanned : ${filtered.length}`);
  console.log(`Unique reviewers  : ${sorted.length}`);
}

module.exports = { runReviewerMode };
