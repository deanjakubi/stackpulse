#!/usr/bin/env node
// CLI entry point for the conflict detection report

const { loadConfig } = require('./config');
const { getCached } = require('./cachedGithub');
const { detectConflicts, annotateConflicts } = require('./conflicts');
const { colorize } = require('./display');

/**
 * Print a human-readable conflict report to stdout.
 * @param {object[]} prs  - PRs already annotated with changed_files_list
 */
function printConflictReport(prs) {
  const conflicts = detectConflicts(prs);

  if (conflicts.length === 0) {
    console.log(colorize('green', '✔ No conflicting PRs detected.'));
    return;
  }

  console.log(colorize('yellow', `⚠ ${conflicts.length} conflict(s) detected:\n`));

  for (const { prA, prB, sharedFiles } of conflicts) {
    const a = colorize('cyan', `#${prA.number} ${prA.title}`);
    const b = colorize('cyan', `#${prB.number} ${prB.title}`);
    console.log(`  ${a}  ↔  ${b}`);
    console.log(colorize('gray', `    Shared files (${sharedFiles.length}): ${sharedFiles.slice(0, 5).join(', ')}${sharedFiles.length > 5 ? ' …' : ''}`));
    console.log();
  }
}

async function runConflictMode() {
  const config = loadConfig();
  const allPRs = [];

  for (const repo of config.repos) {
    const prs = await getCached(repo, config);
    allPRs.push(...prs);
  }

  printConflictReport(allPRs);
}

module.exports = { printConflictReport, runConflictMode };

if (require.main === module) {
  runConflictMode().catch(err => {
    console.error(colorize('red', `Error: ${err.message}`));
    process.exit(1);
  });
}
