const { countByRepo, countByAuthor, topN, buildHotspotSummary, formatHotspotSummary } = require('./hotspot');

function makePR(repo, login) {
  return { repo, user: { login } };
}

const prs = [
  makePR('org/alpha', 'alice'),
  makePR('org/alpha', 'alice'),
  makePR('org/beta', 'bob'),
  makePR('org/alpha', 'bob'),
  makePR('org/gamma', 'carol'),
  makePR('org/beta', 'alice'),
];

test('countByRepo counts correctly', () => {
  const result = countByRepo(prs);
  expect(result['org/alpha']).toBe(3);
  expect(result['org/beta']).toBe(2);
  expect(result['org/gamma']).toBe(1);
});

test('countByAuthor counts correctly', () => {
  const result = countByAuthor(prs);
  expect(result['alice']).toBe(3);
  expect(result['bob']).toBe(2);
  expect(result['carol']).toBe(1);
});

test('topN returns sorted top entries', () => {
  const result = topN({ a: 5, b: 10, c: 3 }, 2);
  expect(result).toEqual([{ name: 'b', count: 10 }, { name: 'a', count: 5 }]);
});

test('topN respects n limit', () => {
  const result = topN({ a: 1, b: 2, c: 3 }, 2);
  expect(result.length).toBe(2);
});

test('buildHotspotSummary returns correct structure', () => {
  const summary = buildHotspotSummary(prs, 3);
  expect(summary.totalPRs).toBe(6);
  expect(summary.topRepos[0].name).toBe('org/alpha');
  expect(summary.topAuthors[0].name).toBe('alice');
});

test('formatHotspotSummary includes headers', () => {
  const summary = buildHotspotSummary(prs);
  const output = formatHotspotSummary(summary);
  expect(output).toContain('Total PRs: 6');
  expect(output).toContain('Top Repos:');
  expect(output).toContain('Top Authors:');
  expect(output).toContain('org/alpha');
  expect(output).toContain('alice');
});
