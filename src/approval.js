// approval.js — summarise PR review approval status

'use strict';

function getApprovalState(pr) {
  const reviews = pr.reviews || [];
  const approvals = reviews.filter(r => r.state === 'APPROVED');
  const changesRequested = reviews.filter(r => r.state === 'CHANGES_REQUESTED');
  if (changesRequested.length > 0) return 'changes_requested';
  if (approvals.length >= 2) return 'approved';
  if (approvals.length === 1) return 'needs_one_more';
  return 'no_reviews';
}

function countByApprovalState(prs) {
  const counts = { approved: 0, needs_one_more: 0, changes_requested: 0, no_reviews: 0 };
  for (const pr of prs) {
    const state = getApprovalState(pr);
    counts[state] = (counts[state] || 0) + 1;
  }
  return counts;
}

function annotateApproval(prs) {
  return prs.map(pr => ({ ...pr, approvalState: getApprovalState(pr) }));
}

function buildApprovalSummary(prs) {
  const counts = countByApprovalState(prs);
  return {
    total: prs.length,
    approved: counts.approved,
    needsOneMore: counts.needs_one_more,
    changesRequested: counts.changes_requested,
    noReviews: counts.no_reviews,
  };
}

function formatApprovalSummary(summary) {
  const lines = [
    'Approval Summary',
    '────────────────',
    `  Approved (2+):        ${summary.approved}`,
    `  Needs one more:       ${summary.needsOneMore}`,
    `  Changes requested:    ${summary.changesRequested}`,
    `  No reviews:           ${summary.noReviews}`,
    `  Total:                ${summary.total}`,
  ];
  return lines.join('\n');
}

module.exports = {
  getApprovalState,
  countByApprovalState,
  annotateApproval,
  buildApprovalSummary,
  formatApprovalSummary,
};
