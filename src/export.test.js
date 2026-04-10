const { toCSV, toJSON, exportPRs } = require('./export');

const makePR = (overrides = {}) => ({
  repo: 'org/repo',
  number: 42,
  title: 'Fix bug',
  user: { login: 'alice' },
  state: 'open',
  draft: false,
  labels: [{ name: 'bug' }, { name: 'good first issue' }],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  html_url: 'https://github.com/org/repo/pull/42',
  ...overrides,
});

describe('toCSV', () => {
  test('returns empty string for empty array', () => {
    expect(toCSV([])).toBe('');
  });

  test('includes header row', () => {
    const csv = toCSV([makePR()]);
    const firstLine = csv.split('\n')[0];
    expect(firstLine).toBe('repo,number,title,author,state,draft,labels,createdAt,updatedAt,url');
  });

  test('includes PR data row', () => {
    const csv = toCSV([makePR()]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('org/repo');
    expect(lines[1]).toContain('42');
    expect(lines[1]).toContain('alice');
    expect(lines[1]).toContain('bug;good first issue');
  });

  test('escapes titles containing commas', () => {
    const csv = toCSV([makePR({ title: 'Fix bug, again' })]);
    expect(csv).toContain('"Fix bug, again"');
  });

  test('escapes titles containing double quotes', () => {
    const csv = toCSV([makePR({ title: 'Fix "bug"' })]);
    expect(csv).toContain('"Fix ""bug"""');
  });

  test('handles missing optional fields gracefully', () => {
    const pr = { number: 1, title: 'Minimal' };
    expect(() => toCSV([pr])).not.toThrow();
  });
});

describe('toJSON', () => {
  test('returns valid JSON string', () => {
    const json = toJSON([makePR()]);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  test('round-trips PR data', () => {
    const pr = makePR();
    const parsed = JSON.parse(toJSON([pr]));
    expect(parsed[0].number).toBe(42);
    expect(parsed[0].user.login).toBe('alice');
  });
});

describe('exportPRs', () => {
  test('delegates to toJSON by default', () => {
    const result = exportPRs([makePR()]);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  test('delegates to toCSV when format is csv', () => {
    const result = exportPRs([makePR()], 'csv');
    expect(result).toContain('repo,number');
  });

  test('is case-insensitive for format', () => {
    expect(() => exportPRs([makePR()], 'CSV')).not.toThrow();
    expect(() => exportPRs([makePR()], 'JSON')).not.toThrow();
  });

  test('throws for unknown format', () => {
    expect(() => exportPRs([makePR()], 'xml')).toThrow('Unsupported export format');
  });
});
