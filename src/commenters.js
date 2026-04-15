// commenters.js — summarise unique commenters across PRs

function collectCommenters(pr) {
  const comments = pr.comments || [];
  const reviewComments = pr.review_comments || [];
  const all = [...comments, ...reviewComments];
  const seen = new Set();
  for (const c of all) {
    const login = c.user && c.user.login;
    if (login) seen.add(login);
  }
  return Array.from(seen);
}

function countByCommenter(prs) {
  const counts = {};
  for (const pr of prs) {
    const commenters = collectCommenters(pr);
    for (const login of commenters) {
      counts[login] = (counts[login] || 0) + 1;
    }
  }
  return counts;
}

function sortedCommenters(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([login, count]) => ({ login, count }));
}

function buildCommenterSummary(prs) {
  const counts = countByCommenter(prs);
  const sorted = sortedCommenters(counts);
  const total = sorted.reduce((s, r) => s + r.count, 0);
  const unique = sorted.length;
  return { sorted, total, unique };
}

function formatCommenterSummary(summary) {
  const lines = ['Top commenters:'];
  if (summary.sorted.length === 0) {
    lines.push('  No commenters found.');
    return lines.join('\n');
  }
  for (const { login, count } of summary.sorted.slice(0, 10)) {
    lines.push(`  ${login.padEnd(24)} ${count} PR(s)`);
  }
  lines.push('');
  lines.push(`Total comments across PRs: ${summary.total}  |  Unique commenters: ${summary.unique}`);
  return lines.join('\n');
}

module.exports = {
  collectCommenters,
  countByCommenter,
  sortedCommenters,
  buildCommenterSummary,
  formatCommenterSummary,
};
