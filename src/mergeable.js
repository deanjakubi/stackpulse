// Classifies PRs by their mergeability status

const MERGEABLE_STATES = {
  CLEAN: 'clean',
  BLOCKED: 'blocked',
  BEHIND: 'behind',
  DIRTY: 'dirty',
  UNKNOWN: 'unknown',
  DRAFT: 'draft',
};

function getMergeableState(pr) {
  if (pr.draft) return MERGEABLE_STATES.DRAFT;
  if (!pr.mergeable_state) return MERGEABLE_STATES.UNKNOWN;
  return pr.mergeable_state.toLowerCase();
}

function classifyMergeable(pr) {
  const state = getMergeableState(pr);
  switch (state) {
    case MERGEABLE_STATES.CLEAN:
      return 'ready';
    case MERGEABLE_STATES.BLOCKED:
      return 'blocked';
    case MERGEABLE_STATES.BEHIND:
      return 'behind';
    case MERGEABLE_STATES.DIRTY:
      return 'conflict';
    case MERGEABLE_STATES.DRAFT:
      return 'draft';
    default:
      return 'unknown';
  }
}

function annotateMergeable(prs) {
  return prs.map((pr) => ({
    ...pr,
    _mergeability: classifyMergeable(pr),
  }));
}

function groupByMergeability(prs) {
  const groups = { ready: [], blocked: [], behind: [], conflict: [], draft: [], unknown: [] };
  for (const pr of prs) {
    const key = pr._mergeability || classifyMergeable(pr);
    if (groups[key]) groups[key].push(pr);
    else groups.unknown.push(pr);
  }
  return groups;
}

function buildMergeableSummary(prs) {
  const annotated = annotateMergeable(prs);
  const groups = groupByMergeability(annotated);
  return {
    total: prs.length,
    ready: groups.ready.length,
    blocked: groups.blocked.length,
    behind: groups.behind.length,
    conflict: groups.conflict.length,
    draft: groups.draft.length,
    unknown: groups.unknown.length,
    groups,
  };
}

function formatMergeableSummary(summary) {
  const lines = ['Mergeability Report', '==================='];
  lines.push(`Total PRs  : ${summary.total}`);
  lines.push(`Ready      : ${summary.ready}`);
  lines.push(`Blocked    : ${summary.blocked}`);
  lines.push(`Behind     : ${summary.behind}`);
  lines.push(`Conflict   : ${summary.conflict}`);
  lines.push(`Draft      : ${summary.draft}`);
  lines.push(`Unknown    : ${summary.unknown}`);
  return lines.join('\n');
}

module.exports = {
  getMergeableState,
  classifyMergeable,
  annotateMergeable,
  groupByMergeability,
  buildMergeableSummary,
  formatMergeableSummary,
};
