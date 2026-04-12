const {
  isDependabot,
  partitionDependabot,
  buildDependabotSummary,
  formatDependabotSummary,
} = require('./dependabot');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'chore: some change',
    state: 'open',
    merged_at: null,
    user: { login: 'alice' },
    ...overrides,
  };
}

describe('isDependabot', () => {
  it('detects dependabot[bot] login', () => {
    expect(isDependabot(makePR({ user: { login: 'dependabot[bot]' } }))).toBe(true);
  });

  it('detects bump title', () => {
    expect(isDependabot(makePR({ title: 'Bump lodash from 4.17.20 to 4.17.21' }))).toBe(true);
  });

  it('detects update title', () => {
    expect(isDependabot(makePR({ title: 'Update actions/checkout to v4' }))).toBe(true);
  });

  it('returns false for normal PR', () => {
    expect(isDependabot(makePR())).toBe(false);
  });
});

describe('partitionDependabot', () => {
  const prs = [
    makePR({ number: 1, user: { login: 'dependabot[bot]' } }),
    makePR({ number: 2 }),
    makePR({ number: 3, title: 'Bump axios to 1.0.0' }),
  ];

  it('puts bot PRs in bot array', () => {
    const { bot } = partitionDependabot(prs);
    expect(bot.map(p => p.number)).toEqual([1, 3]);
  });

  it('puts human PRs in human array', () => {
    const { human } = partitionDependabot(prs);
    expect(human.map(p => p.number)).toEqual([2]);
  });
});

describe('buildDependabotSummary', () => {
  const prs = [
    makePR({ user: { login: 'dependabot[bot]' }, state: 'open' }),
    makePR({ user: { login: 'dependabot[bot]' }, state: 'closed', merged_at: '2024-01-01T00:00:00Z' }),
    makePR({ user: { login: 'dependabot[bot]' }, state: 'closed', merged_at: null }),
    makePR({ state: 'open' }),
  ];

  it('counts totals correctly', () => {
    const s = buildDependabotSummary(prs);
    expect(s.total).toBe(3);
    expect(s.open).toBe(1);
    expect(s.merged).toBe(1);
    expect(s.closed).toBe(1);
    expect(s.humanTotal).toBe(1);
  });
});

describe('formatDependabotSummary', () => {
  it('includes key labels', () => {
    const summary = { total: 5, open: 2, merged: 2, closed: 1, humanTotal: 10 };
    const out = formatDependabotSummary(summary);
    expect(out).toContain('Total bot PRs : 5');
    expect(out).toContain('Open          : 2');
    expect(out).toContain('Human PRs     : 10');
  });
});
