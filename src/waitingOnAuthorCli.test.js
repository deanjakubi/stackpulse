const { printWaitingReport } = require('./waitingOnAuthorCli');

function makePR(overrides = {}) {
  return {
    number: 42,
    title: 'Fix something important',
    user: { login: 'alice' },
    labels: [],
    reviews: [],
    repo: 'org/repo',
    base: { repo: { full_name: 'org/repo' } },
    ...overrides,
  };
}

describe('printWaitingReport', () => {
  let spy;

  beforeEach(() => {
    spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('prints a no-PRs message when none are waiting', () => {
    printWaitingReport([makePR()]);
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toMatch(/No PRs currently waiting/i);
  });

  it('prints the PR number and author when waiting', () => {
    const pr = makePR({ reviews: [{ state: 'CHANGES_REQUESTED' }] });
    printWaitingReport([pr]);
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('#42');
    expect(output).toContain('alice');
  });

  it('prints the summary line with counts', () => {
    const waiting = makePR({ reviews: [{ state: 'CHANGES_REQUESTED' }] });
    const active = makePR({ number: 99 });
    printWaitingReport([waiting, active]);
    const output = spy.mock.calls.flat().join('\n');
    expect(output).toContain('1 / 2');
  });

  it('truncates long titles', () => {
    const pr = makePR({
      title: 'A'.repeat(60),
      reviews: [{ state: 'CHANGES_REQUESTED' }],
    });
    printWaitingReport([pr]);
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('...');
  });

  it('handles PRs with waiting-on-author label', () => {
    const pr = makePR({ labels: [{ name: 'waiting-on-author' }] });
    printWaitingReport([pr]);
    const output = spy.mock.calls.flat().join(' ');
    expect(output).toContain('#42');
  });
});
