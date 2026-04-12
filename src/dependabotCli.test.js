const { printDependabotPRs } = require('./dependabotCli');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Bump lodash',
    state: 'open',
    merged_at: null,
    user: { login: 'dependabot[bot]' },
    ...overrides,
  };
}

describe('printDependabotPRs', () => {
  let spy;

  beforeEach(() => {
    spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('prints each open PR number and title', () => {
    const prs = [
      makePR({ number: 10, title: 'Bump axios to 1.0.0' }),
      makePR({ number: 11, title: 'Bump lodash to 4.17.21' }),
    ];
    printDependabotPRs(prs);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('#10'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Bump axios to 1.0.0'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('#11'));
  });

  it('skips closed PRs', () => {
    const prs = [
      makePR({ number: 10, state: 'open' }),
      makePR({ number: 11, state: 'closed' }),
    ];
    printDependabotPRs(prs);
    const calls = spy.mock.calls.map(c => c[0]);
    expect(calls.some(c => c.includes('#10'))).toBe(true);
    expect(calls.some(c => c.includes('#11'))).toBe(false);
  });

  it('prints placeholder when no open PRs', () => {
    printDependabotPRs([makePR({ state: 'closed' })]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('no open dependabot PRs'));
  });

  it('handles empty list', () => {
    printDependabotPRs([]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('no open dependabot PRs'));
  });
});
