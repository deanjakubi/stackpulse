// aging.js — classify and summarise PRs by how long they've been open

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysSinceCreated(pr) {
  const created = new Date(pr.created_at);
  return Math.floor((Date.now() - created.getTime()) / MS_PER_DAY);
}

const AGING_BANDS = [
  { label: 'fresh',    max: 2,   color: '\x1b[32m' },
  { label: 'active',   max: 7,   color: '\x1b[36m' },
  { label: 'aging',    max: 30,  color: '\x1b[33m' },
  { label: 'stagnant', max: 90,  color: '\x1b[35m' },
  { label: 'ancient',  max: Infinity, color: '\x1b[31m' },
];

function classifyAging(days) {
  return AGING_BANDS.find(b => days <= b.max) || AGING_BANDS[AGING_BANDS.length - 1];
}

function annotateAgingPRs(prs) {
  return prs.map(pr => {
    const days = daysSinceCreated(pr);
    const band = classifyAging(days);
    return { ...pr, _agingDays: days, _agingBand: band.label };
  });
}

function groupByAgingBand(prs) {
  const groups = {};
  for (const band of AGING_BANDS) groups[band.label] = [];
  for (const pr of prs) {
    const days = pr._agingDays !== undefined ? pr._agingDays : daysSinceCreated(pr);
    const band = classifyAging(days);
    groups[band.label].push(pr);
  }
  return groups;
}

function buildAgingSummary(prs) {
  const groups = groupByAgingBand(annotateAgingPRs(prs));
  return AGING_BANDS.map(b => ({
    band: b.label,
    color: b.color,
    count: groups[b.label].length,
    prs: groups[b.label],
  }));
}

function formatAgingSummary(summary) {
  const reset = '\x1b[0m';
  const lines = ['\nPR Aging Breakdown:'];
  for (const row of summary) {
    if (row.count === 0) continue;
    lines.push(`  ${row.color}${row.band.padEnd(10)}${reset} ${row.count} PR${row.count !== 1 ? 's' : ''}`);
  }
  if (lines.length === 1) lines.push('  No open PRs found.');
  return lines.join('\n');
}

module.exports = { daysSinceCreated, classifyAging, annotateAgingPRs, groupByAgingBand, buildAgingSummary, formatAgingSummary };
