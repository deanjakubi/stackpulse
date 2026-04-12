# Draft PR Report

The `draft` module provides utilities for identifying, partitioning, and summarising **draft** pull requests across all configured repositories.

## Usage

```bash
node src/draftCli.js
```

## Output Example

```
Draft PRs: 2 / 7 (28%)
Ready PRs: 5

Draft PRs:
  #12 WIP: refactor auth — alice
  #18 Draft: new dashboard layout — carol
```

## API

### `isDraft(pr) → boolean`

Returns `true` when the given PR object has `draft: true`.

### `partitionDrafts(prs) → { drafts, ready }`

Splits an array of PR objects into two buckets: `drafts` and `ready`.

### `buildDraftSummary(prs) → object`

Returns a summary object with the following fields:

| Field | Description |
|-------|-------------|
| `total` | Total number of PRs |
| `draftCount` | Number of draft PRs |
| `readyCount` | Number of ready PRs |
| `draftPct` | Percentage of PRs that are drafts |
| `drafts` | Array of draft PR objects |
| `ready` | Array of ready PR objects |

### `formatDraftSummary(summary) → string`

Formats the summary object as a human-readable string suitable for terminal output.

## Configuration

No additional configuration is required. The report respects all standard `filter` options (labels, author, draft exclusion) defined in your `stackpulse.config.json`.
