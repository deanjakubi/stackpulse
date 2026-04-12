/**
 * CLI entry point for the team report command.
 * Usage: node src/teamCli.js [--config <path>]
 */

const { loadConfig } = require('./config');
const { getCached } = require('./cache');
const { buildAuthorTeamMap, groupByTeam, buildTeamSummary, formatTeamSummary } = require('./team');

async function runTeamMode(argv = process.argv.slice(2)) {
  const configPath = (() => {
    const idx = argv.indexOf('--config');
    return idx !== -1 ? argv[idx + 1] : undefined;
  })();

  const config = loadConfig(configPath);
  const teams = config.teams || {};

  if (!Object.keys(teams).length) {
    console.warn(
      'No teams defined in config. Add a "teams" section, e.g.:\n' +
      '  teams:\n    frontend: [alice, bob]\n    backend: [carol]'
    );
    process.exit(0);
  }

  const authorTeamMap = buildAuthorTeamMap(teams);
  const repos = config.repos || [];

  /** @type {Array} */
  const allPRs = [];

  for (const repo of repos) {
    const cacheKey = `prs_${repo.replace('/', '_')}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      allPRs.push(...cached);
    } else {
      console.warn(`No cached data for ${repo}. Run the main fetch first.`);
    }
  }

  if (!allPRs.length) {
    console.log('No PR data available. Run stackpulse fetch to populate the cache.');
    process.exit(0);
  }

  const grouped = groupByTeam(allPRs, authorTeamMap);
  const summary = buildTeamSummary(grouped);
  console.log(formatTeamSummary(summary));
}

if (require.main === module) {
  runTeamMode().catch(err => {
    console.error('Team report failed:', err.message);
    process.exit(1);
  });
}

module.exports = { runTeamMode };
