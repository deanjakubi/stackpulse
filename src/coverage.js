// coverage.js — summarise review coverage across PRs
// A PR is "covered" if it has at least one approved review.

function getReviewStates(pr) {
  return (pr.reviews || []).map((r) => r.state);
}

function isCovered(pr) {
  return getReviewStates(pr).includes('APPROVED');
}

function classifyCoverage(pr) {
  const states = getReviewStates(pr);
  if (states.includes('APPROVED')) return 'approved';
  if (states.includes('CHANGES_REQUESTED')) return 'changes_requested';
  if (states.length > 0) return 'reviewed';
  return 'no_review';
}

function annotateCoverage(prs) {
  return prs.map((pr) => ({
    ...pr,
    coverageStatus: classifyCoverage(pr),
    isCovered: isCovered(pr),
  }));
}

function buildCoverageSummary(prs) {
  const annotated = annotateCoverage(prs);
  const total = annotated.length;
  const counts = { approved: 0, changes_requested: 0, reviewed: 0, no_review: 0 };

  for (const pr of annotated) {
    counts[pr.coverageStatus] = (counts[pr.coverageStatus] || 0) + 1;
  }

  const coveredCount = counts.approved;
  const coveragePct = total > 0 ? Math.round((coveredCount / total) * 100) : 0;

  return { total, counts, coveredCount, coveragePct };
}

function formatCoverageSummary(summary) {
  const { total, counts, coveredCount, coveragePct } = summary;
  const lines = [
    `Review Coverage: ${coveredCount}/${total} PRs approved (${coveragePct}%)`,
    `  Approved:          ${counts.approved}`,
    `  Changes requested: ${counts.changes_requested}`,
    `  Reviewed (other):  ${counts.reviewed}`,
    `  No review:         ${counts.no_review}`,
  ];
  return lines.join('\n');
}

module.exports = {
  isCovered,
  classifyCoverage,
  annotateCoverage,
  buildCoverageSummary,
  formatCoverageSummary,
};
