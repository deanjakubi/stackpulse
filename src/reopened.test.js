'use strict';

const {
  isReopened,
  partitionReopened,
  annotateReopened,
  buildReopenedSummary,
  formatReopenedSummary,
} = require('./reopened');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    state: 'open',
    closed_at: null,
    repo: 'org/repo',
    ...overrides,
  };
}

describe('isReopened', () => {
  test('returns true when open with a closed_at date', () => {
    const pr = makePR({ state: 'open', closed_at: '2024-01-10T00:00:00Z' });
    expect(isReopened(pr)).toBe(true);
  });

  test('returns false for a normal open PR', () => {
    expect(isReopened(makePR())).toBe(false);
  });

  test('returns false for a closed PR', () => {
    const pr = makePR({ state: 'closed', closed_at: '2024-01-10T00:00:00Z' });
    expect(isReopened(pr)).toBe(false);
  });
});

describe('partitionReopened', () => {
  test('splits PRs correctly', () => {
    const a = makePR({ number: 1, state: 'open', closed_at: '2024-01-01T00:00:00Z' });
    const b = makePR({ number: 2 });
    const { reopened, normal } = partitionReopened([a, b]);
    expect(reopened).toHaveLength(1);
    expect(reopened[0].number).toBe(1);
    expect(normal).toHaveLength(1);
    expect(normal[0].number).toBe(2);
  });
});

describe('annotateReopened', () => {
  test('adds isReopened flag', () => {
    const pr = makePR({ state: 'open', closed_at: '2024-01-01T00:00:00Z' });
    const [annotated] = annotateReopened([pr]);
    expect(annotated.isReopened).toBe(true);
  });

  test('sets isReopened false for normal PRs', () => {
    const [annotated] = annotateReopened([makePR()]);
    expect(annotated.isReopened).toBe(false);
  });
});

describe('buildReopenedSummary', () => {
  test('returns correct counts', () => {
    const prs = [
      makePR({ number: 1, state: 'open', closed_at: '2024-01-01T00:00:00Z' }),
      makePR({ number: 2 }),
    ];
    const summary = buildReopenedSummary(prs);
    expect(summary.total).toBe(2);
    expect(summary.reopenedCount).toBe(1);
    expect(summary.normalCount).toBe(1);
  });
});

describe('formatReopenedSummary', () => {
  test('shows no reopened message when empty', () => {
    const summary = buildReopenedSummary([makePR()]);
    const output = formatReopenedSummary(summary);
    expect(output).toContain('No reopened PRs found.');
  });

  test('lists reopened PRs', () => {
    const pr = makePR({ number: 42, title: 'Fix bug', state: 'open', closed_at: '2024-01-01T00:00:00Z', repo: 'org/repo' });
    const summary = buildReopenedSummary([pr]);
    const output = formatReopenedSummary(summary);
    expect(output).toContain('#42');
    expect(output).toContain('Fix bug');
    expect(output).toContain('org/repo');
  });
});
