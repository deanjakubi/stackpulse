const { daysBetween, computeVelocity, formatVelocitySummary } = require('./velocity');

function makePR(mergedAt = null) {
  return { number: 1, title: 'Test PR', merged_at: mergedAt };
}

describe('daysBetween', () => {
  test('returns at least 1 for same day', () => {
    expect(daysBetween('2024-01-01T00:00:00Z', '2024-01-01T12:00:00Z')).toBe(1);
  });

  test('returns correct days for known interval', () => {
    expect(daysBetween('2024-01-01T00:00:00Z', '2024-01-08T00:00:00Z')).toBe(7);
  });
});

describe('computeVelocity', () => {
  test('returns zeroed metrics when no merged PRs', () => {
    const prs = [makePR(null), makePR(null)];
    const result = computeVelocity(prs, '2024-06-01T00:00:00Z');
    expect(result.mergedCount).toBe(0);
    expect(result.perDay).toBe(0);
    expect(result.perWeek).toBe(0);
    expect(result.oldestMergedAt).toBeNull();
    expect(result.newestMergedAt).toBeNull();
  });

  test('computes correct rates for merged PRs', () => {
    const prs = [
      makePR('2024-05-25T00:00:00Z'),
      makePR('2024-05-26T00:00:00Z'),
      makePR('2024-05-27T00:00:00Z'),
      makePR('2024-05-28T00:00:00Z'),
      makePR('2024-05-29T00:00:00Z'),
      makePR('2024-05-30T00:00:00Z'),
      makePR('2024-05-31T00:00:00Z'),
      makePR(null),
    ];
    const result = computeVelocity(prs, '2024-06-01T00:00:00Z');
    expect(result.mergedCount).toBe(7);
    expect(result.total).toBe(8);
    expect(result.perDay).toBeGreaterThan(0);
    expect(result.perWeek).toBeCloseTo(result.perDay * 7, 1);
    expect(result.oldestMergedAt).toBe('2024-05-25T00:00:00Z');
    expect(result.newestMergedAt).toBe('2024-05-31T00:00:00Z');
  });

  test('handles single merged PR', () => {
    const prs = [makePR('2024-06-01T00:00:00Z')];
    const result = computeVelocity(prs, '2024-06-01T00:00:00Z');
    expect(result.mergedCount).toBe(1);
    expect(result.perDay).toBeGreaterThan(0);
  });
});

describe('formatVelocitySummary', () => {
  test('returns no-merged message when mergedCount is 0', () => {
    const v = { mergedCount: 0, total: 3, perDay: 0, perWeek: 0 };
    expect(formatVelocitySummary(v)).toContain('No merged PRs');
  });

  test('includes repo label when provided', () => {
    const v = { mergedCount: 5, total: 10, perDay: 0.5, perWeek: 3.5 };
    const out = formatVelocitySummary(v, 'owner/repo');
    expect(out).toContain('[owner/repo]');
    expect(out).toContain('5/10');
    expect(out).toContain('0.5/day');
    expect(out).toContain('3.5/week');
  });

  test('omits label when repo not provided', () => {
    const v = { mergedCount: 2, total: 4, perDay: 1, perWeek: 7 };
    const out = formatVelocitySummary(v);
    expect(out).not.toContain('[');
    expect(out).toContain('Merged:');
  });
});
