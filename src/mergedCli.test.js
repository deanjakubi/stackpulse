'use strict';

jest.mock('./config');
jest.mock('./cachedGithubWithRetry');

const { loadConfig } = require('./config');
const { getCached } = require('./cachedGithubWithRetry');
const { runMergedMode } = require('./mergedCli');

const NOW = Date.now();
const daysAgo = (d) => new Date(NOW - d * 24 * 60 * 60 * 1000).toISOString();

function makePR({ number = 1, login = 'alice', merged_at = null, title = 'Fix bug' } = {}) {
  return { number, user: { login }, merged_at, title };
}

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  loadConfig.mockReturnValue({ repos: ['org/repo-a', 'org/repo-b'] });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('prints merged PRs within the window', async () => {
  getCached.mockResolvedValue([
    makePR({ number: 10, merged_at: daysAgo(2), login: 'alice', title: 'Add feature' }),
    makePR({ number: 11, merged_at: null }),
  ]);

  await runMergedMode(['node', 'cli', '--days=7']);

  const calls = console.log.mock.calls.flat().join(' ');
  expect(calls).toContain('#10');
  expect(calls).toContain('alice');
  expect(calls).toContain('Add feature');
});

test('skips repos with no merged PRs silently', async () => {
  getCached.mockResolvedValue([makePR({ merged_at: null })]);

  await runMergedMode(['node', 'cli']);

  const repoLines = console.log.mock.calls.filter((c) => c[0]?.includes('org/'));
  expect(repoLines).toHaveLength(0);
});

test('prints summary line at end', async () => {
  getCached.mockResolvedValue([
    makePR({ number: 5, merged_at: daysAgo(1), login: 'bob' }),
  ]);

  await runMergedMode(['node', 'cli', '--days=7']);

  const calls = console.log.mock.calls.flat().join(' ');
  expect(calls).toContain('Merged PRs');
});

test('handles empty repos config', async () => {
  loadConfig.mockReturnValue({ repos: [] });

  await runMergedMode([]);

  expect(console.log).toHaveBeenCalledWith('No repos configured.');
});

test('uses default 7-day window when --days not provided', async () => {
  getCached.mockResolvedValue([
    makePR({ number: 3, merged_at: daysAgo(6), login: 'carol' }),
    makePR({ number: 4, merged_at: daysAgo(8), login: 'carol' }),
  ]);

  await runMergedMode(['node', 'cli']);

  const calls = console.log.mock.calls.flat().join(' ');
  expect(calls).toContain('#3');
  expect(calls).not.toContain('#4');
});
