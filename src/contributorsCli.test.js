const { printContributorReport } = require('./contributorsCli');

function makePR(login, created_at = '2024-04-01T00:00:00Z', extra = {}) {
  return { user: { login }, created_at, draft: false, labels: [], ...extra };
}

describe('printContributorReport', () => {
  let output;

  beforeEach(() => {
    output = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => output.push(args.join(' ')));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints contributor list', () => {
    const prs = [
      makePR('alice'),
      makePR('alice'),
      makePR('bob'),
    ];
    printContributorReport(prs);
    const combined = output.join('\n');
    expect(combined).toContain('alice');
    expect(combined).toContain('bob');
  });

  it('respects --top option', () => {
    const prs = [
      makePR('alice'),
      makePR('alice'),
      makePR('bob'),
      makePR('carol'),
    ];
    printContributorReport(prs, { top: 1 });
    const combined = output.join('\n');
    expect(combined).toContain('alice');
    expect(combined).not.toContain('carol');
  });

  it('prints total contributors count', () => {
    const prs = [makePR('alice'), makePR('bob')];
    printContributorReport(prs);
    const combined = output.join('\n');
    expect(combined).toContain('Total contributors: 2');
  });

  it('handles empty PR list gracefully', () => {
    printContributorReport([]);
    const combined = output.join('\n');
    expect(combined).toContain('No contributors found.');
    expect(combined).toContain('Total contributors: 0');
  });

  it('filters by author when option provided', () => {
    const prs = [
      makePR('alice'),
      makePR('bob'),
    ];
    printContributorReport(prs, { author: 'alice' });
    const combined = output.join('\n');
    expect(combined).toContain('alice');
  });
});
