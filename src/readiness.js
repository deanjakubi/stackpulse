/**
 * readiness.js — Determine merge-readiness of PRs based on approvals, checks, and conflicts.
 */

const { getApprovalState } = require('./approval');
const { getCheckState } = require('./checks');

const READINESS_STATES = {
  READY: 'ready',
  BLOCKED: 'blocked',
  PENDING: 'pending',
  DRAFT: 'draft',
};

function classifyReadiness(pr) {
  if (pr.draft) return READINESS_STATES.DRAFT;

  const approval = getApprovalState(pr);
  const checkState = getCheckState(pr);
  const hasConflict = pr.mergeable_state === 'dirty';

  if (hasConflict) return READINESS_STATES.BLOCKED;
  if (approval === 'changes_requested') return READINESS_STATES.BLOCKED;
  if (checkState === 'failure') return READINESS_STATES.BLOCKED;

  if (approval === 'approved' && checkState === 'success') return READINESS_STATES.READY;

  return READINESS_STATES.PENDING;
}

function annotateReadiness(prs) {
  return prs.map(pr => ({ ...pr, readiness: classifyReadiness(pr) }));
}

function groupByReadiness(prs) {
  const groups = { ready: [], blocked: [], pending: [], draft: [] };
  for (const pr of prs) {
    const state = pr.readiness || classifyReadiness(pr);
    groups[state] = groups[state] || [];
    groups[state].push(pr);
  }
  return groups;
}

function buildReadinessSummary(prs) {
  const groups = groupByReadiness(prs);
  return {
    total: prs.length,
    ready: groups.ready.length,
    blocked: groups.blocked.length,
    pending: groups.pending.length,
    draft: groups.draft.length,
  };
}

function formatReadinessSummary(summary) {
  const lines = [
    `Merge Readiness Summary (${summary.total} PRs)`,
    `  Ready    : ${summary.ready}`,
    `  Pending  : ${summary.pending}`,
    `  Blocked  : ${summary.blocked}`,
    `  Draft    : ${summary.draft}`,
  ];
  return lines.join('\n');
}

module.exports = {
  READINESS_STATES,
  classifyReadiness,
  annotateReadiness,
  groupByReadiness,
  buildReadinessSummary,
  formatReadinessSummary,
};
