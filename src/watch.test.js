const { pollOnce, resetSnapshots, delay } = require('./watch');

functionePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    state: 'open',
    draft: false,
    user: { login: 'alice' },
    labels: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  resetSnapshots();
});

describe('delay', () => {
  it('resolves after approximately the given ms', async () => {
    const start = Date.now();
    await delay(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});

describe('pollOnce', () => {
  it('returns empty array when there are no changes on first poll', async () => {
    const fetchAllPRs = async () => ({ /repo': [makePR()] });
    const changed = await pollOnce(fetchAllPRs, ['org/repo']);
    // First poll — no previous snapshot, so notifyOnChanges finds no *changes*
    expect(Array.isArray(changed)).toBe(true);
  });

  it('detects a new PR added between polls', async () => {
    const pr1 = makePR({ number: 1, title: 'First2 = makePR({ number: 2, title: 'Second PR' });

    const fetchFirst = async () => ({ 'org/repo': [pr1] });
    const fetchSecond = async () => ({ 'org/repo': [pr1, pr2] });

    await pollOnce(fetchFirst, ['org/repo']);
    const changed = await pollOnce(fetchSecond, ['org/repo']);

    expect(changed.length).toBeGreaterThan(0);
    expect(changed[0].repo).toBe('org/repo');
    expect(changed[0].notifications.some((n) => /opened|new/i.test(n))).toBe(true);
  });

  it('detects a PR that was closedn    const pr = makePR({ number: 1, title: 'Closing PR', state: 'open' });
    const prClosed = makePR({ number: 1, title: 'Closing PR', state: 'closed' });

    const fetchOpen = async () => ({ 'org/repo': [pr] });
    const fetchClosed = async () => ({ 'org/repo': [prClosed] });

    await pollOnce(fetchOpen, ['org/repo']);
    const changed = await pollOnce(fetchClosed, ['org/repo']);

    expect(changed.length).toBeGreaterThan(0);
    expect(changed[0].notifications.some((n) => /closed/i.test(n))).toBe(true);
  });

  it('returns no changes when PRs are identical between polls', async () => {
    const pr = makePR({ number: 1 });
    const fetch = async () => ({ 'org/repo': [pr] });

    await pollOnce(fetch, ['org/repo']);
    const changed = await pollOnce(fetch, ['org/repo']);

    expect(changed).toEqual([]);
  });

  it('handles fetch errors gracefully by propagating them', async () => {
    const fetchBroken = async () => { throw new Error('network failure'); };
    await expect(pollOnce(fetchBroken, ['org/repo'])).rejects.toThrow('network failure');
  });

  it('logs notifications when verbose is true', async () => {
    const pr1 = makePR({ number: 1 });
    const pr2 = makePR({ number: 2, title: 'New PR' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await pollOnce(async () => ({ 'org/repo': [pr1] }), ['org/repo']);
    await pollOnce(async () => ({ 'org/repo': [pr1, pr2] }), ['org/repo'], { verbose: true });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
