'use strict';

const {
  computePRScore,
  classifyScore,
  annotatePRScore,
  sortByScore,
  buildScoreSummary,
  formatScoreSummary,
} = require('./prScore');

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    created_at: daysAgo(5),
    comments: 0,
    additions: 10,
    deletions: 5,
    draft: false,
    reviews: [],
    ...overrides,
  };
}

describe('computePRScore', () => {
  test('old PR with no comments scores higher than new active PR', () => {
    const old = makePR({ created_at: daysAgo(25), comments: 0 });
    const fresh = makePR({ created_at: daysAgo(1), comments: 5 });
    expect(computePRScore(old)).toBeGreaterThan(computePRScore(fresh));
  });

  test('draft PR scores lower than non-draft equivalent', () => {
    const draft = makePR({ draft: true });
    const open = makePR({ draft: false });
    expect(computePRScore(draft)).toBeLessThan(computePRScore(open));
  });

  test('large PR (>500 changes) adds 20 points vs tiny PR', () => {
    const large = makePR({ additions: 400, deletions: 200 });
    const small = makePR({ additions: 5, deletions: 2 });
    expect(computePRScore(large) - computePRScore(small)).toBe(20);
  });

  test('approved PR scores higher than unapproved', () => {
    const approved = makePR({ reviews: [{ state: 'APPROVED' }] });
    const none = makePR({ reviews: [] });
    expect(computePRScore(approved)).toBeGreaterThan(computePRScore(none));
  });

  test('returns a number', () => {
    expect(typeof computePRScore(makePR())).toBe('number');
  });
});

describe('classifyScore', () => {
  test('critical at 60+', () => expect(classifyScore(65)).toBe('critical'));
  test('high at 40-59', () => expect(classifyScore(45)).toBe('high'));
  test('medium at 20-39', () => expect(classifyScore(25)).toBe('medium'));
  test('low below 20', () => expect(classifyScore(10)).toBe('low'));
});

describe('annotatePRScore', () => {
  test('adds _score and _priority to each PR', () => {
    const prs = [makePR({ number: 1 }), makePR({ number: 2 })];
    const result = annotatePRScore(prs);
    expect(result[0]).toHaveProperty('_score');
    expect(result[0]).toHaveProperty('_priority');
  });

  test('does not mutate originals', () => {
    const pr = makePR();
    annotatePRScore([pr]);
    expect(pr).not.toHaveProperty('_score');
  });
});

describe('sortByScore', () => {
  test('sorts descending by _score', () => {
    const prs = [
      { ...makePR(), _score: 10 },
      { ...makePR(), _score: 50 },
      { ...makePR(), _score: 30 },
    ];
    const sorted = sortByScore(prs);
    expect(sorted.map((p) => p._score)).toEqual([50, 30, 10]);
  });
});

describe('buildScoreSummary', () => {
  test('returns annotated list and bands object', () => {
    const prs = [makePR({ number: 1 }), makePR({ number: 2 })];
    const summary = buildScoreSummary(prs);
    expect(summary).toHaveProperty('annotated');
    expect(summary).toHaveProperty('bands');
    expect(Object.keys(summary.bands)).toEqual(['critical', 'high', 'medium', 'low']);
  });
});

describe('formatScoreSummary', () => {
  test('includes header and band labels', () => {
    const prs = [makePR({ number: 42, title: 'My PR', created_at: daysAgo(20) })];
    const summary = buildScoreSummary(prs);
    const output = formatScoreSummary(summary);
    expect(output).toMatch('PR Priority Score Summary');
    expect(output).toMatch('#42');
  });
});
