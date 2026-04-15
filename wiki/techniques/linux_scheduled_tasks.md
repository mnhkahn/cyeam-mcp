---
title: Linux Scheduled Tasks
type: techniques
created: 2014-07-16
last_updated: 2014-07-16
related: ["[[Linux Shell Commands]]", "[[Web Architecture Concepts]]"]
sources: ["a68251192342"]
---

# Linux Scheduled Tasks

In July 2014, the subject researched ways to run tasks at fixed calendar times (such as daily at 6 a.m.) rather than simple delays. The subject concluded that true scheduling is an operating-system responsibility rather than a language feature, and settled on Linux's `crontab`.

## crontab

`crontab` configures periodic commands on Unix-like systems. On Ubuntu, the default editor was `nano`, which the subject replaced with `vim`:

```bash
echo export EDITOR=/usr/bin/vim >> ~/.bashrc
source ~/.bashrc
```

## Syntax

A crontab line consists of a time specification followed by a command:

```
0 */1 * * * /root/day >> $HOME/test.txt
```

The five time fields are:

1. Minute (0–59)
2. Hour (0–23)
3. Day of month (1–31)
4. Month (1–12)
5. Day of week (0–6, where 0 is Sunday)

## Management

- `crontab -e` — edit the current user's crontab.
- `service cron restart` — restart the cron daemon to apply changes.
