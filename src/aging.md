# PR Aging Report

The **aging** module classifies open pull requests by how long they have been open, grouping them into intuitive bands so teams can quickly spot neglected work.

## Aging Bands

| Band      | Age range    | Meaning                              |
|-----------|-------------|--------------------------------------|
| fresh     | 0 – 2 days  | Recently opened, likely in progress  |
| active    | 3 – 7 days  | Normal review window                 |
| aging     | 8 – 30 days | Starting to linger                   |
| stagnant  | 31 – 90 days| Needs attention                      |
| ancient   | 90+ days    | Likely forgotten or blocked          |

## Usage

```bash
# Show aging summary across all configured repos
npx stackpulse aging

# Include draft PRs
npx stackpulse aging --drafts

# Filter by author
npx stackpulse aging --author octocat

# Show per-PR detail under each band
npx stackpulse aging --detail

# Combine flags
npx stackpulse aging --detail --author octocat
```

## Configuration

Repos are read from `.stackpulse.json`:

```json
{
  "token": "ghp_...",
  "repos": ["org/repo-a", "org/repo-b"]
}
```

## Output Example

```
PR Aging Breakdown:
  fresh      2 PRs
  active     5 PRs
  aging      3 PRs
  stagnant   1 PR
```

With `--detail`:

```
[fresh]
  #101 Add login page (org/repo-a) — 1d old
  #102 Fix typo (org/repo-b) — 0d old
```
