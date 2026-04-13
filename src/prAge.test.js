const {
  daysSinceOpened,
  classifyPRAge,
  annotatePRAge,
  groupByAgeBand,
  buildPRAgeSummary,
  formatPRAgeSummary,
} = require('./prAge');

function makePR(daysAgo, extra = {}) {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return { number: 1, title: 'test PR', created_at: d.toISOString(), ...extra };
}

describe('classifyPRAge', () => {
  test('0 days is fresh', () => expect(classifyPRAge(0)).toBe('fresh'));
  test('1 day is fresh', () => expect(classifyPRAge(1)).toBe('fresh'));
  test('3 days is recent', () => expect(classifyPRAge(3)).toBe('recent'));
  test('7 days is recent', () => expect(classifyPRAge(7)).toBe('recent'));
  test('15 days is aging', () => expect(classifyPRAge(15)).toBe('aging'));
  test('30 days is aging', () => expect(classifyPRAge(30)).toBe('aging'));
  test('31 days is stale', () => expect(classifyPRAge(31)).toBe('stale'));
});

describe('daysSinceOpened', () => {
  test('returns approximate days', () => {
    const pr = makePR(5);
    expect(daysSinceOpened(pr)).toBe(5);
  });
});

describe('annotatePRAge', () => {
  test('adds _ageDays and _ageBand to each PR', () => {
    const prs = [makePR(0), makePR(10), makePR(40)];
    const result = annotatePRAge(prs);
    expect(result[0]._ageBand).toBe('fresh');
    expect(result[1]._ageBand).toBe('aging');
    expect(result[2]._ageBand).toBe('stale');
    expect(typeof result[0]._ageDays).toBe('number');
  });
});

describe('groupByAgeBand', () => {
  test('groups annotated PRs into bands', () => {
    const prs = annotatePRAge([makePR(0), makePR(5), makePR(20), makePR(60)]);
    const groups = groupByAgeBand(prs);
    expect(groups.fresh).toHaveLength(1);
    expect(groups.recent).toHaveLength(1);
    expect(groups.aging).toHaveLength(1);
    expect(groups.stale).toHaveLength(1);
  });
});

describe('buildPRAgeSummary', () => {
  test('returns correct counts', () => {
    const prs = [makePR(0), makePR(0), makePR(5), makePR(20), makePR(60)];
    const summary = buildPRAgeSummary(prs);
    expect(summary.total).toBe(5);
    expect(summary.fresh).toBe(2);
    expect(summary.recent).toBe(1);
    expect(summary.aging).toBe(1);
    expect(summary.stale).toBe(1);
  });
});

describe('formatPRAgeSummary', () => {
  test('returns a multi-line string', () => {
    const prs = [makePR(0), makePR(10)];
    const summary = buildPRAgeSummary(prs);
    const text = formatPRAgeSummary(summary);
    expect(text).toContain('PR Age Summary');
    expect(text).toContain('Fresh');
    expect(text).toContain('Stale');
  });
});
