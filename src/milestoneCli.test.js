'use strict';

const { runMilestoneMode, fetchPRs } = require('./milestoneCli');

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
const { getCached, setCached } = require('./cache');

const samplePRs = [
  { number: 1, state: 'open', draft: false, milestone: { title: 'v1.0' } },
  { number: 2, state: 'closed', draft: false, milestone: null },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchPRs', () => {
  test('returns cached data if available', async () => {
    getCached.mockResolvedValue(samplePRs);
    const result = await fetchPRs('owner/repo', 'tok');
    expect(result).toBe(samplePRs);
    expect(githubRequest).not.toHaveBeenCalled();
  });

  test('fetches from github and caches when no cache', async () => {
    getCached.mockResolvedValue(null);
    githubRequest.mockResolvedValue(samplePRs);
    const result = await fetchPRs('owner/repo', 'tok');
    expect(githubRequest).toHaveBeenCalledWith('/repos/owner/repo/pulls?state=all&per_page=100', 'tok');
    expect(setCached).toHaveBeenCalledWith('milestone:owner/repo', samplePRs);
    expect(result).toBe(samplePRs);
  });
});

describe('runMilestoneMode', () => {
  test('logs message when no repos configured', async () => {
    loadConfig.mockResolvedValue({ token: 'tok', repos: [] });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runMilestoneMode();
    expect(spy).toHaveBeenCalledWith('No repos configured.');
    spy.mockRestore();
  });

  test('prints milestone report for configured repos', async () => {
    loadConfig.mockResolvedValue({ token: 'tok', repos: ['owner/repo'] });
    getCached.mockResolvedValue(null);
    githubRequest.mockResolvedValue(samplePRs);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runMilestoneMode();
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('Milestone Report');
    spy.mockRestore();
  });

  test('logs error and continues on fetch failure', async () => {
    loadConfig.mockResolvedValue({ token: 'tok', repos: ['bad/repo'] });
    getCached.mockResolvedValue(null);
    githubRequest.mockRejectedValue(new Error('network error'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runMilestoneMode();
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('network error'));
    errSpy.mockRestore();
    logSpy.mockRestore();
  });
});
