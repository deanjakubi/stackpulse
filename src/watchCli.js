// watchCli.js — wires the watch loop into the CLI, handling startup and teardown

const { startWatch } = require('./watch');
const { printRepoHeader, printRepoPRs } = require('./output');

/**
 * Formats a timestamp for watch log lines.
 */
function timestamp() {
  return new Date().toLocaleTimeString();
}

/**
 * Prints a summary of changes detected in a cycle.
 * @param {Array<{ repo: string, notifications: string[] }>} changed
 */
function printCycleSummary(changed) {
  if (changed.length === 0) {
    process.stdout.write(`\r[${timestamp()}] No changes detected.   `);
    return;
  }

  console.log(`\n[${timestamp()}] Changes detected:`);
  for (const { repo, notifications } of changed) {
    printRepoHeader(repo);
    notifications.forEach((n) => console.log(`  • ${n}`));
  }
}

/**
 * Starts the interactive watch mode from the CLI.
 * @param {Function} fetchAllPRs - async fn(repos) => { [repo]: prs[] }
 * @param {string[]} repos
 * @param {object} options - { intervalMs, verbose }
 */
function runWatchMode(fetchAllPRs, repos, options = {}) {
  const intervalMs = options.intervalMs || 60_000;
  const intervalSec = Math.round(intervalMs / 1000);

  console.log(`[stackpulse] Watch mode started. Polling every ${intervalSec}s. Press Ctrl+C to exit.\n`);

  const watcher = startWatch(fetchAllPRs, repos, {
    intervalMs,
    verbose: options.verbose || false,
    onCycle: printCycleSummary,
  });

  function shutdown() {
    console.log('\n[stackpulse] Watch mode stopped.');
    watcher.stop();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return watcher;
}

module.exports = { runWatchMode, printCycleSummary, timestamp };
