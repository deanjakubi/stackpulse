const { classifySize, annotateSizePRs, groupBySize, buildSizeSummary, formatSizeSummary } = require('./size');

function makePR(additions, deletions, overrides = {}) {
  return { number: 1, title: 'Test PR', additions, deletions, ...overrides };
}

describe('classifySize', () => {
  test('XS for <= 10 lines', () => {
    expect(classifySize(makePR(5, 3))).toBe('XS');
  });

  test('S for <= 50 lines', () => {
    expect(classifySize(makePR(30, 10))).toBe('S');
  });

  test('M for <= 200 lines', () => {
    expect(classifySize(makePR(100, 80))).toBe('M');
  });

  test('L for <= 500 lines', () => {
    expect(classifySize(makePR(300, 100))).toBe('L');
  });

  test('XL for > 500 lines', () => {
    expect(classifySize(makePR(400, 200))).toBe('XL');
  });

  test('defaults to XS when additions/deletions missing', () => {
    expect(classifySize({})).toBe('XS');
  });
});

describe('annotateSizePRs', () => {
  test('adds sizeLabel to each PR', () => {
    const prs = [makePR(5, 2), makePR(100, 50)];
    const result = annotateSizePRs(prs);
    expect(result[0].sizeLabel).toBe('XS');
    expect(result[1].sizeLabel).toBe('M');
  });

  test('does not mutate original PRs', () => {
    const pr = makePR(5, 2);
    annotateSizePRs([pr]);
    expect(pr.sizeLabel).toBeUndefined();
  });
});

describe('groupBySize', () => {
  test('groups PRs into correct buckets', () => {
    const prs = annotateSizePRs([makePR(5, 0), makePR(5, 0), makePR(300, 100)]);
    const groups = groupBySize(prs);
    expect(groups['XS'].length).toBe(2);
    expect(groups['L'].length).toBe(1);
    expect(groups['M'].length).toBe(0);
  });
});

describe('buildSizeSummary', () => {
  test('returns summary rows for all buckets', () => {
    const prs = [makePR(5, 0), makePR(300, 100)];
    const summary = buildSizeSummary(prs);
    expect(summary.length).toBe(5);
    const xs = summary.find((r) => r.size === 'XS');
    expect(xs.count).toBe(1);
  });
});

describe('formatSizeSummary', () => {
  test('formats summary as string', () => {
    const prs = [makePR(5, 0), makePR(300, 100)];
    const summary = buildSizeSummary(prs);
    const output = formatSizeSummary(summary);
    expect(output).toContain('PR Size Distribution');
    expect(output).toContain('XS');
    expect(output).toContain('L');
  });

  test('shows no PRs message when empty', () => {
    const output = formatSizeSummary(buildSizeSummary([]));
    expect(output).toContain('No PRs found.');
  });
});
