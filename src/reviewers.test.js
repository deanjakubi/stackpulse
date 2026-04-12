// reviewers.test.js

const {
  countByReviewer,
  sortedReviewers,
  formatReviewerSummary,
} = require('./reviewers');

function makePR(reviewers = []) {
  return {
    number: 1,
    title: 'Test PR',
    requested_reviewers: reviewers.map((login) => ({ login })),
  };
}

describe('countByReviewer', () => {
  test('returns empty object for no PRs', () => {
    expect(countByReviewer([])).toEqual({});
  });

  test('counts single reviewer across multiple PRs', () => {
    const prs = [makePR(['alice']), makePR(['alice']), makePR(['bob'])];
    expect(countByReviewer(prs)).toEqual({ alice: 2, bob: 1 });
  });

  test('counts multiple reviewers on one PR', () => {
    const prs = [makePR(['alice', 'bob'])];
    expect(countByReviewer(prs)).toEqual({ alice: 1, bob: 1 });
  });

  test('ignores PRs with no requested reviewers', () => {
    const prs = [makePR([]), makePR(['carol'])];
    expect(countByReviewer(prs)).toEqual({ carol: 1 });
  });

  test('handles missing requested_reviewers field gracefully', () => {
    const prs = [{ number: 2, title: 'No reviewers field' }];
    expect(countByReviewer(prs)).toEqual({});
  });
});

describe('sortedReviewers', () => {
  test('returns empty array for empty counts', () => {
    expect(sortedReviewers({})).toEqual([]);
  });

  test('sorts by count descending', () => {
    const counts = { alice: 3, bob: 5, carol: 1 };
    const result = sortedReviewers(counts);
    expect(result.map((r) => r.login)).toEqual(['bob', 'alice', 'carol']);
  });

  test('sorts alphabetically when counts are equal', () => {
    const counts = { zara: 2, alice: 2 };
    const result = sortedReviewers(counts);
    expect(result.map((r) => r.login)).toEqual(['alice', 'zara']);
  });
});

describe('formatReviewerSummary', () => {
  test('returns message when no reviewers', () => {
    expect(formatReviewerSummary([])).toBe('No review requests found.');
  });

  test('includes header line', () => {
    const sorted = [{ login: 'alice', count: 3 }];
    const output = formatReviewerSummary(sorted);
    expect(output).toContain('Reviewer Requests:');
  });

  test('includes reviewer login and count', () => {
    const sorted = [{ login: 'alice', count: 3 }, { login: 'bob', count: 1 }];
    const output = formatReviewerSummary(sorted);
    expect(output).toContain('alice');
    expect(output).toContain('3');
    expect(output).toContain('bob');
    expect(output).toContain('1');
  });

  test('uses singular PR label for count of 1', () => {
    const sorted = [{ login: 'alice', count: 1 }];
    const output = formatReviewerSummary(sorted);
    expect(output).toMatch(/1 PR[^s]/);
  });

  test('uses plural PRs label for count > 1', () => {
    const sorted = [{ login: 'alice', count: 4 }];
    const output = formatReviewerSummary(sorted);
    expect(output).toContain('4 PRs');
  });
});
