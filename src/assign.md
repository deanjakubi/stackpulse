# Assignee Workload Report

The `assign` module provides insight into how open pull requests are distributed across team members.

## Usage

Run the assignee report from the CLI:

```bash
npx stackpulse assign
```

Output a machine-readable JSON summary:

```bash
npx stackpulse assign --json
```

Filtering flags (shared with other commands) are supported:

```bash
npx stackpulse assign --author alice --label bug
```

## Sample Output

```
Assignee Workload
──────────────────────────────────────────────────
  alice                      5  █████
  bob                        3  ███
  carol                      1  █
  (unassigned)               2  ██
```

## API

### `countByAssignee(prs) → Object`

Returns a map of `{ [login]: count }`. PRs with no assignees are counted under `'(unassigned)'`.

### `sortedAssignees(counts) → Array<{login, count}>`

Sorts the result of `countByAssignee` by count descending, then alphabetically.

### `formatAssigneeSummary(prs) → string`

Returns a formatted, human-readable summary string ready for `console.log`.
