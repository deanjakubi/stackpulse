'use strict';

const {
  getCheckState,
  countByCheckState,
  annotateCheckState,
  buildCheckSummary,
  formatCheckSummary,
} = require('./checks');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    checkState: 'success',
    ...overrides,
  };
}

describe('getCheckState', () => {
  test('returns checkState when present', () => {
    expect(getCheckState(makePR({ checkState: 'failure' }))).toBe('failure');
  });

  test('returns unknown when checkState is missing', () => {
    expect(getCheckState({ number: 1 })).toBe('unknown');
  });
});

describe('countByCheckState', () => {
  test('counts each state correctly', () => {
    const prs = [
      makePR({ checkState: 'success' }),
      makePR({ checkState: 'success' }),
      makePR({ checkState: 'failure' }),
      makePR({ checkState: 'pending' }),
      makePR({ checkState: 'unknown' }),
    ];
    expect(countByCheckState(prs)).toEqual({
      success: 2,
      failure: 1,
      pending: 1,
      unknown: 1,
    });
  });

  test('handles empty list', () => {
    expect(countByCheckState([])).toEqual({ success: 0, failure: 0, pending: 0, unknown: 0 });
  });
});

describe('annotateCheckState', () => {
  test('preserves existing checkState', () => {
    const prs = [makePR({ checkState: 'pending' })];
    const result = annotateCheckState(prs);
    expect(result[0].checkState).toBe('pending');
  });

  test('adds unknown when checkState missing', () => {
    const prs = [{ number: 5, title: 'No state' }];
    const result = annotateCheckState(prs);
    expect(result[0].checkState).toBe('unknown');
  });
});

describe('buildCheckSummary', () => {
  test('computes pass rate correctly', () => {
    const prs = [
      makePR({ checkState: 'success' }),
      makePR({ checkState: 'failure' }),
    ];
    const summary = buildCheckSummary(prs);
    expect(summary.passRate).toBe(50);
    expect(summary.failingPRs).toHaveLength(1);
  });

  test('returns 0 pass rate for empty list', () => {
    expect(buildCheckSummary([]).passRate).toBe(0);
  });
});

describe('formatCheckSummary', () => {
  test('includes all state lines', () => {
    const prs = [makePR({ checkState: 'success' })];
    const output = formatCheckSummary(buildCheckSummary(prs));
    expect(output).toContain('Success');
    expect(output).toContain('Failure');
    expect(output).toContain('Pass rate');
    expect(output).toContain('100%');
  });
});
