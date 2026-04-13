const { printBlockedReport } = require('./blockedCli');

function makePR(overrides = {}) {
  return { number: 1, title: 'Test PR', labels: [], reviews: [], checkState: 'success', repo: 'org/repo', ...overrides };
}

describe('printBlockedReport', () => {
  let output;

  beforeEach(() => {
    output = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => output.push(args.join(' ')));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints no-blocked message when all clear', () => {
    printBlockedReport([makePR()]);
    expect(output.some(l => l.includes('No blocked PRs'))).toBe(true);
  });

  it('prints blocked PR with label reason', () => {
    const pr = makePR({ labels: [{ name: 'blocked' }] });
    printBlockedReport([pr]);
    expect(output.some(l => l.includes('#1'))).toBe(true);
    expect(output.some(l => l.includes('Label'))).toBe(true);
  });

  it('prints blocked PR with changes requested reason', () => {
    const pr = makePR({ reviews: [{ state: 'CHANGES_REQUESTED', user: { login: 'alice' } }] });
    printBlockedReport([pr]);
    expect(output.some(l => l.includes('Changes Requested'))).toBe(true);
  });

  it('prints reviewer names in verbose mode for changes_requested', () => {
    const pr = makePR({ reviews: [{ state: 'CHANGES_REQUESTED', user: { login: 'alice' } }] });
    printBlockedReport([pr], { verbose: true });
    expect(output.some(l => l.includes('alice'))).toBe(true);
  });

  it('does not print reviewer names without verbose mode', () => {
    const pr = makePR({ reviews: [{ state: 'CHANGES_REQUESTED', user: { login: 'alice' } }] });
    printBlockedReport([pr], { verbose: false });
    const reviewerLine = output.find(l => l.includes('Reviewers:'));
    expect(reviewerLine).toBeUndefined();
  });

  it('prints failing checks reason', () => {
    const pr = makePR({ checkState: 'failure' });
    printBlockedReport([pr]);
    expect(output.some(l => l.includes('Failing Checks'))).toBe(true);
  });

  it('includes summary line', () => {
    const prs = [makePR({ labels: [{ name: 'wip' }] }), makePR({ number: 2 })];
    printBlockedReport(prs);
    expect(output.some(l => l.includes('Blocked PRs:'))).toBe(true);
  });

  it('handles empty PR list', () => {
    printBlockedReport([]);
    expect(output.some(l => l.includes('No blocked PRs'))).toBe(true);
  });
});
