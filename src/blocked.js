// Detect PRs that are blocked (e.g. by a blocking label, failed checks, or requested changes)

const BLOCKING_LABELS = ['blocked', 'do-not-merge', 'wip', 'on-hold'];

function isBlockedByLabel(pr) {
  const labels = (pr.labels || []).map(l => (l.name || '').toLowerCase());
  return BLOCKING_LABELS.some(bl => labels.includes(bl));
}

function isBlockedByReview(pr) {
  const reviews = pr.reviews || [];
  return reviews.some(r => r.state === 'CHANGES_REQUESTED');
}

function isBlockedByChecks(pr) {
  return pr.checkState === 'failure' || pr.checkState === 'error';
}

function classifyBlockReason(pr) {
  if (isBlockedByLabel(pr)) return 'label';
  if (isBlockedByReview(pr)) return 'changes_requested';
  if (isBlockedByChecks(pr)) return 'failing_checks';
  return null;
}

function isBlocked(pr) {
  return classifyBlockReason(pr) !== null;
}

function annotateBlocked(prs) {
  return prs.map(pr => {
    const reason = classifyBlockReason(pr);
    return { ...pr, blocked: reason !== null, blockReason: reason };
  });
}

function partitionBlocked(prs) {
  const blocked = prs.filter(pr => isBlocked(pr));
  const unblocked = prs.filter(pr => !isBlocked(pr));
  return { blocked, unblocked };
}

function buildBlockedSummary(prs) {
  const annotated = annotateBlocked(prs);
  const { blocked, unblocked } = partitionBlocked(annotated);
  const byReason = { label: 0, changes_requested: 0, failing_checks: 0 };
  blocked.forEach(pr => {
    if (pr.blockReason && byReason[pr.blockReason] !== undefined) {
      byReason[pr.blockReason]++;
    }
  });
  return { total: prs.length, blockedCount: blocked.length, unblockedCount: unblocked.length, byReason, prs: annotated };
}

function formatBlockedSummary(summary) {
  const lines = [];
  lines.push(`Blocked PRs: ${summary.blockedCount} / ${summary.total}`);
  if (summary.blockedCount > 0) {
    lines.push(`  By label:             ${summary.byReason.label}`);
    lines.push(`  Changes requested:    ${summary.byReason.changes_requested}`);
    lines.push(`  Failing checks:       ${summary.byReason.failing_checks}`);
  }
  return lines.join('\n');
}

module.exports = { isBlockedByLabel, isBlockedByReview, isBlockedByChecks, classifyBlockReason, isBlocked, annotateBlocked, partitionBlocked, buildBlockedSummary, formatBlockedSummary };
