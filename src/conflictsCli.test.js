const { printConflictReport } = require('./conflictsCli');

function makePR(number, title, files = []) {
  return { number, title, changed_files_list: files };
}

describe('printConflictReport', () => {
  let spy;
  beforeEach(() => { spy = jest.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => spy.mockRestore());

  it('prints no-conflict message when PRs are disjoint', () => {
    const prs = [makePR(1, 'Fix A', ['a.js']), makePR(2, 'Fix B', ['b.js'])];
    printConflictReport(prs);
    const output = spy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(output).toMatch(/No conflicting PRs detected/);
  });

  it('prints conflict details when PRs overlap', () => {
    const prs = [
      makePR(10, 'Refactor auth', ['src/auth.js', 'src/utils.js']),
      makePR(11, 'Update utils',  ['src/utils.js', 'src/helpers.js']),
    ];
    printConflictReport(prs);
    const output = spy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(output).toMatch(/#10/);
    expect(output).toMatch(/#11/);
    expect(output).toMatch(/src\/utils\.js/);
  });

  it('truncates shared files list beyond 5', () => {
    const files = ['f1.js','f2.js','f3.js','f4.js','f5.js','f6.js'];
    const prs = [makePR(1, 'PR one', files), makePR(2, 'PR two', files)];
    printConflictReport(prs);
    const output = spy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(output).toMatch(/…/);
  });

  it('shows conflict count in header', () => {
    const prs = [
      makePR(1, 'A', ['x.js']),
      makePR(2, 'B', ['x.js']),
      makePR(3, 'C', ['x.js']),
    ];
    printConflictReport(prs);
    const output = spy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(output).toMatch(/3 conflict/);
  });
});
