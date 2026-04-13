const { daysSinceCreated, classifyAging, annotateAgingPRs, groupByAgingBand, buildAgingSummary, formatAgingSummary } = require('./aging');

function makePR(daysAgo, extra = {}) {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return { number: 1, title: 'Test PR', created_at: d.toISOString(), ...extra };
}

describe('daysSinceCreated', () => {
  test('returns 0 for a PR created now', () => {
    expect(daysSinceCreated(makePR(0))).toBe(0);
  });

  test('returns correct days for older PR', () => {
    expect(daysSinceCreated(makePR(10))).toBe(10);
  });
});

describe('classifyAging', () => {
  test('classifies 1 day as fresh', () => expect(classifyAging(1).label).toBe('fresh'));
  test('classifies 5 days as active', () => expect(classifyAging(5).label).toBe('active'));
  test('classifies 15 days as aging', () => expect(classifyAging(15).label).toBe('aging'));
  test('classifies 60 days as stagnant', () => expect(classifyAging(60).label).toBe('stagnant'));
  test('classifies 120 days as ancient', () => expect(classifyAging(120).label).toBe('ancient'));
});

describe('annotateAgingPRs', () => {
  test('adds _agingDays and _agingBand to each PR', () => {
    const prs = [makePR(3), makePR(40)];
    const annotated = annotateAgingPRs(prs);
    expect(annotated[0]._agingDays).toBe(3);
    expect(annotated[0]._agingBand).toBe('active');
    expect(annotated[1]._agingDays).toBe(40);
    expect(annotated[1]._agingBand).toBe('stagnant');
  });
});

describe('groupByAgingBand', () => {
  test('groups PRs into correct bands', () => {
    const prs = annotateAgingPRs([makePR(1), makePR(5), makePR(15), makePR(60), makePR(120)]);
    const groups = groupByAgingBand(prs);
    expect(groups.fresh).toHaveLength(1);
    expect(groups.active).toHaveLength(1);
    expect(groups.aging).toHaveLength(1);
    expect(groups.stagnant).toHaveLength(1);
    expect(groups.ancient).toHaveLength(1);
  });

  test('empty array returns empty groups', () => {
    const groups = groupByAgingBand([]);
    expect(Object.values(groups).every(g => g.length === 0)).toBe(true);
  });
});

describe('buildAgingSummary', () => {
  test('returns summary rows with counts', () => {
    const prs = [makePR(1), makePR(1), makePR(60)];
    const summary = buildAgingSummary(prs);
    const fresh = summary.find(r => r.band === 'fresh');
    const stagnant = summary.find(r => r.band === 'stagnant');
    expect(fresh.count).toBe(2);
    expect(stagnant.count).toBe(1);
  });
});

describe('formatAgingSummary', () => {
  test('includes band names for non-zero bands', () => {
    const prs = [makePR(1), makePR(60)];
    const summary = buildAgingSummary(prs);
    const output = formatAgingSummary(summary);
    expect(output).toContain('fresh');
    expect(output).toContain('stagnant');
    expect(output).not.toContain('ancient');
  });

  test('shows no PRs message when empty', () => {
    const output = formatAgingSummary(buildAgingSummary([]));
    expect(output).toContain('No open PRs found.');
  });
});
