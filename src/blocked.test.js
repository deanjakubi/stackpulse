const { isBlockedByLabel, isBlockedByReview, isBlockedByChecks, classifyBlockReason, isBlocked, annotateBlocked, partitionBlocked, buildBlockedSummary, formatBlockedSummary } = require('./blocked');

function makePR(overrides = {}) {
  return { number: 1, title: 'Test PR', labels: [], reviews: [], checkState: 'success', ...overrides };
}

describe('isBlockedByLabel', () => {
  it('returns true for blocked label', () => {
    expect(isBlockedByLabel(makePR({ labels: [{ name: 'blocked' }] }))).toBe(true);
  });
  it('returns true for do-not-merge label', () => {
    expect(isBlockedByLabel(makePR({ labels: [{ name: 'do-not-merge' }] }))).toBe(true);
  });
  it('returns false for unrelated label', () => {
    expect(isBlockedByLabel(makePR({ labels: [{ name: 'enhancement' }] }))).toBe(false);
  });
  it('is case-insensitive', () => {
    expect(isBlockedByLabel(makePR({ labels: [{ name: 'WIP' }] }))).toBe(true);
  });
});

describe('isBlockedByReview', () => {
  it('returns true when CHANGES_REQUESTED', () => {
    expect(isBlockedByReview(makePR({ reviews: [{ state: 'CHANGES_REQUESTED' }] }))).toBe(true);
  });
  it('returns false for approved', () => {
    expect(isBlockedByReview(makePR({ reviews: [{ state: 'APPROVED' }] }))).toBe(false);
  });
  it('returns false with no reviews', () => {
    expect(isBlockedByReview(makePR())).toBe(false);
  });
});

describe('isBlockedByChecks', () => {
  it('returns true for failure', () => {
    expect(isBlockedByChecks(makePR({ checkState: 'failure' }))).toBe(true);
  });
  it('returns true for error', () => {
    expect(isBlockedByChecks(makePR({ checkState: 'error' }))).toBe(true);
  });
  it('returns false for success', () => {
    expect(isBlockedByChecks(makePR({ checkState: 'success' }))).toBe(false);
  });
});

describe('classifyBlockReason', () => {
  it('returns label when blocked by label', () => {
    expect(classifyBlockReason(makePR({ labels: [{ name: 'blocked' }] }))).toBe('label');
  });
  it('returns changes_requested when review blocks', () => {
    expect(classifyBlockReason(makePR({ reviews: [{ state: 'CHANGES_REQUESTED' }] }))).toBe('changes_requested');
  });
  it('returns failing_checks when checks fail', () => {
    expect(classifyBlockReason(makePR({ checkState: 'failure' }))).toBe('failing_checks');
  });
  it('returns null when not blocked', () => {
    expect(classifyBlockReason(makePR())).toBeNull();
  });
});

describe('buildBlockedSummary', () => {
  it('counts blocked and unblocked PRs', () => {
    const prs = [
      makePR({ labels: [{ name: 'blocked' }] }),
      makePR({ checkState: 'failure' }),
      makePR(),
    ];
    const summary = buildBlockedSummary(prs);
    expect(summary.blockedCount).toBe(2);
    expect(summary.unblockedCount).toBe(1);
    expect(summary.byReason.label).toBe(1);
    expect(summary.byReason.failing_checks).toBe(1);
  });
});

describe('formatBlockedSummary', () => {
  it('includes blocked count', () => {
    const summary = buildBlockedSummary([makePR({ labels: [{ name: 'wip' }] }), makePR()]);
    const output = formatBlockedSummary(summary);
    expect(output).toContain('Blocked PRs: 1 / 2');
    expect(output).toContain('By label:');
  });
  it('does not show breakdown when none blocked', () => {
    const summary = buildBlockedSummary([makePR()]);
    const output = formatBlockedSummary(summary);
    expect(output).not.toContain('By label:');
  });
});
