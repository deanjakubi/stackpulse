'use strict';

const {
  classifyMergeable,
  annotateMergeable,
  groupByMergeability,
  buildMergeableSummary,
  formatMergeableSummary,
} = require('./mergeable');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    draft: false,
    mergeable_state: 'clean',
    ...overrides,
  };
}

describe('classifyMergeable', () => {
  it('returns ready for clean state', () => {
    expect(classifyMergeable(makePR({ mergeable_state: 'clean' }))).toBe('ready');
  });

  it('returns blocked for blocked state', () => {
    expect(classifyMergeable(makePR({ mergeable_state: 'blocked' }))).toBe('blocked');
  });

  it('returns behind for behind state', () => {
    expect(classifyMergeable(makePR({ mergeable_state: 'behind' }))).toBe('behind');
  });

  it('returns conflict for dirty state', () => {
    expect(classifyMergeable(makePR({ mergeable_state: 'dirty' }))).toBe('conflict');
  });

  it('returns draft for draft PRs regardless of mergeable_state', () => {
    expect(classifyMergeable(makePR({ draft: true, mergeable_state: 'clean' }))).toBe('draft');
  });

  it('returns unknown for null mergeable_state', () => {
    expect(classifyMergeable(makePR({ mergeable_state: null }))).toBe('unknown');
  });
});

describe('annotateMergeable', () => {
  it('adds _mergeability field to each PR', () => {
    const prs = [makePR({ mergeable_state: 'clean' }), makePR({ mergeable_state: 'dirty' })];
    const result = annotateMergeable(prs);
    expect(result[0]._mergeability).toBe('ready');
    expect(result[1]._mergeability).toBe('conflict');
  });

  it('does not mutate original PRs', () => {
    const pr = makePR();
    annotateMergeable([pr]);
    expect(pr._mergeability).toBeUndefined();
  });
});

describe('groupByMergeability', () => {
  it('groups PRs into correct buckets', () => {
    const prs = annotateMergeable([
      makePR({ mergeable_state: 'clean' }),
      makePR({ mergeable_state: 'blocked' }),
      makePR({ draft: true }),
    ]);
    const groups = groupByMergeability(prs);
    expect(groups.ready).toHaveLength(1);
    expect(groups.blocked).toHaveLength(1);
    expect(groups.draft).toHaveLength(1);
  });
});

describe('buildMergeableSummary', () => {
  it('returns correct counts', () => {
    const prs = [
      makePR({ mergeable_state: 'clean' }),
      makePR({ mergeable_state: 'dirty' }),
      makePR({ draft: true }),
    ];
    const summary = buildMergeableSummary(prs);
    expect(summary.total).toBe(3);
    expect(summary.ready).toBe(1);
    expect(summary.conflict).toBe(1);
    expect(summary.draft).toBe(1);
  });
});

describe('formatMergeableSummary', () => {
  it('includes all categories in output', () => {
    const summary = buildMergeableSummary([makePR()]);
    const output = formatMergeableSummary(summary);
    expect(output).toContain('Ready');
    expect(output).toContain('Blocked');
    expect(output).toContain('Conflict');
    expect(output).toContain('Draft');
  });
});
