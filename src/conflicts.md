# Conflict Detection

The **conflict detection** feature identifies open PRs that touch overlapping files, warning you of potential merge conflicts before they occur.

## How it works

1. Each PR must have a `changed_files_list` array populated (typically fetched from the GitHub Files API).
2. `buildFileIndex` maps every filename to the list of PRs that modify it.
3. `detectConflicts` iterates over that index and emits a conflict record for every unique pair of PRs that share at least one file.
4. `annotateConflicts` enriches each PR object with a `conflicts` array of conflicting PR numbers.

## Usage

```bash
# Run the standalone conflict report
node src/conflictsCli.js
```

## API

### `detectConflicts(prs)`
Returns `{ prA, prB, sharedFiles }[]`.

### `annotateConflicts(prs)`
Returns a new array of PR objects, each with a `conflicts: number[]` field.

### `printConflictReport(prs)`
Prints a colour-coded report to stdout.

## Configuration

No additional configuration keys are required. The feature uses the existing `repos` list from `~/.stackpulse.json`.

## Notes

- PRs without `changed_files_list` are treated as having no changed files and will never appear in conflict results.
- Only **open** PRs are typically passed to this module; filtering is the caller's responsibility.
