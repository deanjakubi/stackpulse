const {
  daysBetween,
  classifyAge,
  groupByTimeline,
  buildTimelineSummary,
  formatTimelineSummary,
} = require('./timeline');

const NOW = new Date('2024-06-15T12:00:00Z');

function makePR(daysAgo) {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return { number: daysAgo, title: `PR ${daysAgo}`, created_at: d.toISOString() };
}

describe('daysBetween', () => {
  test('same day returns 0', () => {
    expect(daysBetween('2024-06-15T08:00:00Z', '2024-06-15T20:00:00Z')).toBe(0);
  });

  test('one day apart returns 1', () => {
    expect(daysBetween('2024-06-14T00:00:00Z', '2024-06-15T00:00:00Z')).toBe(1);
  });

  test('seven days apart returns 7', () => {
    expect(daysBetween('2024-06-08T00:00:00Z', '2024-06-15T00:00:00Z')).toBe(7);
  });
});

describe('classifyAge', () => {
  test('created today', () => {
    expect(classifyAge(makePR(0), NOW)).toBe('today');
  });

  test('created 3 days ago => this_week', () => {
    expect(classifyAge(makePR(3), NOW)).toBe('this_week');
  });

  test('created 7 days ago => this_week', () => {
    expect(classifyAge(makePR(7), NOW)).toBe('this_week');
  });

  test('created 15 days ago => this_month', () => {
    expect(classifyAge(makePR(15), NOW)).toBe('this_month');
  });

  test('created 45 days ago => older', () => {
    expect(classifyAge(makePR(45), NOW)).toBe('older');
  });
});

describe('groupByTimeline', () => {
  test('correctly distributes PRs into buckets', () => {
    const prs = [makePR(0), makePR(2), makePR(10), makePR(60)];
    const buckets = groupByTimeline(prs, NOW);
    expect(buckets.today).toHaveLength(1);
    expect(buckets.this_week).toHaveLength(1);
    expect(buckets.this_month).toHaveLength(1);
    expect(buckets.older).toHaveLength(1);
  });

  test('empty input returns empty buckets', () => {
    const buckets = groupByTimeline([], NOW);
    expect(buckets.today).toHaveLength(0);
    expect(buckets.older).toHaveLength(0);
  });
});

describe('buildTimelineSummary', () => {
  test('sums counts correctly', () => {
    const buckets = groupByTimeline([makePR(0), makePR(3), makePR(20), makePR(90), makePR(91)], NOW);
    const summary = buildTimelineSummary(buckets);
    expect(summary.total).toBe(5);
    expect(summary.today).toBe(1);
    expect(summary.older).toBe(2);
  });
});

describe('formatTimelineSummary', () => {
  test('includes all bucket labels', () => {
    const buckets = groupByTimeline([makePR(0), makePR(5)], NOW);
    const output = formatTimelineSummary(buildTimelineSummary(buckets));
    expect(output).toContain('Today');
    expect(output).toContain('This week');
    expect(output).toContain('Total');
  });

  test('shows correct counts', () => {
    const buckets = groupByTimeline([makePR(0), makePR(0), makePR(40)], NOW);
    const output = formatTimelineSummary(buildTimelineSummary(buckets));
    expect(output).toContain('Today        : 2');
    expect(output).toContain('Older        : 1');
  });
});
