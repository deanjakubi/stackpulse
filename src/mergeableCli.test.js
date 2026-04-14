'use strict';

const { printMergeableReport } = require('./mergeableCli');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    draft: false,
    mergeable_state: 'clean',
    ...overrides,
  };
}

describe('printMergeableReport', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints the summary header', () => {
    printMergeableReport([makePR()]);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Mergeability Report');
  });

  it('prints totals correctly', () => {
    const prs = [
      makePR({ mergeable_state: 'clean' }),
      makePR({ number: 2, mergeable_state: 'dirty' }),
    ];
    printMergeableReport(prs);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Total PRs  : 2');
    expect(output).toContain('Ready      : 1');
    expect(output).toContain('Conflict   : 1');
  });

  it('does not print per-PR details without verbose flag', () => {
    printMergeableReport([makePR({ number: 42, title: 'My PR' })]);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).not.toContain('#42');
  });

  it('prints per-PR details with verbose flag', () => {
    printMergeableReport([makePR({ number: 42, title: 'My PR', mergeable_state: 'clean' })], { verbose: true });
    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('#42');
    expect(output).toContain('My PR');
  });

  it('handles empty PR list gracefully', () => {
    expect(() => printMergeableReport([])).not.toThrow();
    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Total PRs  : 0');
  });

  it('groups draft PRs separately in verbose mode', () => {
    const prs = [
      makePR({ number: 1, draft: true, title: 'Draft PR' }),
      makePR({ number: 2, mergeable_state: 'clean', title: 'Ready PR' }),
    ];
    printMergeableReport(prs, { verbose: true });
    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Draft PR');
    expect(output).toContain('Ready PR');
  });
});
