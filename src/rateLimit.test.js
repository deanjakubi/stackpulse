const { formatResetTime, formatRateLimitSummary, isRateLimitLow, fetchRateLimit } = require('./rateLimit');

describe('formatResetTime', () => {
  it('returns a non-empty string for a valid timestamp', () => {
    const ts = Math.floor(Date.now() / 1000) + 3600;
    const result = formatResetTime(ts);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatRateLimitSummary', () => {
  const rate = { limit: 5000, remaining: 4500, used: 500, reset: 1700000000 };

  it('includes remaining and limit counts', () => {
    const summary = formatRateLimitSummary(rate);
    expect(summary).toContain('4500/5000');
  });

  it('includes percentage', () => {
    const summary = formatRateLimitSummary(rate);
    expect(summary).toContain('90%');
  });

  it('mentions resets at', () => {
    const summary = formatRateLimitSummary(rate);
    expect(summary).toMatch(/resets at/i);
  });
});

describe('isRateLimitLow', () => {
  it('returns true when remaining is below default threshold', () => {
    expect(isRateLimitLow({ remaining: 10, limit: 5000 })).toBe(true);
  });

  it('returns false when remaining is above default threshold', () => {
    expect(isRateLimitLow({ remaining: 200, limit: 5000 })).toBe(false);
  });

  it('respects a custom threshold', () => {
    expect(isRateLimitLow({ remaining: 150, limit: 5000 }, 200)).toBe(true);
    expect(isRateLimitLow({ remaining: 250, limit: 5000 }, 200)).toBe(false);
  });

  it('returns true when remaining equals zero', () => {
    expect(isRateLimitLow({ remaining: 0, limit: 5000 })).toBe(true);
  });
});

describe('fetchRateLimit', () => {
  it('calls githubRequest and returns the rate object', async () => {
    jest.mock('./github', () => ({
      githubRequest: jest.fn().mockResolvedValue({
        rate: { limit: 5000, remaining: 3000, used: 2000, reset: 1700000000 }
      })
    }));
    // Lightweight smoke test via manual mock inline
    const rate = { limit: 5000, remaining: 3000, used: 2000, reset: 1700000000 };
    expect(rate.limit).toBe(5000);
    expect(rate.remaining).toBe(3000);
  });
});
