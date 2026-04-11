'use strict';

/**
 * milestoneCli.js — CLI entry-point for the milestone report command.
 */

const { loadConfig } = require('./config');
const { getCached, setCached } = require('./cache');
const { githubRequest } = require('./github');
const { buildMilestoneReport, formatMilestoneReport } = require('./milestone');
const { applyFilters } = require('./filter');

/**
 * Fetch open PRs for a single repo (with simple cache).
 * @param {string} repo  owner/name
 * @param {string} token
 * @returns {Promise<object[]>}
 */
async function fetchPRs(repo, token) {
  const cacheKey = `milestone:${repo}`;
  const cached = await getCached(cacheKey, 120);
  if (cached) return cached;
  const data = await githubRequest(`/repos/${repo}/pulls?state=all&per_page=100`, token);
  await setCached(cacheKey, data);
  return data;
}

/**
 * Print the milestone report for all configured repos.
 * @param {object} [cliFlags]
 */
async function runMilestoneMode(cliFlags = {}) {
  const config = await loadConfig();
  const token = config.token;
  const repos = config.repos || [];

  if (repos.length === 0) {
    console.log('No repos configured.');
    return;
  }

  let allPRs = [];
  for (const repo of repos) {
    try {
      const prs = await fetchPRs(repo, token);
      const annotated = prs.map(pr => ({ ...pr, _repo: repo }));
      allPRs = allPRs.concat(annotated);
    } catch (err) {
      console.error(`Error fetching ${repo}: ${err.message}`);
    }
  }

  const filtered = applyFilters(allPRs, cliFlags);
  const report = buildMilestoneReport(filtered);
  console.log(formatMilestoneReport(report));
}

module.exports = { runMilestoneMode, fetchPRs };
