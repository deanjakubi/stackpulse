const {
  classifyReadiness,
  annotateReadiness,
  groupByReadiness,
  buildReadinessSummary,
  formatReadinessSummary,
} = require('./readiness');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    draft: false,
    mergeable_state: 'clean',
    reviews: [],
    check_runs: [],
    ...overrides,
  };
}

describe('classifyReadiness', () => {
  it('returns draft for draft PRs', () => {
    expect(classifyReadiness(makePR({ draft: true }))).toBe('draft');
  });

  it('returns blocked when mergeable_state is dirty', () => {
    expect(classifyReadiness(makePR({ mergeable_state: 'dirty' }))).toBe('blocked');
  });

  it('returns blocked when changes requested', () => {
    const pr = makePR({ reviews: [{ state: 'CHANGES_REQUESTED', user: { login: 'a' } }] });
    expect(classifyReadiness(pr)).toBe('blocked');
  });

  it('returns blocked when checks fail', () => {
    const pr = makePR({ check_runs: [{ conclusion: 'failure' }] });
    expect(classifyReadiness(pr)).toBe('blocked');
  });

  it('returns ready when approved and checks pass', () => {
    const pr = makePR({
      reviews: [{ state: 'APPROVED', user: { login: 'a' } }],
      check_runs: [{ conclusion: 'success' }],
    });
    expect(classifyReadiness(pr)).toBe('ready');
  });

  it('returns pending when no reviews yet', () => {
    expect(classifyReadiness(makePR())).toBe('pending');
  });
});

describe('annotateReadiness', () => {
  it('adds readiness field to each PR', () => {
    const prs = [makePR({ draft: true }), makePR()];
    const result = annotateReadiness(prs);
    expect(result[0].readiness).toBe('draft');
    expect(result[1].readiness).toBe('pending');
  });
});

describe('groupByReadiness', () => {
  it('groups PRs by readiness state', () => {
    const prs = [
      makePR({ draft: true }),
      makePR({ mergeable_state: 'dirty' }),
      makePR(),
    ];
    const groups = groupByReadiness(prs);
    expect(groups.draft).toHaveLength(1);
    expect(groups.blocked).toHaveLength(1);
    expect(groups.pending).toHaveLength(1);
  });
});

describe('buildReadinessSummary', () => {
  it('returns correct counts', () => {
    const prs = [makePR({ draft: true }), makePR(), makePR()];
    const summary = buildReadinessSummary(prs);
    expect(summary.total).toBe(3);
    expect(summary.draft).toBe(1);
    expect(summary.pending).toBe(2);
  });
});

describe('formatReadinessSummary', () => {
  it('includes all state labels', () => {
    const summary = { total: 4, ready: 1, blocked: 1, pending: 1, draft: 1 };
    const output = formatReadinessSummary(summary);
    expect(output).toContain('Ready');
    expect(output).toContain('Blocked');
    expect(output).toContain('Pending');
    expect(output).toContain('Draft');
    expect(output).toContain('4 PRs');
  });
});
