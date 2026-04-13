'use strict';

const {
  isCovered,
  classifyCoverage,
  annotateCoverage,
  buildCoverageSummary,
  formatCoverageSummary,
} = require('./coverage');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    reviews: [],
    ...overrides,
  };
}

describe('isCovered', () => {
  it('returns true when an APPROVED review exists', () => {
    const pr = makePR({ reviews: [{ state: 'APPROVED' }] });
    expect(isCovered(pr)).toBe(true);
  });

  it('returns false when no reviews', () => {
    expect(isCovered(makePR())).toBe(false);
  });

  it('returns false for CHANGES_REQUESTED only', () => {
    const pr = makePR({ reviews: [{ state: 'CHANGES_REQUESTED' }] });
    expect(isCovered(pr)).toBe(false);
  });
});

describe('classifyCoverage', () => {
  it('returns "approved" when approved', () => {
    const pr = makePR({ reviews: [{ state: 'APPROVED' }] });
    expect(classifyCoverage(pr)).toBe('approved');
  });

  it('returns "changes_requested" when changes requested', () => {
    const pr = makePR({ reviews: [{ state: 'CHANGES_REQUESTED' }] });
    expect(classifyCoverage(pr)).toBe('changes_requested');
  });

  it('returns "reviewed" for other review states', () => {
    const pr = makePR({ reviews: [{ state: 'COMMENTED' }] });
    expect(classifyCoverage(pr)).toBe('reviewed');
  });

  it('returns "no_review" when reviews array is empty', () => {
    expect(classifyCoverage(makePR())).toBe('no_review');
  });
});

describe('buildCoverageSummary', () => {
  it('computes correct counts and percentage', () => {
    const prs = [
      makePR({ reviews: [{ state: 'APPROVED' }] }),
      makePR({ reviews: [{ state: 'APPROVED' }] }),
      makePR({ reviews: [{ state: 'CHANGES_REQUESTED' }] }),
      makePR(),
    ];
    const summary = buildCoverageSummary(prs);
    expect(summary.total).toBe(4);
    expect(summary.coveredCount).toBe(2);
    expect(summary.coveragePct).toBe(50);
    expect(summary.counts.no_review).toBe(1);
  });

  it('handles empty list', () => {
    const summary = buildCoverageSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.coveragePct).toBe(0);
  });
});

describe('formatCoverageSummary', () => {
  it('includes percentage in output', () => {
    const summary = buildCoverageSummary([
      makePR({ reviews: [{ state: 'APPROVED' }] }),
    ]);
    const output = formatCoverageSummary(summary);
    expect(output).toContain('100%');
    expect(output).toContain('Approved:');
  });
});
