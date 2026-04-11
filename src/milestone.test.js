'use strict';

const {
  getMilestone,
  groupByMilestone,
  buildMilestoneSummary,
  buildMilestoneReport,
  formatMilestoneReport,
} = require('./milestone');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    state: 'open',
    draft: false,
    milestone: null,
    ...overrides,
  };
}

describe('getMilestone', () => {
  test('returns null when no milestone', () => {
    expect(getMilestone(makePR())).toBeNull();
  });
  test('returns milestone title', () => {
    expect(getMilestone(makePR({ milestone: { title: 'v1.0' } }))).toBe('v1.0');
  });
});

describe('groupByMilestone', () => {
  test('groups PRs by milestone title', () => {
    const prs = [
      makePR({ milestone: { title: 'v1.0' } }),
      makePR({ milestone: { title: 'v1.0' } }),
      makePR({ milestone: { title: 'v2.0' } }),
      makePR(),
    ];
    const groups = groupByMilestone(prs);
    expect(groups.get('v1.0')).toHaveLength(2);
    expect(groups.get('v2.0')).toHaveLength(1);
    expect(groups.get('__none__')).toHaveLength(1);
  });
});

describe('buildMilestoneSummary', () => {
  test('counts open, closed, and drafts correctly', () => {
    const prs = [
      makePR({ state: 'open' }),
      makePR({ state: 'open', draft: true }),
      makePR({ state: 'closed' }),
    ];
    const summary = buildMilestoneSummary('v1.0', prs);
    expect(summary).toEqual({ title: 'v1.0', total: 3, open: 2, closed: 1, drafts: 1 });
  });
});

describe('buildMilestoneReport', () => {
  test('returns sorted summaries', () => {
    const prs = [
      makePR({ milestone: { title: 'v2.0' } }),
      makePR({ milestone: { title: 'v1.0' } }),
    ];
    const report = buildMilestoneReport(prs);
    expect(report[0].title).toBe('v1.0');
    expect(report[1].title).toBe('v2.0');
  });
  test('handles empty array', () => {
    expect(buildMilestoneReport([])).toEqual([]);
  });
});

describe('formatMilestoneReport', () => {
  test('returns fallback for empty report', () => {
    expect(formatMilestoneReport([])).toBe('No milestone data available.');
  });
  test('formats summaries correctly', () => {
    const summaries = [{ title: 'v1.0', total: 2, open: 1, closed: 1, drafts: 0 }];
    const out = formatMilestoneReport(summaries);
    expect(out).toContain('v1.0');
    expect(out).toContain('open: 1');
    expect(out).toContain('closed: 1');
  });
  test('uses (no milestone) label for __none__', () => {
    const summaries = [{ title: '__none__', total: 1, open: 1, closed: 0, drafts: 0 }];
    expect(formatMilestoneReport(summaries)).toContain('(no milestone)');
  });
});
