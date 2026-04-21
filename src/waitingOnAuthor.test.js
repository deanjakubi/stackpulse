const {
  isWaitingOnAuthor,
  partitionWaiting,
  annotateWaiting,
  buildWaitingSummary,
  formatWaitingSummary,
} = require('./waitingOnAuthor');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    user: { login: 'alice' },
    labels: [],
    reviews: [],
    ...overrides,
  };
}

describe('isWaitingOnAuthor', () => {
  it('returns false for a clean PR', () => {
    expect(isWaitingOnAuthor(makePR())).toBe(false);
  });

  it('returns true when a CHANGES_REQUESTED review exists', () => {
    const pr = makePR({ reviews: [{ state: 'CHANGES_REQUESTED' }] });
    expect(isWaitingOnAuthor(pr)).toBe(true);
  });

  it('returns true when waiting-on-author label is present', () => {
    const pr = makePR({ labels: [{ name: 'waiting-on-author' }] });
    expect(isWaitingOnAuthor(pr)).toBe(true);
  });

  it('returns true for needs-update label', () => {
    const pr = makePR({ labels: [{ name: 'needs-update' }] });
    expect(isWaitingOnAuthor(pr)).toBe(true);
  });

  it('returns false for unrelated labels', () => {
    const pr = makePR({ labels: [{ name: 'bug' }] });
    expect(isWaitingOnAuthor(pr)).toBe(false);
  });
});

describe('partitionWaiting', () => {
  it('splits PRs into waiting and other', () => {
    const a = makePR({ number: 1, reviews: [{ state: 'CHANGES_REQUESTED' }] });
    const b = makePR({ number: 2 });
    const { waiting, other } = partitionWaiting([a, b]);
    expect(waiting).toHaveLength(1);
    expect(other).toHaveLength(1);
    expect(waiting[0].number).toBe(1);
  });
});

describe('annotateWaiting', () => {
  it('adds waitingOnAuthor flag to each PR', () => {
    const prs = [
      makePR({ reviews: [{ state: 'CHANGES_REQUESTED' }] }),
      makePR(),
    ];
    const result = annotateWaiting(prs);
    expect(result[0].waitingOnAuthor).toBe(true);
    expect(result[1].waitingOnAuthor).toBe(false);
  });
});

describe('buildWaitingSummary', () => {
  it('returns correct counts', () => {
    const prs = [
      makePR({ user: { login: 'alice' }, reviews: [{ state: 'CHANGES_REQUESTED' }] }),
      makePR({ user: { login: 'alice' }, reviews: [{ state: 'CHANGES_REQUESTED' }] }),
      makePR({ user: { login: 'bob' } }),
    ];
    const summary = buildWaitingSummary(prs);
    expect(summary.waitingCount).toBe(2);
    expect(summary.activeCount).toBe(1);
    expect(summary.byAuthor['alice']).toBe(2);
  });
});

describe('formatWaitingSummary', () => {
  it('formats a readable string', () => {
    const summary = { waitingCount: 2, total: 5, byAuthor: { alice: 2 } };
    const out = formatWaitingSummary(summary);
    expect(out).toContain('Waiting on author: 2 / 5');
    expect(out).toContain('alice: 2');
  });
});
