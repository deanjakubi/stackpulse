/**
 * Team report: group PRs by team membership and summarise activity.
 */

/**
 * Build a map of author -> team from a teams config object.
 * @param {Object} teamsConfig  e.g. { frontend: ['alice', 'bob'], backend: ['carol'] }
 * @returns {Map<string, string>}
 */
function buildAuthorTeamMap(teamsConfig) {
  const map = new Map();
  for (const [team, members] of Object.entries(teamsConfig)) {
    for (const member of members) {
      map.set(member.toLowerCase(), team);
    }
  }
  return map;
}

/**
 * Resolve the team for a PR author.
 * @param {string} author
 * @param {Map<string, string>} authorTeamMap
 * @returns {string}
 */
function resolveTeam(author, authorTeamMap) {
  return authorTeamMap.get((author || '').toLowerCase()) || 'unknown';
}

/**
 * Group an array of PRs by team.
 * @param {Array} prs
 * @param {Map<string, string>} authorTeamMap
 * @returns {Object}  { teamName: [pr, ...] }
 */
function groupByTeam(prs, authorTeamMap) {
  const groups = {};
  for (const pr of prs) {
    const team = resolveTeam(pr.user?.login, authorTeamMap);
    if (!groups[team]) groups[team] = [];
    groups[team].push(pr);
  }
  return groups;
}

/**
 * Build a summary object per team.
 * @param {Object} grouped  output of groupByTeam
 * @returns {Array<{ team, total, open, draft }>}
 */
function buildTeamSummary(grouped) {
  return Object.entries(grouped)
    .map(([team, prs]) => ({
      team,
      total: prs.length,
      open: prs.filter(p => p.state === 'open' && !p.draft).length,
      draft: prs.filter(p => p.draft).length,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Format the team summary as a human-readable string.
 * @param {Array} summary  output of buildTeamSummary
 * @returns {string}
 */
function formatTeamSummary(summary) {
  if (!summary.length) return 'No team data available.';
  const lines = ['Team PR Summary', '---------------'];
  for (const row of summary) {
    lines.push(
      `${row.team.padEnd(20)} total: ${row.total}  open: ${row.open}  draft: ${row.draft}`
    );
  }
  return lines.join('\n');
}

module.exports = { buildAuthorTeamMap, resolveTeam, groupByTeam, buildTeamSummary, formatTeamSummary };
