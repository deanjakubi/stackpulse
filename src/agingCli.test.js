const { runAgingMode } = require('./agingCli');

jest.mock('./config', () => ({
  loadConfig: jest.fn(),
}));
jest.mock('./cache', () => ({
  getCached: jest.fn().mockResolvedValue(null),
  setCached: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('./github', () => ({
  githubRequest: jest.fn(),
}));
jest.mock('./filter', () => ({
  applyFilters: jest.fn(prs => prs),
}));

const { loadConfig } = require('./config');
const { githubRequest } = require('./github');

function makePR(daysAgo, number = 1) {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return { number, title: `PR ${number}`, created_at: d.toISOString(), draft: false };
}

describe('runAgingMode', () => {
  let consoleSpy;
  let errorSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('prints aging summary for configured repos', async () => {
    loadConfig.mockResolvedValue({ token: 'tok', repos: ['owner/repo'] });
    githubRequest.mockResolvedValue([makePR(1), makePR(10), makePR(60)]);

    await runAgingMode([]);

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('Aging Breakdown');
    expect(output).toContain('fresh');
  });

  test('exits with error when no repos configured', async () => {
    loadConfig.mockResolvedValue({ token: 'tok', repos: [] });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(runAgingMode([])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No repos'));
    exitSpy.mockRestore();
  });

  test('logs error and continues when a repo fetch fails', async () => {
    loadConfig.mockResolvedValue({ token: 'tok', repos: ['owner/bad', 'owner/good'] });
    githubRequest
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([makePR(5)]);

    await runAgingMode([]);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('owner/bad'));
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('Aging Breakdown');
  });

  test('prints detail lines when --detail flag is passed', async () => {
    loadConfig.mockResolvedValue({ token: 'tok', repos: ['owner/repo'] });
    githubRequest.mockResolvedValue([makePR(1, 42)]);

    await runAgingMode(['--detail']);

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('#42');
    expect(output).toContain('owner/repo');
  });
});
