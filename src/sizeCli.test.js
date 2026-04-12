const { runSizeMode } = require('./sizeCli');

jest.mock('./config', () => ({
  loadConfig: () => ({ token: 'tok', repos: ['org/repo1'] }),
}));

jest.mock('./cache', () => ({
  getCached: jest.fn(() => null),
  setCached: jest.fn(),
}));

jest.mock('./prs', () => ({
  fetchPRs: jest.fn(),
}));

jest.mock('./github', () => ({ githubRequest: jest.fn() }));

const { fetchPRs } = require('./prs');
const { getCached } = require('./cache');

function makePR(additions, deletions) {
  return { number: 1, title: 'PR', additions, deletions, draft: false, labels: [], user: { login: 'alice' } };
}

describe('runSizeMode', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchPRs.mockResolvedValue([makePR(5, 2), makePR(300, 100)]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('prints size distribution report', async () => {
    await runSizeMode([]);
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('PR Size Distribution');
  });

  test('uses cached PRs when available', async () => {
    getCached.mockReturnValueOnce([makePR(5, 2)]);
    await runSizeMode([]);
    expect(fetchPRs).not.toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('XS');
  });

  test('handles fetch errors gracefully', async () => {
    getCached.mockReturnValue(null);
    fetchPRs.mockRejectedValue(new Error('network failure'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runSizeMode([])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  test('respects --no-drafts flag', async () => {
    const draft = { ...makePR(5, 2), draft: true };
    fetchPRs.mockResolvedValue([draft, makePR(10, 5)]);
    getCached.mockReturnValue(null);
    await runSizeMode(['--no-drafts']);
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('PR Size Distribution');
  });
});
