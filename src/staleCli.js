/**
 * CLI handler for the `--stale` flag.
 * Prints a report of stale PRs grouped by repo.
 */

const { filterStalePRs } = require('./stale');
const { colorize } = require('./display');
const { formatAge } = require('./display');

/**
 * Prints a stale PR report to stdout.
 * @param {object[]} allPRs  — flat array of PR objects, each with a `repo` field
 * @param {number}   thresholdDays
 */
function printStaleReport(allPRs, thresholdDays = 7) {
  const stalePRs = filterStalePRs(allPRs, thresholdDays);

  if (stalePRs.length === 0) {
    console.log(colorize('green', `No stale PRs found (threshold: ${thresholdDays}d).`));
    return;
  }

  // Group by repo
  const byRepo = {};
  for (const pr of stalePRs) {
    const key = pr.repo || 'unknown';
    if (!byRepo[key]) byRepo[key] = [];
    byRepo[key].push(pr);
  }

  const repoCount = Object.keys(byRepo).length;
  console.log(
    colorize('yellow', `\n⚠  ${stalePRs.length} stale PR(s) across ${repoCount} repo(s) (>${thresholdDays}d inactive)\n`)
  );

  for (const [repo, prs] of Object.entries(byRepo)) {
    console.log(colorize('cyan', `  ${repo}`));
    for (const pr of prs) {
      const age = formatAge(pr.updated_at || pr.created_at);
      const draft = pr.draft ? colorize('gray', ' [draft]') : '';
      console.log(
        `    #${pr.number}  ${pr.title}${draft}  — last activity ${age}`
      );
    }
    console.log('');
  }
}

/**
 * Entry point called from run.js when --stale flag is present.
 * @param {object[]} allPRs
 * @param {object}   opts
 * @param {number}   [opts.staleDays=7]
 */
function runStaleMode(allPRs, opts = {}) {
  const threshold = typeof opts.staleDays === 'number' ? opts.staleDays : 7;
  printStaleReport(allPRs, threshold);
}

module.exports = { printStaleReport, runStaleMode };
