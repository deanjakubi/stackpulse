"use strict";

const { loadConfig } = require("./config");
const { fetchOpenPRs } = require("./prs");
const { renderSummary } = require("./display");

async function fetchAllRepos(repos, token) {
  const tasks = repos.map(async (repo) => {
    try {
      const prs = await fetchOpenPRs(repo, token);
      return { repo, prs, error: null };
    } catch (err) {
      return { repo, prs: [], error: err.message };
    }
  });
  return Promise.all(tasks);
}

async function run(configPath) {
  let config;
  try {
    config = loadConfig(configPath);
  } catch (err) {
    console.error(`Failed to load config: ${err.message}`);
    process.exit(1);
  }

  const { token, repos } = config;

  if (!repos || repos.length === 0) {
    console.error("No repositories configured. Add repos to your config file.");
    process.exit(1);
  }

  if (!token) {
    console.error("No GitHub token found. Set GITHUB_TOKEN or add it to config.");
    process.exit(1);
  }

  console.log(`Fetching PRs for ${repos.length} repo(s)...`);

  const results = await fetchAllRepos(repos, token);
  const output = renderSummary(results);
  console.log(output);
}

module.exports = { run, fetchAllRepos };

if (require.main === module) {
  const configPath = process.argv[2] || undefined;
  run(configPath).catch((err) => {
    console.error("Unexpected error:", err.message);
    process.exit(1);
  });
}
