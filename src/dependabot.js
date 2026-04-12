// Dependabot PR detection and summarisation

const DEPENDABOT_LOGIN = 'dependabot[bot]';
const DEPENDABOT_TITLE_RE = /^(bump|update|chore\(deps\))/i;

/**
 * Returns true if the PR was opened by Dependabot.
 * @param {object} pr
 * @returns {boolean}
 */
function isDependabot(pr) {
  const login = pr.user?.login ?? '';
  return login === DEPENDABOT_LOGIN || DEPENDABOT_TITLE_RE.test(pr.title ?? '');
}

/**
 * Partition PRs into dependabot and non-dependabot groups.
 * @param {object[]} prs
 * @returns {{ bot: object[], human: object[] }}
 */
function partitionDependabot(prs) {
  const bot = [];
  const human = [];
  for (const pr of prs) {
    (isDependabot(pr) ? bot : human).push(pr);
  }
  return { bot, human };
}

/**
 * Build a summary object for dependabot PRs.
 * @param {object[]} prs  Full PR list (will be partitioned internally)
 * @returns {object}
 */
function buildDependabotSummary(prs) {
  const { bot, human } = partitionDependabot(prs);
  const open = bot.filter(p => p.state === 'open').length;
  const merged = bot.filter(p => p.merged_at).length;
  const closed = bot.filter(p => p.state === 'closed' && !p.merged_at).length;
  return { total: bot.length, open, merged, closed, humanTotal: human.length };
}

/**
 * Format a dependabot summary for console output.
 * @param {object} summary  Result of buildDependabotSummary
 * @returns {string}
 */
function formatDependabotSummary(summary) {
  const lines = [
    '── Dependabot PRs ──────────────────',
    `  Total bot PRs : ${summary.total}`,
    `  Open          : ${summary.open}`,
    `  Merged        : ${summary.merged}`,
    `  Closed        : ${summary.closed}`,
    `  Human PRs     : ${summary.humanTotal}`,
    '────────────────────────────────────',
  ];
  return lines.join('\n');
}

module.exports = {
  isDependabot,
  partitionDependabot,
  buildDependabotSummary,
  formatDependabotSummary,
};
