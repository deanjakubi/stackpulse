'use strict';

jest.mock('./config');
jest.mock('./prs');
jest.mock('./cache');

const { loadConfig } = require('./config');
const { fetchPRs } = require('./prs');
const { runBurndownMode } = require('./burndownCli');

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test',
    created_at: daysAgo(3),
    merged_at: null,
    closed_at: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  loadConfig.mockResolvedValue({ repos: ['org/repo'], token: 'tok' });
  fetchPRs.mockResolvedValue([makePR()]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('runBurndownMode', () => {
  test('prints burndown output', async () => {
    await runBurndownMode([]);
    const output = console.log.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('PR Burndown');
  });

  test('respects --days flag', async () => {
    await runBurndownMode(['--days=7']);
    const output = console.log.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('last 7 days');
  });

  test('exits when no repos configured', async () => {
    loadConfig.mockResolvedValue({ repos: [], token: 'tok' });
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    await expect(runBurndownMode([])).rejects.toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('handles fetch errors gracefully', async () => {
    fetchPRs.mockRejectedValue(new Error('network error'));
    await runBurndownMode([]);
    const warns = console.error.mock.calls.map((c) => c[0]).join('\n');
    expect(warns).toContain('warn');
  });

  test('shows message when no PRs found', async () => {
    fetchPRs.mockResolvedValue([]);
    await runBurndownMode([]);
    const output = console.log.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('No PRs found');
  });
});
