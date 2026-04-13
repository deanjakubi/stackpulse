# Approval Report

The `approval` module analyses the review approval status of open pull requests across all configured repos.

## Approval States

| State               | Meaning                                              |
|---------------------|------------------------------------------------------|
| `approved`          | Two or more approving reviews, no changes requested  |
| `needs_one_more`    | Exactly one approving review                         |
| `changes_requested` | At least one reviewer requested changes              |
| `no_reviews`        | No reviews submitted yet                             |

## Usage

```bash
# Print approval summary for all configured repos
npx stackpulse approval

# Filter to a single repo
npx stackpulse approval --repo org/my-repo

# Output as JSON
npx stackpulse approval --json

# Show per-PR detail
npx stackpulse approval --verbose
```

## Configuration

Repos are read from `.stackpulse.json`:

```json
{
  "repos": ["org/repo-a", "org/repo-b"]
}
```

Set `GITHUB_TOKEN` in your environment for authentication.

## Output Example

```
Approval Summary
────────────────
  Approved (2+):        3
  Needs one more:       5
  Changes requested:    2
  No reviews:           4
  Total:                14
```
