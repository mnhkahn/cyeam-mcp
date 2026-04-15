---
title: Git Shell Integration
type: tools
created: 2018-11-12
last_updated: 2018-11-12
related: ["[[Linux Shell Commands]]", "[[Go Tooling]]"]
sources: ["6a81849dfa8d"]
---

# Git Shell Integration

In November 2018, the subject documented how to enable tab-completion for Git commands in macOS bash.

## Installing bash-completion

The `bash-completion` package is installed via Homebrew:

```bash
$ brew install bash-completion
```

## Installing the Git Completion Script

The completion script version must match the installed Git version. The subject's Git version was 2.17.1, so the corresponding script was downloaded from the Git repository:

```bash
$ curl -o ~/.git-completion.bash \
    https://raw.githubusercontent.com/git/git/v2.17.1/contrib/completion/git-completion.bash
```

## Shell Configuration

The following lines are added to `~/.bash_profile` to load the script on shell startup:

```bash
if [ -f ~/.git-completion.bash ]; then
    . ~/.git-completion.bash
fi
```

After sourcing the profile, pressing Tab after a partial Git command displays available completions:

```bash
$ git che
checkout   cherry   cherry-pick
```
