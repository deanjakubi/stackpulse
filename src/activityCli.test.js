'use strict';

const { printActivityReport } = require('./activityCli');

function makePR(number, title, updatedDaysAgo, login = 'alice') {
  return {
    number,
    title,
    updated_at: new Date(Date.now() - updatedDaysAgo * 86400000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    user: { login },
  };
}

describe('printActivityReport', () => {
  let output;

  beforeEach(() => {
    output = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => output.push(args.join(' ')));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('prints repo header', () => {
    printActivityReport('owner/repo', []);
    expect(output.some(l => l.includes('owner/repo'))).toBe(true);
  });

  test('prints no-PRs message when list is empty', () => {
    printActivityReport('owner/repo', []);
    expect(output.some(l => l.includes('No open PRs'))).toBe(true);
  });

  test('prints a row for each PR', () => {
    const prs = [makePR(1, 'Fix bug', 0.5), makePR(2, 'Add feature', 3)];
    printActivityReport('owner/repo', prs);
    expect(output.some(l => l.includes('#1'))).toBe(true);
    expect(output.some(l => l.includes('#2'))).toBe(true);
  });

  test('includes author login in output', () => {
    const prs = [makePR(42, 'Refactor', 1, 'bob')];
    printActivityReport('owner/repo', prs);
    expect(output.some(l => l.includes('@bob'))).toBe(true);
  });

  test('includes activity summary line', () => {
    const prs = [makePR(1, 'Hot PR', 0.1), makePR(2, 'Old PR', 14)];
    printActivityReport('owner/repo', prs);
    expect(output.some(l => l.includes('Hot') && l.includes('Frozen'))).toBe(true);
  });

  test('truncates long PR titles', () => {
    const longTitle = 'A'.repeat(80);
    const prs = [makePR(5, longTitle, 1)];
    printActivityReport('owner/repo', prs);
    const prLine = output.find(l => l.includes('#5'));
    expect(prLine).toBeDefined();
    expect(prLine.length).toBeLessThan(longTitle.length + 50);
  });

  test('handles PR without user gracefully', () => {
    const pr = { number: 9, title: 'No user', updated_at: new Date().toISOString(), created_at: new Date().toISOString() };
    expect(() => printActivityReport('owner/repo', [pr])).not.toThrow();
  });
});
