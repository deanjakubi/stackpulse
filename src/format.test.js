'use strict';

const {
  formatDuration,
  formatCount,
  truncate,
  formatRepoSlug,
  formatPRNumber,
} = require('./format');

describe('formatDuration', () => {
  test('formats seconds when under a minute', () => {
    expect(formatDuration(45000)).toBe('45s');
  });

  test('formats minutes when under an hour', () => {
    expect(formatDuration(5 * 60 * 1000)).toBe('5m');
  });

  test('formats hours when under a day', () => {
    expect(formatDuration(3 * 60 * 60 * 1000)).toBe('3h');
  });

  test('formats days for large durations', () => {
    expect(formatDuration(2 * 24 * 60 * 60 * 1000)).toBe('2d');
  });

  test('floors partial units', () => {
    expect(formatDuration(90 * 60 * 1000)).toBe('1h');
  });
});

describe('formatCount', () => {
  test('uses singular label for count of 1', () => {
    expect(formatCount(1, 'PR')).toBe('1 PR');
  });

  test('uses plural label for count of 0', () => {
    expect(formatCount(0, 'PR')).toBe('0 PRs');
  });

  test('uses plural label for count > 1', () => {
    expect(formatCount(5, 'review')).toBe('5 reviews');
  });
});

describe('truncate', () => {
  test('returns string unchanged if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  test('truncates and appends ellipsis if over limit', () => {
    expect(truncate('hello world', 8)).toBe('hello w…');
  });

  test('returns empty string for non-string input', () => {
    expect(truncate(null, 10)).toBe('');
    expect(truncate(undefined, 10)).toBe('');
  });

  test('handles exact length boundary', () => {
    expect(truncate('abcde', 5)).toBe('abcde');
  });
});

describe('formatRepoSlug', () => {
  test('formats owner and repo correctly', () => {
    expect(formatRepoSlug('octocat', 'hello-world')).toBe('octocat/hello-world');
  });

  test('returns empty string if owner is missing', () => {
    expect(formatRepoSlug('', 'repo')).toBe('');
  });

  test('returns empty string if repo is missing', () => {
    expect(formatRepoSlug('owner', '')).toBe('');
  });
});

describe('formatPRNumber', () => {
  test('prepends # to number', () => {
    expect(formatPRNumber(42)).toBe('#42');
  });

  test('works with string input', () => {
    expect(formatPRNumber('101')).toBe('#101');
  });
});
