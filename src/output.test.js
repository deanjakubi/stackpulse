const {
  printRepoHeader,
  printRepoPRs,
  printSummary,
  printRateLimitWarning,
  renderOutput,
} = require('./output');

const makePR = (overrides = {}) => ({
  number: 1,
  title: 'Test PR',
  user: { login: 'alice' },
  draft: false,
  labels: [],
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('printRepoHeader', () => {
  it('logs the repo name', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printRepoHeader('owner/repo');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('owner/repo'));
    spy.mockRestore();
  });
});

describe('printRepoPRs', () => {
  it('prints "No open pull requests" when prs is empty', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printRepoPRs('owner/repo', []);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No open pull requests'));
    spy.mockRestore();
  });

  it('prints a row for each PR', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printRepoPRs('owner/repo', [makePR({ number: 1 }), makePR({ number: 2 })]);
    // header lines + 2 PR rows
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2);
    spy.mockRestore();
  });
});

describe('printSummary', () => {
  it('calls console.log with summary content', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printSummary([{ repo: 'owner/repo', prs: [makePR()] }]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('printRateLimitWarning', () => {
  it('does nothing when rateLimit is null', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    printRateLimitWarning(null);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('warns when rate limit is low', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const rateLimit = { remaining: 5, limit: 60, reset: Math.floor(Date.now() / 1000) + 300 };
    printRateLimitWarning(rateLimit);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
    spy.mockRestore();
  });
});

describe('renderOutput', () => {
  it('renders without throwing', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(() =>
      renderOutput([{ repo: 'owner/repo', prs: [makePR()] }], null)
    ).not.toThrow();
    spy.mockRestore();
  });
});
