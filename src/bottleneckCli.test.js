const { printBottleneckReport } = require('./bottleneckCli');
const { buildBottleneckSummary } = require('./bottleneck');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Fix bug',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    comments: 3,
    requested_reviewers: [],
    ...overrides
  };
}

describe('printBottleneckReport', () => {
  let spy;
  beforeEach(() => { spy = jest.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => spy.mockRestore());

  it('prints summary without verbose', () => {
    const summary = buildBottleneckSummary([makePR()]);
    printBottleneckReport(summary, false);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Bottleneck Report'));
  });

  it('prints verbose lines for critical/high/medium PRs', () => {
    const pr = makePR({
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      comments: 15
    });
    const summary = buildBottleneckSummary([pr]);
    printBottleneckReport(summary, true);
    const calls = spy.mock.calls.map(c => c[0]).join('\n');
    expect(calls).toMatch(/CRITICAL|HIGH|MEDIUM/);
  });

  it('handles empty PR list gracefully', () => {
    const summary = buildBottleneckSummary([]);
    expect(() => printBottleneckReport(summary, true)).not.toThrow();
  });
});
