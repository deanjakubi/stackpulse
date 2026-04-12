// Categorises PRs by diff size (lines changed) and summarises them

const SIZE_BUCKETS = [
  { label: 'XS', max: 10 },
  { label: 'S', max: 50 },
  { label: 'M', max: 200 },
  { label: 'L', max: 500 },
  { label: 'XL', max: Infinity },
];

function classifySize(pr) {
  const additions = pr.additions || 0;
  const deletions = pr.deletions || 0;
  const total = additions + deletions;
  const bucket = SIZE_BUCKETS.find((b) => total <= b.max);
  return bucket ? bucket.label : 'XL';
}

function annotateSizePRs(prs) {
  return prs.map((pr) => ({ ...pr, sizeLabel: classifySize(pr) }));
}

function groupBySize(prs) {
  const groups = {};
  for (const bucket of SIZE_BUCKETS) {
    groups[bucket.label] = [];
  }
  for (const pr of prs) {
    const label = pr.sizeLabel || classifySize(pr);
    if (!groups[label]) groups[label] = [];
    groups[label].push(pr);
  }
  return groups;
}

function buildSizeSummary(prs) {
  const annotated = annotateSizePRs(prs);
  const groups = groupBySize(annotated);
  return SIZE_BUCKETS.map(({ label }) => ({
    size: label,
    count: groups[label].length,
    prs: groups[label],
  }));
}

function formatSizeSummary(summary) {
  const lines = ['PR Size Distribution:', ''];
  for (const row of summary) {
    if (row.count === 0) continue;
    lines.push(`  ${row.size.padEnd(4)} ${row.count} PR${row.count !== 1 ? 's' : ''}`);
  }
  if (lines.length === 2) lines.push('  No PRs found.');
  return lines.join('\n');
}

module.exports = { classifySize, annotateSizePRs, groupBySize, buildSizeSummary, formatSizeSummary };
