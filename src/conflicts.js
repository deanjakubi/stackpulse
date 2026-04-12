// Conflict detection: identify PRs that touch overlapping files

/**
 * Extract changed files list from a PR (populated by GitHub API)
 * @param {object} pr
 * @returns {string[]}
 */
function getChangedFiles(pr) {
  return Array.isArray(pr.changed_files_list) ? pr.changed_files_list : [];
}

/**
 * Build a map of filename -> list of PRs that touch that file
 * @param {object[]} prs
 * @returns {Map<string, object[]>}
 */
function buildFileIndex(prs) {
  const index = new Map();
  for (const pr of prs) {
    for (const file of getChangedFiles(pr)) {
      if (!index.has(file)) index.set(file, []);
      index.get(file).push(pr);
    }
  }
  return index;
}

/**
 * Find pairs of PRs that share at least one changed file.
 * Returns an array of conflict objects.
 * @param {object[]} prs
 * @returns {{ prA: object, prB: object, sharedFiles: string[] }[]}
 */
function detectConflicts(prs) {
  const index = buildFileIndex(prs);
  const seen = new Set();
  const conflicts = [];

  for (const [, affectedPRs] of index) {
    if (affectedPRs.length < 2) continue;
    for (let i = 0; i < affectedPRs.length; i++) {
      for (let j = i + 1; j < affectedPRs.length; j++) {
        const a = affectedPRs[i];
        const b = affectedPRs[j];
        const key = [a.number, b.number].sort((x, y) => x - y).join('-');
        if (seen.has(key)) continue;
        seen.add(key);
        const filesA = new Set(getChangedFiles(a));
        const sharedFiles = getChangedFiles(b).filter(f => filesA.has(f));
        if (sharedFiles.length > 0) {
          conflicts.push({ prA: a, prB: b, sharedFiles });
        }
      }
    }
  }
  return conflicts;
}

/**
 * Annotate each PR with a `conflicts` array of PR numbers it conflicts with.
 * @param {object[]} prs
 * @returns {object[]}
 */
function annotateConflicts(prs) {
  const conflicts = detectConflicts(prs);
  const map = new Map(prs.map(pr => [pr.number, { ...pr, conflicts: [] }]));
  for (const { prA, prB } of conflicts) {
    map.get(prA.number).conflicts.push(prB.number);
    map.get(prB.number).conflicts.push(prA.number);
  }
  return Array.from(map.values());
}

module.exports = { getChangedFiles, buildFileIndex, detectConflicts, annotateConflicts };
