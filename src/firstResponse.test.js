'use strict';

const {
  daysBetween,
  getFirstResponseDate,
  classifyResponseTime,
  annotateFirstResponse,
  buildFirstResponseSummary,
  formatFirstResponseSummary,
} = require('./firstResponse');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    created_at: '2024-01-01T00:00:00Z',
    review_comments_dates: [],
    review_dates: [],
    ...overrides,
  };
}

describe('daysBetween', () => {
  it('returns 0 for same date', () => {
    expect(daysBetween('2024-01-01', '2024-01-01')).toBe(0);
  });

  it('returns correct days', () => {
    expect(daysBetween('2024-01-01', '2024-01-04')).toBeCloseTo(3);
  });
});

describe('getFirstResponseDate', () => {
  it('returns null when no events', () => {
    const pr = makePR();
    expect(getFirstResponseDate(pr)).toBeNull();
  });

  it('returns earliest date across review and comment dates', () => {
    const pr = makePR({
      review_comments_dates: ['2024-01-05T00:00:00Z'],
      review_dates: ['2024-01-03T00:00:00Z'],
    });
    expect(getFirstResponseDate(pr)).toBe('2024-01-03T00:00:00Z');
  });
});

describe('classifyResponseTime', () => {
  it('returns none for null', () => expect(classifyResponseTime(null)).toBe('none'));
  it('returns fast for <1 day', () => expect(classifyResponseTime(0.5)).toBe('fast'));
  it('returns moderate for 1-3 days', () => expect(classifyResponseTime(2)).toBe('moderate'));
  it('returns slow for >3 days', () => expect(classifyResponseTime(5)).toBe('slow'));
});

describe('annotateFirstResponse', () => {
  it('annotates PR with no response', () => {
    const [pr] = annotateFirstResponse([makePR()]);
    expect(pr.firstResponseDays).toBeNull();
    expect(pr.firstResponseClass).toBe('none');
  });

  it('annotates PR with fast response', () => {
    const pr = makePR({ review_dates: ['2024-01-01T06:00:00Z'] });
    const [annotated] = annotateFirstResponse([pr]);
    expect(annotated.firstResponseClass).toBe('fast');
  });
});

describe('buildFirstResponseSummary', () => {
  it('returns zero avg when no responses', () => {
    const summary = buildFirstResponseSummary([makePR(), makePR({ number: 2 })]);
    expect(summary.avgDays).toBeNull();
    expect(summary.counts.none).toBe(2);
    expect(summary.total).toBe(2);
  });

  it('calculates average correctly', () => {
    const prs = [
      makePR({ review_dates: ['2024-01-02T00:00:00Z'] }),
      makePR({ number: 2, review_dates: ['2024-01-04T00:00:00Z'] }),
    ];
    const summary = buildFirstResponseSummary(prs);
    expect(summary.avgDays).toBeCloseTo(2);
    expect(summary.responded).toBe(2);
  });
});

describe('formatFirstResponseSummary', () => {
  it('includes avg and counts in output', () => {
    const summary = buildFirstResponseSummary([
      makePR({ review_dates: ['2024-01-02T00:00:00Z'] }),
    ]);
    const out = formatFirstResponseSummary(summary);
    expect(out).toContain('First Response Summary');
    expect(out).toContain('Avg response time');
    expect(out).toContain('Fast');
  });

  it('shows N/A when no responses', () => {
    const summary = buildFirstResponseSummary([makePR()]);
    expect(formatFirstResponseSummary(summary)).toContain('N/A');
  });
});
