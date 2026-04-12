const { getChangedFiles, buildFileIndex, detectConflicts, annotateConflicts } = require('./conflicts');

function makePR(number, files = []) {
  return { number, title: `PR #${number}`, changed_files_list: files };
}

describe('getChangedFiles', () => {
  it('returns the changed_files_list array', () => {
    const pr = makePR(1, ['src/a.js', 'src/b.js']);
    expect(getChangedFiles(pr)).toEqual(['src/a.js', 'src/b.js']);
  });

  it('returns empty array when field is missing', () => {
    expect(getChangedFiles({ number: 1 })).toEqual([]);
  });
});

describe('buildFileIndex', () => {
  it('maps each file to the PRs that touch it', () => {
    const prs = [makePR(1, ['a.js', 'b.js']), makePR(2, ['b.js', 'c.js'])];
    const index = buildFileIndex(prs);
    expect(index.get('a.js')).toHaveLength(1);
    expect(index.get('b.js')).toHaveLength(2);
    expect(index.get('c.js')).toHaveLength(1);
  });

  it('returns empty map for PRs with no files', () => {
    const index = buildFileIndex([makePR(1), makePR(2)]);
    expect(index.size).toBe(0);
  });
});

describe('detectConflicts', () => {
  it('detects overlapping PRs', () => {
    const prs = [makePR(1, ['a.js', 'b.js']), makePR(2, ['b.js', 'c.js'])];
    const result = detectConflicts(prs);
    expect(result).toHaveLength(1);
    expect(result[0].sharedFiles).toEqual(['b.js']);
  });

  it('returns no conflicts when files are disjoint', () => {
    const prs = [makePR(1, ['a.js']), makePR(2, ['b.js'])];
    expect(detectConflicts(prs)).toHaveLength(0);
  });

  it('does not double-count the same pair', () => {
    const prs = [makePR(1, ['x.js', 'y.js']), makePR(2, ['x.js', 'y.js'])];
    const result = detectConflicts(prs);
    expect(result).toHaveLength(1);
    expect(result[0].sharedFiles).toHaveLength(2);
  });

  it('handles three-way overlaps correctly', () => {
    const prs = [makePR(1, ['a.js']), makePR(2, ['a.js']), makePR(3, ['a.js'])];
    expect(detectConflicts(prs)).toHaveLength(3);
  });
});

describe('annotateConflicts', () => {
  it('adds conflicts array to each PR', () => {
    const prs = [makePR(1, ['a.js']), makePR(2, ['a.js']), makePR(3, ['b.js'])];
    const result = annotateConflicts(prs);
    const pr1 = result.find(p => p.number === 1);
    const pr2 = result.find(p => p.number === 2);
    const pr3 = result.find(p => p.number === 3);
    expect(pr1.conflicts).toContain(2);
    expect(pr2.conflicts).toContain(1);
    expect(pr3.conflicts).toHaveLength(0);
  });

  it('does not mutate original PRs', () => {
    const prs = [makePR(1, ['a.js']), makePR(2, ['a.js'])];
    annotateConflicts(prs);
    expect(prs[0].conflicts).toBeUndefined();
  });
});
