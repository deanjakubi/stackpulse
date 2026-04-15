'use strict';

const {
  getReopenCount,
  classifyReopenCount,
  annotateReopenCount,
  groupByReopenCount,
  buildReopenCountSummary,
  formatReopenCountSummary,
} = require('./reopenCount');

function makePR(number, title, reopenedTimes = 0) {
  const events = Array.from({ length: reopenedTimes }, () => ({ event: 'reopened' }));
  return { number, title, timeline_events: events };
}

describe('getReopenCount', () => {
  it('returns 0 when no events', () => {
    expect(getReopenCount(makePR(1, 'A', 0))).toBe(0);
  });

  it('counts reopened events correctly', () => {
    expect(getReopenCount(makePR(2, 'B', 3))).toBe(3);
  });

  it('ignores non-reopened events', () => {
    const pr = { number: 3, title: 'C', timeline_events: [{ event: 'closed' }, { event: 'reopened' }] };
    expect(getReopenCount(pr)).toBe(1);
  });
});

describe('classifyReopenCount', () => {
  it('classifies 0 as none', () => expect(classifyReopenCount(0)).toBe('none'));
  it('classifies 1 as once', () => expect(classifyReopenCount(1)).toBe('once'));
  it('classifies 2 as several', () => expect(classifyReopenCount(2)).toBe('several'));
  it('classifies 3 as several', () => expect(classifyReopenCount(3)).toBe('several'));
  it('classifies 4 as many', () => expect(classifyReopenCount(4)).toBe('many'));
});

describe('annotateReopenCount', () => {
  it('adds reopenCount and reopenClass fields', () => {
    const prs = [makePR(1, 'A', 0), makePR(2, 'B', 2)];
    const result = annotateReopenCount(prs);
    expect(result[0].reopenCount).toBe(0);
    expect(result[0].reopenClass).toBe('none');
    expect(result[1].reopenCount).toBe(2);
    expect(result[1].reopenClass).toBe('several');
  });
});

describe('groupByReopenCount', () => {
  it('groups PRs by reopen class', () => {
    const prs = [
      { ...makePR(1, 'A', 0), reopenCount: 0, reopenClass: 'none' },
      { ...makePR(2, 'B', 1), reopenCount: 1, reopenClass: 'once' },
      { ...makePR(3, 'C', 5), reopenCount: 5, reopenClass: 'many' },
    ];
    const groups = groupByReopenCount(prs);
    expect(groups.none).toHaveLength(1);
    expect(groups.once).toHaveLength(1);
    expect(groups.many).toHaveLength(1);
    expect(groups.several).toHaveLength(0);
  });
});

describe('buildReopenCountSummary', () => {
  it('computes total, flagged, and maxReopen', () => {
    const prs = [makePR(1, 'A', 0), makePR(2, 'B', 4), makePR(3, 'C', 2)];
    const summary = buildReopenCountSummary(prs);
    expect(summary.total).toBe(3);
    expect(summary.flagged).toHaveLength(2);
    expect(summary.maxReopen).toBe(4);
  });
});

describe('formatReopenCountSummary', () => {
  it('includes header and counts', () => {
    const prs = [makePR(1, 'Fix bug', 0), makePR(2, 'Add feature', 3)];
    const summary = buildReopenCountSummary(prs);
    const output = formatReopenCountSummary(summary);
    expect(output).toContain('Reopen Count Report');
    expect(output).toContain('Max reopen count');
    expect(output).toContain('#2');
    expect(output).toContain('Add feature');
  });

  it('omits empty groups', () => {
    const prs = [makePR(1, 'Only PR', 0)];
    const summary = buildReopenCountSummary(prs);
    const output = formatReopenCountSummary(summary);
    expect(output).not.toContain('Many');
    expect(output).not.toContain('Several');
    expect(output).not.toContain('Once');
  });
});
