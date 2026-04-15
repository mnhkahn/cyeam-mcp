---
title: Linux Shell Commands
type: techniques
created: 2014-01-22
last_updated: 2014-07-01
related: ["[[Linux Gaming with Dota 2]]", "[[beego]]", "[[Web Architecture Concepts]]"]
sources: ["566f68ae6855", "efbeb935e132", "9f0bab7988f4"]
---

# Linux Shell Commands

The subject maintained notes on practical Linux shell commands used during development and system administration.

## curl

`curl` transfers data from or to a server. Common options documented include:

- `curl blog.cyeam.com` — fetch a page.
- `curl -i blog.cyeam.com` — include response headers.
- `curl -v http://blog.cyeam.com/pages.html` — verbose mode showing the full request/response cycle.
- `curl --trace output.txt blog.cyeam.com` — write a detailed trace to a file.
- `curl -i -A "Cyeam" http://blog.cyeam.com/linux/2014/01/22/linux/` — set a custom User-Agent.
- `curl -s` — silent mode, showing only the result.

## grep

`grep` searches files for lines matching a pattern. Options noted:

- `-n` — show line numbers.
- `-r` — recursive search.
- `-c` — count matching lines.
- Example: `grep -n "/cyeam" -r .`

## grep for Log Analysis

In July 2014, the subject analyzed how grep patterns influence log design. Key options for log work include `-c` for match counts, `-i` for case-insensitive search, `-h` to suppress filenames in multi-file queries, `-l` to list only filenames, `-s` to silence errors, and `-v` to invert matches.

Common regex patterns for log grepping:

- `^` — start of line.
- `$` — end of line.
- `\<` and `\>` — word boundaries.
- `[a-z]` — character ranges.
- `.` — any single character.
- `*` — zero or more repetitions.

Practical examples:

- Search by directory: `grep magic /usr/src/Linux/Doc/*`
- Search by date: `cat 1.log | grep '2014-07-02'`
- Search by URL path: `cat /cygdrive/c/Users/Thinkpad/Desktop/1.log | grep /cyeam/test/url/aaa`

## git

Documented workflows:

- Force synchronize: `git reset --hard HEAD`, `git clean -f`, `git pull`.
- Commit sequence: `git add -A`, `git status`, `git commit -a ""`, `git push origin master`.

## mysql

- Create user: `create user 'bryce'@'localhost' identified by '';`
- Dump database: `mysqldump -u root -p ROOT > C:/Users/Bryce/Documents/GitHub/Cyeam/data/cyeam.sql`
- Restore database: `mysql -u bryce -p ROOT < C:/Users/Bryce/Documents/GitHub/Cyeam/data/cyeam.sql`

## Process and System Utilities

- `unzip upload.zip -d [DIRECTORY]` — extract a zip archive.
- `lsof -i:8080` — list processes using a specific port.
- `kill -9 [pid]` — forcefully terminate a process.
- `history` — recall previously executed commands. By default the shell retains the last 1,000 entries in `.bash_history`.
- `aptitude` — package management. `sudo aptitude install` and `sudo aptitude remove` for complete uninstallation.
- `file` — identify file types.
- `lsusb` — list USB devices.
- `top` — real-time process and resource monitoring.

## Command History Analysis

In April 2014, the subject ran a shell one-liner to analyze their most frequently used commands from history:

```bash
history | awk '{CMD[$2]++;count++;}END { for (a in CMD) print CMD[a] " " CMD[a]/count*100 "% " a;}' | grep -v "./" | column -c3 -s " " -t | sort -nr | nl | head -n10
```

The top ten results were: git (26.5%), sudo (22.2%), cd (11.6%), ls (10.6%), grep (4.8%), go (4.4%), jekyll (2.0%), gor (2.0%), adb (2.0%), and ssh (1.4%). The subject noted that active GitHub Pages work explained the high frequency of `git` and `jekyll`.

## cat

- `cat filename` — display an entire file.
- `cat > filename` — create a file from keyboard input.
- `cat file1 file2 > file` — concatenate multiple files.
