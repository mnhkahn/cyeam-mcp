---
title: Git Code Statistics
type: techniques
created: 2015-01-17
last_updated: 2015-01-17
related: ["[[Linux Shell Commands]]"]
sources: ["bdad167c32ad"]
---

# Git Code Statistics

In January 2015, the subject studied GitStats, a Python tool that wraps Git commands to generate code-statistics reports. Rather than naively counting lines by traversing files, GitStats leverages Git's own history to compute incremental changes, author contributions, and temporal activity.

## Key Git Commands

The following commands form the basis of GitStats's analysis.

### Contributor Count

```bash
git shortlog -s --since=2013-12-01 --before=2015-12-10 HEAD --no-merges
```

`-s` suppresses commit descriptions and outputs only the author name and commit count. Piping the output to `wc -l` yields the number of distinct contributors.

### Commit Timeline

```bash
git rev-list --pretty=format:"%at %ai %aN (%aE)" --since=2013-12-01 --before=2015-12-10 HEAD | grep -v ^commit
```

`git rev-list` lists commits in reverse chronological order. The format placeholders used are:

- `%at` — UNIX timestamp.
- `%ai` — ISO 8601 date.
- `%aN` — author name (respecting `.mailmap`).
- `%aE` — author email.

This data drives hourly, daily, weekly, monthly, and yearly activity charts, as well as per-author first/last commit times.

### Tree Snapshot

```bash
git ls-tree -r -l -z HEAD
```

- `-r` recurses into subdirectories.
- `-l` shows file sizes.
- `-z` terminates records with a null byte.

The output includes blob IDs, file sizes, and paths, which GitStats uses to compute language breakdowns and repository size over time.

### Line-Change Statistics

```bash
git log --shortstat --first-parent -m --pretty=format:"%at %aN (%aE)" --since=2013-12-01 --before=2015-12-10 HEAD
```

`--shortstat` emits a one-line summary of insertions and deletions per commit. `--first-parent` follows only the main branch through merges, and `-m` splits merge commits so that changes are attributed correctly. This produces daily, monthly, yearly, and total insertion/deletion counts.

### Current Revision

```bash
git --git-dir=.git --work-tree=./ rev-parse --short HEAD
```

Returns the abbreviated commit hash of the current HEAD, used to label the generated report with the exact revision that was analyzed.

## Design Insight

The subject noted that using Git history is superior to one-shot file traversal because it can measure incremental changes, attribute lines to individual authors, and reconstruct activity over arbitrary date ranges without requiring daily snapshots.
