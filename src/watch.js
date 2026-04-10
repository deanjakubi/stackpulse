// watch.js — polls repos at a configurable interval and triggers notifications on changes

const { notifyOnChanges } = require('./notify');
const { normaliseAll } = require('./snapshot');

let previousSnapshots = {};
let watchTimer = null;

/**
 * Returns a promise that resolves after `ms` milliseconds.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Performs a single poll cycle across all repos.
 * @param {Function} fetchAllPRs - async fn(repos) => { [repo]: prs[] }
 * @param {string[]} repos
 * @param {object} options - { verbose }
 */
async function pollOnce(fetchAllPRs, repos, options = {}) {
  const results = await fetchAllPRs(repos);
  const changed = [];

  for (const [repo, prs] of Object.entries(results)) {
    const current = normaliseAll(prs);
    const previous = previousSnapshots[repo] || {};

    const notifications = notifyOnChanges(previous, current, repo);
    if (notifications.length > 0) {
      changed.push({ repo, notifications });
      if (options.verbose) {
        notifications.forEach((n) => console.log(`[watch] ${repo}: ${n}`));
      }
    }

    previousSnapshots[repo] = current;
  }

  return changed;
}

/**
 * Starts a watch loop, polling every `intervalMs` milliseconds.
 * @param {Function} fetchAllPRs
 * @param {string[]} repos
 * @param {object} options - { intervalMs, verbose,Cycle }
 * @returns {{ stop: Function }}
 */
function startWatch(fetchAllPRs, repos, options = {}) {
Ms || 60_000;
  let running = true;

  async function loop() {
    while (running) {
      try {
        const changed = await pollOnce(fetchAllPRs, repos, options);
.onCycle) options.onCycle(changed);
      } catch (err) {
        console.error('[watch] poll error:', err.message);
      }
      if (running) await delay(intervalMs);
    }
  }

  loop();

  return {
    stop() {
      running = false;
    },
  };
}

function resetSnapshots() {
  previousSnapshots = {};
}

module.exports = { pollOnce, startWatch, resetSnapshots, delay };
