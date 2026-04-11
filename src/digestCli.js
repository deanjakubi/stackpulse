/**
 * digestCli.js — CLI entry point for printing a PR digest
 */

const { loadConfig } = require('./config');
const { getCached } = require('./cache');
const { buildDigest, formatDigest } = require('./digest');
const { exportPRs } = require('./export');

/**
 * Loads cached PRs for all configured repos.
 * @param {object} config
 * @returns {Record<string, Array>}
 */
async function loadCachedPRs(config) {
  const prsByRepo = {};
  for (const repo of config.repos) {
    const key = `prs_${repo.replace('/', '_')}`;
    const cached = await getCached(key);
    if (cached) {
      prsByRepo[repo] = cached;
    }
  }
  return prsByRepo;
}

/**
 * Runs the digest command.
 * @param {object} options — CLI flags: { export: 'csv'|'json'|null, output: string|null }
 */
async function runDigest(options = {}) {
  let config;
  try {
    config = await loadConfig();
  } catch (err) {
    console.error('Failed to load config:', err.message);
    process.exit(1);
  }

  const prsByRepo = await loadCachedPRs(config);

  if (Object.keys(prsByRepo).length === 0) {
    console.warn(
      'No cached PR data found. Run stackpulse without --digest first to populate the cache.'
    );
    return;
  }

  const digest = buildDigest(prsByRepo);
  const formatted = formatDigest(digest);
  console.log(formatted);

  if (options.export) {
    const allPRs = Object.values(prsByRepo).flat();
    const outPath = options.output || `stackpulse-digest.${options.export}`;
    await exportPRs(allPRs, options.export, outPath);
    console.log(`\nDigest exported to ${outPath}`);
  }
}

module.exports = { loadCachedPRs, runDigest };
