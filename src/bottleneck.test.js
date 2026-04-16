const { bottleneckScore, classifyBottleneck, annotateBottleneck, buildBottleneckSummary, formatBottleneckSummary } = require('./bottleneck');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    comments: 0,
    requested_reviewers: [],
    ...overrides
  };
}

describe('classifyBottleneck', () => {
  it('returns critical for score >= 40', () => expect(classifyBottleneck(40)).toBe('critical'));
  it('returns high for score >= 20', () => expect(classifyBottleneck(25)).toBe('high'));
  it('returns medium for score >= 10', () => expect(classifyBottleneck(15)).toBe('medium'));
  it('returns low for score < 10', () => expect(classifyBottleneck(5)).toBe('low'));
});

describe('bottleneckScore', () => {
  it('adds penalty for no reviewers', () => {
    const pr = makePR({ requested_reviewers: [] });
    const score = bottleneckScore(pr);
    expect(score).toBeGreaterThanOrEqual(10);
  });

  it('adds comment weight', () => {
    const pr1 = makePR({ comments: 0 });
    const pr2 = makePR({ comments: 5 });
    expect(bottleneckScore(pr2)).toBeGreaterThan(bottleneckScore(pr1));
  });
});

describe('annotateBottleneck', () => {
  it('adds bottleneckScore and bottleneckLevel', () => {
    const prs = [makePR()];
    const result = annotateBottleneck(prs);
    expect(result[0]).toHaveProperty('bottleneckScore');
    expect(result[0]).toHaveProperty('bottleneckLevel');
  });
});

describe('buildBottleneckSummary', () => {
  it('returns groups and total', () => {
    const prs = [makePR(), makePR({ comments: 20, created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() })];
    const summary = buildBottleneckSummary(prs);
    expect(summary.total).toBe(2);
    expect(summary.groups).toHaveProperty('critical');
  });
});

describe('formatBottleneckSummary', () => {
  it('formats output string', () => {
    const prs = [makePR()];
    const summary = buildBottleneckSummary(prs);
    const out = formatBottleneckSummary(summary);
    expect(out).toContain('Bottleneck Report');
  });
});
