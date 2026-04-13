# Readiness Report

The **readiness** feature classifies each open PR by its merge-readiness state, giving you a quick overview of what is ready to land, what is blocked, and what still needs attention.

## States

| State     | Meaning                                                        |
|-----------|----------------------------------------------------------------|
| `ready`   | Approved + all checks passing + no conflicts                   |
| `pending` | Awaiting review or check results                               |
| `blocked` | Has merge conflicts, failing checks, or changes requested      |
| `draft`   | Marked as a draft — not ready for review                       |

## Usage

```bash
# Show readiness report for all configured repos
npx stackpulse readiness

# Filter by author
npx stackpulse readiness --author alice

# Filter by label
npx stackpulse readiness --label feature
```

## Output Example

```
READY
  #42 [org/frontend] Add dark mode toggle

PENDING
  #38 [org/api] Refactor auth middleware

BLOCKED
  #35 [org/frontend] Update dependencies (merge conflict)

DRAFT
  #40 [org/api] WIP: new rate limiter

Merge Readiness Summary (4 PRs)
  Ready    : 1
  Pending  : 1
  Blocked  : 1
  Draft    : 1
```

## How It Works

1. Loads cached PR data (populated by `stackpulse` or watch mode).
2. Checks each PR's `reviews`, `check_runs`, and `mergeable_state`.
3. Classifies and groups PRs by readiness state.
4. Prints a colour-coded report and summary.
