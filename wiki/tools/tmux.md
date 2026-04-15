---
title: Tmux
type: tools
created: 2026-04-13
last_updated: 2026-04-13
related: ["[[Linux Shell Commands]]", "[[Development Tools]]", "[[Claude Code]]"]
sources: ["8ea3d50ba307"]
---

# Tmux

Tmux is a terminal multiplexer that provides persistent sessions, window management, and pane splitting. In April 2026, the subject adopted it to support collaborative workflows (such as Claude Teams) and to improve local terminal productivity.

## Core Capabilities

- **Session persistence** — processes continue running after disconnecting from the terminal.
- **Hierarchical organization** — sessions contain windows, and windows contain panes.
- **Pane splitting** — view multiple terminals simultaneously within a single window.
- **Cross-platform consistency** — identical behavior on macOS, Linux, and remote servers.
- **Keyboard-driven workflow** — most actions have dedicated shortcuts.
- **Mouse support** — click, scroll, and drag to resize panes.
- **Customizable appearance** — key bindings, colors, and status bars can be tailored.

## Installation

```bash
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt install tmux

# CentOS/RHEL
sudo yum install tmux
```

## Configuration

The subject uses a `~/.tmux.conf` optimized for daily development:

```bash
# Prefix key changed to Ctrl+a
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# Remove key-delay lag
set -sg escape-time 0

# Index windows and panes from 1
set -g base-index 1
setw -g pane-base-index 1

# Enable mouse
set -g mouse on

# Increase scrollback
set -g history-limit 50000

# Reload config quickly
bind r source-file ~/.tmux.conf \; display-message "Tmux config reloaded"

# Split panes
bind | split-window -h
bind - split-window -v

# Switch panes with arrow keys
bind -n M-Left select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up select-pane -U
bind -n M-Down select-pane -D

# Status bar styling
set -g status-position bottom
set -g status-style "fg=white,bg=#{?client_prefix,red,colour237}"
set -g status-left "#[fg=green]#S #[fg=yellow]#(whoami)#[default]"
set -g status-right "#{?client_prefix,PREFIX ACTIVE ,}#[fg=cyan]%Y-%m-%d %H:%M#[default]"
setw -g window-status-current-style "fg=white,bg=blue,bold"
set -g pane-active-border-style "fg=blue"
```

## Key Bindings

### Sessions

| Action | Command / Shortcut |
|---|---|
| New session | `tmux new -s <name>` |
| List sessions | `tmux ls` |
| Attach | `tmux a -t <name>` |
| Detach | `Prefix + d` |
| Kill session | `tmux kill-session -t <name>` |
| Switch session | `Prefix + s` |

### Windows

| Action | Shortcut |
|---|---|
| New window | `Prefix + c` |
| Next window | `Prefix + n` |
| Previous window | `Prefix + p` |
| Rename window | `Prefix + ,` |
| Close window | `Prefix + &` |
| Window list | `Prefix + w` |

### Panes

| Action | Shortcut |
|---|---|
| Split vertical | `Prefix + %` |
| Split horizontal | `Prefix + "` |
| Switch pane | `Prefix + arrow` |
| Close pane | `Prefix + x` |
| Zoom pane | `Prefix + z` |
| Resize pane | `Prefix + Alt + arrow` |
| Sync input to all panes | `Prefix + :setw synchronize-panes on` |

### Copy Mode

| Action | Shortcut |
|---|---|
| Enter copy mode | `Prefix + [` |
| Start selection | `Space` |
| Copy | `Enter` |
| Paste | `Prefix + ]` |

## Terminal Cursor Shortcuts

In iTerm2 on macOS, the Option key must be configured to send `Esc+` for word-level cursor movement:

- `Option + b` — jump backward one word
- `Option + f` — jump forward one word
