const { countLabels, sortedLabels, formatLabelSummary } = require('./labels');

function makePR(labels = []) {
  return { title: 'PR', labels };
}

describe('countLabels', () => {
  it('returns empty map for no PRs', () => {
    expect(countLabels([])).toEqual(new Map());
  });

  it('counts string labels', () => {
    const prs = [makePR(['bug', 'help wanted']), makePR(['bug'])];
    const counts = countLabels(prs);
    expect(counts.get('bug')).toBe(2);
    expect(counts.get('help wanted')).toBe(1);
  });

  it('counts object labels with .name', () => {
    const prs = [
      makePR([{ name: 'enhancement' }, { name: 'bug' }]),
      makePR([{ name: 'bug' }]),
    ];
    const counts = countLabels(prs);
    expect(counts.get('bug')).toBe(2);
    expect(counts.get('enhancement')).toBe(1);
  });

  it('ignores labels without a name', () => {
    const prs = [makePR([{ name: '' }, null, undefined, 'valid'])];
    const counts = countLabels(prs);
    expect(counts.size).toBe(1);
    expect(counts.get('valid')).toBe(1);
  });

  it('handles PRs with no labels field', () => {
    const prs = [{ title: 'no labels' }];
    expect(() => countLabels(prs)).not.toThrow();
  });
});

describe('sortedLabels', () => {
  it('sorts by count descending', () => {
    const counts = new Map([['a', 1], ['b', 3], ['c', 2]]);
    const result = sortedLabels(counts);
    expect(result.map(r => r.label)).toEqual(['b', 'c', 'a']);
  });

  it('breaks ties alphabetically', () => {
    const counts = new Map([['zebra', 2], ['apple', 2]]);
    const result = sortedLabels(counts);
    expect(result[0].label).toBe('apple');
  });

  it('respects limit', () => {
    const counts = new Map([['a', 3], ['b', 2], ['c', 1]]);
    expect(sortedLabels(counts, 2)).toHaveLength(2);
  });
});

describe('formatLabelSummary', () => {
  it('returns message when no labels', () => {
    expect(formatLabelSummary([])).toBe('No labels found.');
  });

  it('includes label name and count', () => {
    const prs = [makePR(['bug']), makePR(['bug']), makePR(['docs'])];
    const output = formatLabelSummary(prs);
    expect(output).toContain('bug');
    expect(output).toContain('2 PRs');
    expect(output).toContain('docs');
    expect(output).toContain('1 PR');
  });

  it('respects limit option', () => {
    const prs = Array.from({ length: 15 }, (_, i) => makePR([`label-${i}`]));
    const output = formatLabelSummary(prs, { limit: 5 });
    expect(output).toContain('top 5');
  });
});
