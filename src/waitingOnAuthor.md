# Waiting on Author

The `waiting-on-author` module identifies pull requests where the ball is in the author's court — either because a reviewer has requested changes or a relevant label has been applied.

## Detection Logic

A PR is classified as **waiting on author** when any of the following is true:

- One or more reviews have a state of `CHANGES_REQUESTED`
- The PR has one of the following labels: `waiting-on-author`, `changes-requested`, `needs-update`

## Usage

```bash
# Show all PRs waiting on author
npx stackpulse waiting

# Filter by author
npx stackpulse waiting --author alice

# Exclude drafts
npx stackpulse waiting --no-drafts
```

## Output

The report lists each matching PR with its number, title, repo, and author. A summary at the bottom shows the total count and a breakdown by author.

```
PRs Waiting on Author
────────────────────────────────────────────────────────────
#101 Fix login regression  [org/frontend] @alice
#204 Update API docs       [org/backend]  @bob
────────────────────────────────────────────────────────────
Waiting on author: 2 / 10 PRs
  alice: 1
  bob: 1
```

## API

### `isWaitingOnAuthor(pr) → boolean`
Returns `true` if the PR is waiting on the author.

### `partitionWaiting(prs) → { waiting, other }`
Splits an array of PRs into those waiting on author and the rest.

### `annotateWaiting(prs) → prs`
Adds a `waitingOnAuthor` boolean field to each PR object.

### `buildWaitingSummary(prs) → summary`
Returns an object with `waitingCount`, `activeCount`, `total`, `byAuthor`, and `waitingPRs`.

### `formatWaitingSummary(summary) → string`
Formats the summary as a human-readable string.
