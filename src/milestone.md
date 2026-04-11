# Milestone Report

The `milestone` feature groups pull requests by their GitHub milestone and produces a concise summary report.

## Usage

Run the milestone report from the CLI:

```bash
npx stackpulse milestone
```

Optional filter flags (same as other commands):

```bash
npx stackpulse milestone --author octocat --label bug
```

## Output

```
Milestone Report
================
(no milestone): 4 PRs  [open: 3  closed: 1  drafts: 1]
v1.0: 6 PRs  [open: 2  closed: 4  drafts: 0]
v2.0: 2 PRs  [open: 2  closed: 0  drafts: 1]
```

## Module API

### `getMilestone(pr) → string|null`
Returns the milestone title for a PR, or `null` if none is set.

### `groupByMilestone(prs) → Map<string, PR[]>`
Groups an array of PRs by milestone title. PRs without a milestone use the key `__none__`.

### `buildMilestoneSummary(title, prs) → object`
Builds a summary object `{ title, total, open, closed, drafts }` for a group of PRs.

### `buildMilestoneReport(prs) → object[]`
Builds and sorts summaries for all milestones found in the given PRs.

### `formatMilestoneReport(summaries) → string`
Formats the summaries array into a human-readable string.

## Caching

PR data is cached for **2 minutes** per repo to avoid redundant API calls.
