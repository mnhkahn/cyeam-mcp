---
title: Git Commit Conventions
type: techniques
created: 2025-05-14
last_updated: 2025-05-14
related: ["[[Git Code Statistics]]", "[[Git Shell Integration]]", "[[Engineering Management]]"]
sources: ["354ad99d3fcd"]
---

# Git Commit Conventions

In May 2025, the subject documented a structured format for writing Git commit messages to improve readability, traceability, and release automation.

## Message Structure

A commit message is divided into three optional blocks separated by blank lines:

1. **Header** — a single-line summary.
2. **Body** — detailed explanation.
3. **Footer** — metadata such as issue references or breaking-change notices.

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Header Rules

- **Type** — required. Describes the nature of the change.
- **Scope** — optional. Indicates the module or component affected.
- **Description** — required. A concise summary in the imperative mood, lowercase, without a trailing period, ideally 50 characters or fewer.

## Common Types

| Type       | Meaning                                      |
|------------|----------------------------------------------|
| `feat`     | New feature                                  |
| `fix`      | Bug fix                                      |
| `docs`     | Documentation-only changes                   |
| `style`    | Code style changes (formatting, no logic)    |
| `refactor` | Code restructuring without changing behavior |
| `test`     | Adding or updating tests                     |
| `chore`    | Build process or auxiliary tool changes      |
| `perf`     | Performance improvement                      |
| `ci`       | CI/CD configuration changes                  |
| `revert`   | Reverting a previous commit                  |

## Footer Conventions

- `Fixes #123` — links the commit to an issue.
- `BREAKING CHANGE: ...` — alerts consumers to incompatible changes.
