'use strict';

const { printCheckReport } = require('./checksCli');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    repo: 'org/repo',
    checkState: 'success',
    ...overrides,
  };
}

describe('printCheckReport', () => {
  let output;

  beforeEach(() => {
    output = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => output.push(args.join(' ')));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('prints repo header', () => {
    printCheckReport([makePR()]);
    expect(output.some((l) => l.includes('org/repo'))).toBe(true);
  });

  test('prints check summary with pass rate', () => {
    printCheckReport([makePR({ checkState: 'success' })]);
    expect(output.some((l) => l.includes('100%'))).toBe(true);
  });

  test('lists failing PRs by number and title', () => {
    const prs = [
      makePR({ number: 42, title: 'Broken build', checkState: 'failure' }),
    ];
    printCheckReport(prs);
    expect(output.some((l) => l.includes('#42') && l.includes('Broken build'))).toBe(true);
  });

  test('handles multiple repos separately', () => {
    const prs = [
      makePR({ repo: 'org/alpha', checkState: 'success' }),
      makePR({ repo: 'org/beta', checkState: 'failure', number: 2, title: 'Oops' }),
    ];
    printCheckReport(prs);
    expect(output.some((l) => l.includes('org/alpha'))).toBe(true);
    expect(output.some((l) => l.includes('org/beta'))).toBe(true);
  });

  test('does not print failing PRs section when none fail', () => {
    printCheckReport([makePR({ checkState: 'success' })]);
    expect(output.some((l) => l.includes('Failing PRs'))).toBe(false);
  });
});
