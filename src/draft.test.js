const { isDraft, partitionDrafts, buildDraftSummary, formatDraftSummary } = require('./draft');

function makePR(overrides = {}) {
  return {
    number: 1,
    title: 'Test PR',
    draft: false,
    user: { login: 'alice' },
    ...overrides,
  };
}

describe('isDraft', () => {
  test('returns true for draft PRs', () => {
    expect(isDraft(makePR({ draft: true }))).toBe(true);
  });

  test('returns false for ready PRs', () => {
    expect(isDraft(makePR({ draft: false }))).toBe(false);
  });

  test('returns false when draft is undefined', () => {
    const pr = makePR();
    delete pr.draft;
    expect(isDraft(pr)).toBe(false);
  });
});

describe('partitionDrafts', () => {
  test('splits PRs correctly', () => {
    const prs = [
      makePR({ number: 1, draft: true }),
      makePR({ number: 2, draft: false }),
      makePR({ number: 3, draft: true }),
    ];
    const { drafts, ready } = partitionDrafts(prs);
    expect(drafts).toHaveLength(2);
    expect(ready).toHaveLength(1);
  });

  test('handles empty list', () => {
    const { drafts, ready } = partitionDrafts([]);
    expect(drafts).toHaveLength(0);
    expect(ready).toHaveLength(0);
  });
});

describe('buildDraftSummary', () => {
  test('computes correct counts and percentage', () => {
    const prs = [
      makePR({ draft: true }),
      makePR({ draft: true }),
      makePR({ draft: false }),
      makePR({ draft: false }),
    ];
    const summary = buildDraftSummary(prs);
    expect(summary.total).toBe(4);
    expect(summary.draftCount).toBe(2);
    expect(summary.readyCount).toBe(2);
    expect(summary.draftPct).toBe(50);
  });

  test('handles zero PRs without dividing by zero', () => {
    const summary = buildDraftSummary([]);
    expect(summary.draftPct).toBe(0);
    expect(summary.total).toBe(0);
  });
});

describe('formatDraftSummary', () => {
  test('returns message for empty list', () => {
    const summary = buildDraftSummary([]);
    expect(formatDraftSummary(summary)).toBe('No PRs found.');
  });

  test('includes draft PR details when drafts exist', () => {
    const prs = [
      makePR({ number: 42, title: 'WIP feature', draft: true, user: { login: 'bob' } }),
      makePR({ number: 43, draft: false }),
    ];
    const summary = buildDraftSummary(prs);
    const output = formatDraftSummary(summary);
    expect(output).toContain('#42 WIP feature — bob');
    expect(output).toContain('Draft PRs: 1 / 2 (50%)');
  });

  test('does not include draft section when no drafts', () => {
    const prs = [makePR({ draft: false })];
    const summary = buildDraftSummary(prs);
    const output = formatDraftSummary(summary);
    expect(output).not.toContain('Draft PRs:');
  });
});
