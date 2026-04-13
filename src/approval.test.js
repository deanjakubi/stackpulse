'use strict';

const {
  getApprovalState,
  countByApprovalState,
  annotateApproval,
  buildApprovalSummary,
  formatApprovalSummary,
} = require('./approval');

function makePR(reviews = []) {
  return { number: 1, title: 'Test PR', reviews };
}

describe('getApprovalState', () => {
  test('no reviews → no_reviews', () => {
    expect(getApprovalState(makePR([]))).toBe('no_reviews');
  });

  test('one approval → needs_one_more', () => {
    expect(getApprovalState(makePR([{ state: 'APPROVED' }]))).toBe('needs_one_more');
  });

  test('two approvals → approved', () => {
    const reviews = [{ state: 'APPROVED' }, { state: 'APPROVED' }];
    expect(getApprovalState(makePR(reviews))).toBe('approved');
  });

  test('changes requested overrides approvals', () => {
    const reviews = [{ state: 'APPROVED' }, { state: 'CHANGES_REQUESTED' }];
    expect(getApprovalState(makePR(reviews))).toBe('changes_requested');
  });
});

describe('countByApprovalState', () => {
  test('counts each state correctly', () => {
    const prs = [
      makePR([]),
      makePR([{ state: 'APPROVED' }]),
      makePR([{ state: 'APPROVED' }, { state: 'APPROVED' }]),
      makePR([{ state: 'CHANGES_REQUESTED' }]),
    ];
    const counts = countByApprovalState(prs);
    expect(counts.no_reviews).toBe(1);
    expect(counts.needs_one_more).toBe(1);
    expect(counts.approved).toBe(1);
    expect(counts.changes_requested).toBe(1);
  });
});

describe('annotateApproval', () => {
  test('adds approvalState field to each PR', () => {
    const prs = [makePR([]), makePR([{ state: 'APPROVED' }, { state: 'APPROVED' }])];
    const annotated = annotateApproval(prs);
    expect(annotated[0].approvalState).toBe('no_reviews');
    expect(annotated[1].approvalState).toBe('approved');
  });

  test('does not mutate original PRs', () => {
    const pr = makePR([]);
    annotateApproval([pr]);
    expect(pr.approvalState).toBeUndefined();
  });
});

describe('buildApprovalSummary', () => {
  test('returns correct totals', () => {
    const prs = [makePR([]), makePR([{ state: 'APPROVED' }, { state: 'APPROVED' }])];
    const summary = buildApprovalSummary(prs);
    expect(summary.total).toBe(2);
    expect(summary.approved).toBe(1);
    expect(summary.noReviews).toBe(1);
  });
});

describe('formatApprovalSummary', () => {
  test('contains key headings', () => {
    const summary = { total: 5, approved: 2, needsOneMore: 1, changesRequested: 1, noReviews: 1 };
    const output = formatApprovalSummary(summary);
    expect(output).toContain('Approval Summary');
    expect(output).toContain('Approved (2+):');
    expect(output).toContain('Changes requested:');
    expect(output).toContain('Total:');
  });
});
