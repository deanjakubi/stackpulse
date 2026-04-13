const { printReadinessReport } = require('./readinessCli');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    repo: 'org/repo',
    draft: false,
    mergeable_state: 'clean',
    reviews: [],
    check_runs: [],
    ...overrides,
  };
}

describe('printReadinessReport', () => {
  let logs;

  beforeEach(() => {
    logs = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => logs.push(args.join(' ')));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints summary with correct totals', () => {
    const prs = [
      makePR({ number: 1 }),
      makePR({ number: 2, draft: true }),
    ];
    printReadinessReport(prs);
    const output = logs.join('\n');
    expect(output).toContain('2 PRs');
  });

  it('shows ready PRs when approved and checks pass', () => {
    const pr = makePR({
      number: 10,
      reviews: [{ state: 'APPROVED', user: { login: 'alice' } }],
      check_runs: [{ conclusion: 'success' }],
    });
    printReadinessReport([pr]);
    const output = logs.join('\n');
    expect(output).toContain('READY');
    expect(output).toContain('#10');
  });

  it('shows blocked PRs with dirty merge state', () => {
    const pr = makePR({ number: 5, mergeable_state: 'dirty' });
    printReadinessReport([pr]);
    const output = logs.join('\n');
    expect(output).toContain('BLOCKED');
  });

  it('truncates long titles', () => {
    const pr = makePR({ title: 'A'.repeat(80) });
    printReadinessReport([pr]);
    const output = logs.join('\n');
    expect(output).toContain('...');
  });

  it('shows nothing when no PRs match filter', () => {
    printReadinessReport([], { author: 'nobody' });
    const output = logs.join('\n');
    expect(output).toContain('0 PRs');
  });

  it('includes repo name in output', () => {
    const pr = makePR({ repo: 'acme/frontend' });
    printReadinessReport([pr]);
    const output = logs.join('\n');
    expect(output).toContain('acme/frontend');
  });
});
