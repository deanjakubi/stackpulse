jest.mock('./config');
jest.mock('./cache');
jest.mock('./prs');
jest.mock('./filter');

const { loadConfig } = require('./config');
const { getCached, setCached } = require('./cache');
const { fetchPRsForRepo } = require('./prs');
const { applyFilters } = require('./filter');
const { runAssignMode } = require('./assignCli');

function makePR(login) {
  return { number: 1, title: 'PR', assignees: [{ login }] };
}

beforeEach(() => {
  jest.clearAllMocks();
  getCached.mockResolvedValue(null);
  setCached.mockResolvedValue(undefined);
  applyFilters.mockImplementation((prs) => prs);
});

test('prints assignee summary to stdout', async () => {
  loadConfig.mockResolvedValue({ repos: ['org/repo'], token: 'tok', cacheTtl: 60 });
  fetchPRsForRepo.mockResolvedValue([makePR('alice'), makePR('alice'), makePR('bob')]);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await runAssignMode({});
  const output = spy.mock.calls.flat().join('\n');
  expect(output).toContain('alice');
  expect(output).toContain('bob');
  spy.mockRestore();
});

test('outputs JSON when --json flag is set', async () => {
  loadConfig.mockResolvedValue({ repos: ['org/repo'], token: 'tok', cacheTtl: 60 });
  fetchPRsForRepo.mockResolvedValue([makePR('alice')]);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await runAssignMode({ json: true });
  const raw = spy.mock.calls[0][0];
  const parsed = JSON.parse(raw);
  expect(parsed.alice).toBe(1);
  spy.mockRestore();
});

test('exits with error when no repos configured', async () => {
  loadConfig.mockResolvedValue({ repos: [] });
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  await expect(runAssignMode({})).rejects.toThrow('exit');
  expect(errSpy).toHaveBeenCalled();
  errSpy.mockRestore();
  exitSpy.mockRestore();
});

test('uses cached PRs when available', async () => {
  loadConfig.mockResolvedValue({ repos: ['org/repo'], token: 'tok', cacheTtl: 60 });
  getCached.mockResolvedValue([makePR('carol')]);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await runAssignMode({});
  expect(fetchPRsForRepo).not.toHaveBeenCalled();
  spy.mockRestore();
});

test('continues on fetch error for a repo', async () => {
  loadConfig.mockResolvedValue({ repos: ['org/bad', 'org/good'], token: 'tok', cacheTtl: 60 });
  fetchPRsForRepo
    .mockRejectedValueOnce(new Error('network fail'))
    .mockResolvedValueOnce([makePR('dave')]);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  await runAssignMode({});
  expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('network fail'));
  spy.mockRestore();
  errSpy.mockRestore();
});
