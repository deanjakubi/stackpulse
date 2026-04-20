# Burndown Report

The burndown report shows how many PRs were **opened** and **closed** each day over a rolling window, giving you a clear picture of whether your PR backlog is growing or shrinking.

## Usage

```bash
node src/burndownCli.js
node src/burndownCli.js --days=30
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--days=N` | `14` | Number of days to include in the window |

## Output

```
PR Burndown — last 14 days
  Opened : 18
  Closed : 12
  Net    : 6

  Date        Opened  Closed  Net  Cumulative
  ----------  ------  ------  ---  ----------
  2024-05-01       2       1   +1           1
  2024-05-02       1       2   -1           0
  ...
```

## How it works

1. All PRs (open, closed, merged) are fetched across every configured repo.
2. Each PR's `created_at` date is bucketed into the **opened** column for that day.
3. Each PR's `merged_at` (or `closed_at`) date is bucketed into the **closed** column.
4. The **cumulative** column tracks the running net change across the window.

## Interpreting results

- A rising cumulative line means more PRs are being opened than resolved — the backlog is growing.
- A falling or flat line indicates the team is keeping up with or reducing the backlog.
- Use `--days=30` for a broader trend or `--days=7` for a short-term snapshot.
