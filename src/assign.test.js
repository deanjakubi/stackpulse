const { countByAssignee, sortedAssignees, formatAssigneeSummary } = require('./assign');

function makePR(assignees = []) {
  return {
    number: 1,
    title: 'Test PR',
    assignees: assignees.map(login => ({ login }))
  };
}

describe('countByAssignee', () => {
  test('counts PRs per assignee', () => {
    const prs = [makePR(['alice']), makePR(['alice']), makePR(['bob'])];
    expect(countByAssignee(prs)).toEqual({ alice: 2, bob: 1 });
  });

  test('groups unassigned PRs', () => {
    const prs = [makePR([]), makePR([])];
    expect(countByAssignee(prs)).toEqual({ '(unassigned)': 2 });
  });

  test('handles multiple assignees per PR', () => {
    const prs = [makePR(['alice', 'bob'])];
    expect(countByAssignee(prs)).toEqual({ alice: 1, bob: 1 });
  });

  test('returns empty object for no PRs', () => {
    expect(countByAssignee([])).toEqual({});
  });
});

describe('sortedAssignees', () => {
  test('sorts by count descending', () => {
    const counts = { alice: 3, bob: 5, carol: 1 };
    const result = sortedAssignees(counts);
    expect(result.map(r => r.login)).toEqual(['bob', 'alice', 'carol']);
  });

  test('breaks ties alphabetically', () => {
    const counts = { zara: 2, alice: 2 };
    const result = sortedAssignees(counts);
    expect(result.map(r => r.login)).toEqual(['alice', 'zara']);
  });

  test('returns empty array for empty counts', () => {
    expect(sortedAssignees({})).toEqual([]);
  });
});

describe('formatAssigneeSummary', () => {
  test('returns no-PRs message for empty list', () => {
    expect(formatAssigneeSummary([])).toBe('No PRs found.');
  });

  test('includes header and assignee lines', () => {
    const prs = [makePR(['alice']), makePR(['alice']), makePR(['bob'])];
    const output = formatAssigneeSummary(prs);
    expect(output).toContain('Assignee Workload');
    expect(output).toContain('alice');
    expect(output).toContain('bob');
  });

  test('alice appears before bob (higher count)', () => {
    const prs = [makePR(['alice']), makePR(['alice']), makePR(['bob'])];
    const output = formatAssigneeSummary(prs);
    expect(output.indexOf('alice')).toBeLessThan(output.indexOf('bob'));
  });
});
