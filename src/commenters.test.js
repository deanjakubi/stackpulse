'use strict';

const {
  collectCommenters,
  countByCommenter,
  sortedCommenters,
  buildCommenterSummary,
  formatCommenterSummary,
} = require('./commenters');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    comments: [],
    review_comments: [],
    ...overrides,
  };
}

function makeComment(login) {
  return { user: { login } };
}

describe('collectCommenters', () => {
  test('returns empty array when no comments', () => {
    const pr = makePR();
    expect(collectCommenters(pr)).toEqual([]);
  });

  test('collects logins from comments and review_comments', () => {
    const pr = makePR({
      comments: [makeComment('alice'), makeComment('bob')],
      review_comments: [makeComment('carol')],
    });
    const result = collectCommenters(pr);
    expect(result).toContain('alice');
    expect(result).toContain('bob');
    expect(result).toContain('carol');
    expect(result.length).toBe(3);
  });

  test('deduplicates commenters within a PR', () => {
    const pr = makePR({
      comments: [makeComment('alice'), makeComment('alice')],
      review_comments: [makeComment('alice')],
    });
    expect(collectCommenters(pr)).toEqual(['alice']);
  });
});

describe('countByCommenter', () => {
  test('counts across multiple PRs', () => {
    const prs = [
      makePR({ comments: [makeComment('alice')] }),
      makePR({ comments: [makeComment('alice'), makeComment('bob')] }),
    ];
    const counts = countByCommenter(prs);
    expect(counts['alice']).toBe(2);
    expect(counts['bob']).toBe(1);
  });

  test('returns empty object for empty prs', () => {
    expect(countByCommenter([])).toEqual({});
  });
});

describe('sortedCommenters', () => {
  test('sorts by count descending', () => {
    const counts = { alice: 3, bob: 7, carol: 1 };
    const sorted = sortedCommenters(counts);
    expect(sorted[0].login).toBe('bob');
    expect(sorted[1].login).toBe('alice');
    expect(sorted[2].login).toBe('carol');
  });
});

describe('buildCommenterSummary', () => {
  test('returns correct totals', () => {
    const prs = [
      makePR({ comments: [makeComment('alice'), makeComment('bob')] }),
      makePR({ review_comments: [makeComment('alice')] }),
    ];
    const summary = buildCommenterSummary(prs);
    expect(summary.unique).toBe(2);
    expect(summary.total).toBe(3);
  });
});

describe('formatCommenterSummary', () => {
  test('includes header and commenter lines', () => {
    const summary = buildCommenterSummary([
      makePR({ comments: [makeComment('alice')] }),
    ]);
    const output = formatCommenterSummary(summary);
    expect(output).toContain('Top commenters:');
    expect(output).toContain('alice');
  });

  test('handles empty summary gracefully', () => {
    const summary = buildCommenterSummary([]);
    const output = formatCommenterSummary(summary);
    expect(output).toContain('No commenters found.');
  });
});
