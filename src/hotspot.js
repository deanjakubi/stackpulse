// Identifies repos and authors with the highest PR concentration

function countByRepo(prs) {
  const counts = {};
  for (const pr of prs) {
    const repo = pr.repo || 'unknown';
    counts[repo] = (counts[repo] || 0) + 1;
  }
  return counts;
}

function countByAuthor(prs) {
  const counts = {};
  for (const pr of prs) {
    const author = pr.user?.login || 'unknown';
    counts[author] = (counts[author] || 0) + 1;
  }
  return counts;
}

function topN(countMap, n = 5) {
  return Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

function buildHotspotSummary(prs, n = 5) {
  const byRepo = countByRepo(prs);
  const byAuthor = countByAuthor(prs);
  return {
    totalPRs: prs.length,
    topRepos: topN(byRepo, n),
    topAuthors: topN(byAuthor, n),
  };
}

function formatHotspotSummary(summary) {
  const lines = [];
  lines.push(`Total PRs: ${summary.totalPRs}`);
  lines.push('');
  lines.push('Top Repos:');
  for (const { name, count } of summary.topRepos) {
    lines.push(`  ${name.padEnd(40)} ${count}`);
  }
  lines.push('');
  lines.push('Top Authors:');
  for (const { name, count } of summary.topAuthors) {
    lines.push(`  ${name.padEnd(30)} ${count}`);
  }
  return lines.join('\n');
}

module.exports = { countByRepo, countByAuthor, topN, buildHotspotSummary, formatHotspotSummary };
