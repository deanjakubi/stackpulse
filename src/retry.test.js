const { withRetry, isRetryable, backoffDelay } = require('./retry');

describe('backoffDelay', () => {
  it('returns base delay on attempt 0', () => {
    expect(backoffDelay(0, 100)).toBe(100);
  });

  it('doubles delay on each attempt', () => {
    expect(backoffDelay(1, 100)).toBe(200);
    expect(backoffDelay(2, 100)).toBe(400);
    expect(backoffDelay(3, 100)).toBe(800);
  });
});

describe('isRetryable', () => {
  it('returns true for 429', () => {
    expect(isRetryable({ statusCode: 429 })).toBe(true);
  });

  it('returns true for 500-level errors', () => {
    expect(isRetryable({ statusCode: 500 })).toBe(true);
    expect(isRetryable({ statusCode: 503 })).toBe(true);
  });

  it('returns false for 4xx errors (except 429)', () => {
    expect(isRetryable({ statusCode: 404 })).toBe(false);
    expect(isRetryable({ statusCode: 401 })).toBe(false);
  });

  it('returns true for network errors (no statusCode)', () => {
    expect(isRetryable(new Error('ECONNRESET'))).toBe(true);
  });

  it('returns false for null/undefined', () => {
    expect(isRetryable(null)).toBe(false);
  });
});

describe('withRetry', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('resolves immediately on success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 3, baseDelay: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable error and eventually succeeds', async () => {
    const err = Object.assign(new Error('server error'), { statusCode: 503 });
    const fn = jest.fn()
      .mockRejectedValueOnce(err)
      .mockRejectedValueOnce(err)
      .mockResolvedValue('recovered');

    const promise = withRetry(fn, { maxRetries: 3, baseDelay: 1 });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws immediately on non-retryable error', async () => {
    const err = Object.assign(new Error('not found'), { statusCode: 404 });
    const fn = jest.fn().mockRejectedValue(err);

    await expect(withRetry(fn, { maxRetries: 3, baseDelay: 1 })).rejects.toMatchObject({ statusCode: 404 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting retries', async () => {
    const err = Object.assign(new Error('gateway timeout'), { statusCode: 504 });
    const fn = jest.fn().mockRejectedValue(err);

    const promise = withRetry(fn, { maxRetries: 2, baseDelay: 1 });
    await jest.runAllTimersAsync();

    await expect(promise).rejects.toMatchObject({ statusCode: 504 });
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
