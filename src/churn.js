// churn.js — identifies PRs with high file/line change churn

const HIGH_CHURN_FILES = 20;
const VERY_HIGH_CHURN_FILES = 50;
const HIGH_CHURN_LINES = 500;
const VERY_HIGH_CHURN_LINES = 2000;

function getChurnScore(pr) {
  const files = pr.changed_files || 0;
  const additions = pr.additions || 0;
  const deletions = pr.deletions || 0;
  const lines = additions + deletions;
  return { files, additions, deletions, lines };
}

function classifyChurn(pr) {
  const { files, lines } = getChurnScore(pr);
  if (files >= VERY_HIGH_CHURN_FILES || lines >= VERY_HIGH_CHURN_LINES) return 'very-high';
  if (files >= HIGH_CHURN_FILES || lines >= HIGH_CHURN_LINES) return 'high';
  if (files >= 5 || lines >= 100) return 'medium';
  return 'low';
}

function annotateChurn(prs) {
  return prs.map(pr => ({
    ...pr,
    _churn: classifyChurn(pr),
    _churnScore: getChurnScore(pr),
  }));
}

function groupByChurn(prs) {
  const groups = { 'very-high': [], high: [], medium: [], low: [] };
  for (const pr of prs) {
    const level = pr._churn || classifyChurn(pr);
    groups[level].push(pr);
  }
  return groups;
}

function buildChurnSummary(prs) {
  const annotated = annotateChurn(prs);
  const groups = groupByChurn(annotated);
  const total = prs.length;
  const topChurners = annotated
    .slice()
    .sort((a, b) => b._churnScore.lines - a._churnScore.lines)
    .slice(0, 5);
  return { groups, total, topChurners };
}

function formatChurnSummary(summary) {
  const { groups, total, topChurners } = summary;
  const lines = ['=== Churn Summary ===', `Total PRs: ${total}`, ''];
  for (const level of ['very-high', 'high', 'medium', 'low']) {
    lines.push(`  ${level.padEnd(10)}: ${groups[level].length}`);
  }
  if (topChurners.length) {
    lines.push('', 'Top churners (by lines changed):');
    for (const pr of topChurners) {
      lines.push(`  #${pr.number} ${pr.title ? pr.title.slice(0, 50) : ''} — ${pr._churnScore.lines} lines, ${pr._churnScore.files} files`);
    }
  }
  return lines.join('\n');
}

module.exports = { getChurnScore, classifyChurn, annotateChurn, groupByChurn, buildChurnSummary, formatChurnSummary };
