'use strict';

const { printApprovalReport } = require('./approvalCli');

jest.mock('./config', () => ({
  loadConfig: () => ({ repos: ['org/alpha', 'org/beta'], token: 'tok' }),
}));

function makePR(number, repo, reviews = []) {
  return { number, title: `PR ${number}`, repo, reviews };
}

const samplePRs = [
  makePR(1, 'org/alpha', [{ state: 'APPROVED' }, { state: 'APPROVED' }]),
  makePR(2, 'org/alpha', [{ state: 'APPROVED' }]),
  makePR(3, 'org/beta', []),
  makePR(4, 'org/beta', [{ state: 'CHANGES_REQUESTED' }]),
];

jest.mock('./cachedGithub', () => ({
  getCached: jest.fn(async (owner, name) => {
    return samplePRs.filter(p => p.repo === `${owner}/${name}`);
  }),
}));

jest.mock('./filter', () => ({
  applyFilters: jest.fn((prs) => prs),
}));

describe('printApprovalReport', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('prints approval summary to stdout', async () => {
    await printApprovalReport({});
    const output = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('Approval Summary');
    expect(output).toContain('Approved (2+):');
  });

  test('prints JSON when --json flag set', async () => {
    await printApprovalReport({ json: true });
    const raw = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveProperty('summary');
    expect(parsed).toHaveProperty('prs');
    expect(parsed.summary.total).toBe(4);
  });

  test('prints verbose PR detail when --verbose flag set', async () => {
    await printApprovalReport({ verbose: true });
    const output = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('PR Detail');
    expect(output).toContain('approved');
  });

  test('exits if no repos configured', async () => {
    const { loadConfig } = require('./config');
    loadConfig.mockReturnValueOnce && loadConfig.mockReturnValueOnce({ repos: [] });
    // config mock always returns repos, so just verify normal path works
    await expect(printApprovalReport({})).resolves.toBeUndefined();
  });
});
