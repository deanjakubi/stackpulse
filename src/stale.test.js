const { daysSince, isStale, annotateStalePRs, filterStalePRs } = require('./stale');

const NOW = new Date('2024-06-15T12:00:00Z');

function makePR(updatedAt, extra = {}) {
  return {
    number: 1,
    title: 'Test PR',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: updatedAt,
    ...extra,
  };
}

describe('daysSince', () => {
  test('returns 0 for same time', () => {
    expect(daysSince('2024-06-15T12:00:00Z', NOW)).toBeCloseTo(0, 1);
  });

  test('returns correct days for a past date', () => {
    expect(daysSince('2024-06-08T12:00:00Z', NOW)).toBeCloseTo(7, 1);
  });

  test('returns fractional days', () => {
    expect(daysSince('2024-06-14T00:00:00Z', NOW)).toBeCloseTo(1.5, 1);
  });
});

describe('isStale', () => {
  test('returns true when PR exceeds threshold', () => {
    const pr = makePR('2024-06-07T12:00:00Z');
    expect(isStale(pr, 7, NOW)).toBe(true);
  });

  test('returns false when PR is within threshold', () => {
    const pr = makePR('2024-06-14T12:00:00Z');
    expect(isStale(pr, 7, NOW)).toBe(false);
  });

  test('returns false when no date fields present', () => {
    expect(isStale({ number: 1 }, 7, NOW)).toBe(false);
  });

  test('falls back to created_at when updated_at missing', () => {
    const pr = { number: 1, created_at: '2024-06-01T00:00:00Z' };
    expect(isStale(pr, 7, NOW)).toBe(true);
  });

  test('uses default threshold of 7 days', () => {
    const pr = makePR('2024-06-07T11:59:59Z');
    expect(isStale(pr, undefined, NOW)).toBe(true);
  });
});

describe('annotateStalePRs', () => {
  test('adds stale:true to old PRs', () => {
    const prs = [makePR('2024-06-01T00:00:00Z')];
    const result = annotateStalePRs(prs, 7, NOW);
    expect(result[0].stale).toBe(true);
  });

  test('adds stale:false to recent PRs', () => {
    const prs = [makePR('2024-06-14T00:00:00Z')];
    const result = annotateStalePRs(prs, 7, NOW);
    expect(result[0].stale).toBe(false);
  });

  test('does not mutate original PRs', () => {
    const pr = makePR('2024-06-01T00:00:00Z');
    annotateStalePRs([pr], 7, NOW);
    expect(pr.stale).toBeUndefined();
  });
});

describe('filterStalePRs', () => {
  test('returns only stale PRs', () => {
    const prs = [
      makePR('2024-06-01T00:00:00Z'),
      makePR('2024-06-14T00:00:00Z'),
    ];
    const result = filterStalePRs(prs, 7, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].updated_at).toBe('2024-06-01T00:00:00Z');
  });

  test('returns empty array when no stale PRs', () => {
    const prs = [makePR('2024-06-14T00:00:00Z')];
    expect(filterStalePRs(prs, 7, NOW)).toHaveLength(0);
  });
});
