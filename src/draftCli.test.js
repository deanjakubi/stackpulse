const { runDraftMode } = require('./draftCli');

const mockPRs = [
  { number: 1, title: 'Ready PR', draft: false, user: { login: 'alice' } },
  { number: 2, title: 'WIP thing', draft: true, user: { login: 'bob' } },
];

jest.mock('./config', () => ({
  loadConfig: jest.fn().mockResolvedValue({
    repos: ['org/repo-a'],
    token: 'tok',
  }),
}));

jest.mock('./prs', () => ({
  fetchAllPRs: jest.fn().mockResolvedValue([
    { number: 1, title: 'Ready PR', draft: false, user: { login: 'alice' } },
    { number: 2, title: 'WIP thing', draft: true, user: { login: 'bob' } },
  ]),
}));

jest.mock('./cachedGithubWithRetry', () => ({
  cachedGithubWithRetry: jest.fn(),
}));

jest.mock('./filter', () => ({
  applyFilters: jest.fn((prs) => prs),
}));

describe('runDraftMode', () => {
  let spy;

  beforeEach(() => {
    spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    spy.mockRestore();
    jest.clearAllMocks();
  });

  test('prints draft summary to stdout', async () => {
    await runDraftMode([]);
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Draft PRs:');
    expect(output).toContain('WIP thing');
  });

  test('exits with error when no repos configured', async () => {
    const { loadConfig } = require('./config');
    loadConfig.mockResolvedValueOnce({ repos: [] });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(runDraftMode([])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  test('continues when one repo errors', async () => {
    const { fetchAllPRs } = require('./prs');
    fetchAllPRs.mockRejectedValueOnce(new Error('network error'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await runDraftMode([]);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('network error'));
    errSpy.mockRestore();
  });
});
