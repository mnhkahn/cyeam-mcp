---
title: Go Ecosystem
type: techniques
created: 2017-05-09
last_updated: 2017-05-09
related: ["[[Go Tooling]]", "[[beego]]", "[[Redis Data Structures]]", "[[Go BitSet]]"]
sources: ["468bac5ee5e1"]
---

# Go Ecosystem

In May 2017, the subject compiled a list of Go libraries and tools that had been evaluated or used in production.

## Web Frameworks

- **beego** — a full-featured Chinese web framework with high integration and extensive tooling. The subject used it for roughly three years but later felt it was too heavy for Go's lightweight philosophy. Starting with version 1.6, backward-compatibility issues reduced the subject's enthusiasm.
- **gin** — a lightweight HTTP web framework recommended by the community as an alternative to heavier frameworks.

## Logging

- **beego/logs** — the built-in logging package from beego, notable for supporting automatic log rotation by line count or by date.

## ORMs

- **beego/orm** — used for simple database operations.
- **gorp** and **xorm** — alternatives the subject had tried. For API-heavy services with minimal database logic, the subject found little practical difference between the available ORMs.

## Caching and Data Stores

- **redigo** — a mature Redis client for Go.
- **goquery** — a jQuery-like HTML parser built on top of `cascadia`, commonly used for web scraping.

## HTTP Clients

- **goreq** — an HTTP request library that the subject adopted because it supported gzip compression.

## Configuration

- **viper** — a configuration library supporting multiple formats. The subject highlighted its etcd integration as a pleasant surprise.

## Data Structures

- **gods** — a collection of data-structure implementations in Go. The subject used it as a reference rather than in production.
- **bitset** — a bitmap implementation using a `[]uint64` backing array. The subject reported it was approximately 40 times faster than the built-in `map` for bitmap workloads.

## JSON

- **ffjson** — a code generator that produces `MarshalJSON` methods for structs, avoiding the reflection overhead of the standard `encoding/json` package.

## Job Scheduling

- **jobrunner** — a crontab-like scheduler for Go. The subject adopted it after encountering bugs in beego's built-in cron package.

## Dependency Management

- **godep** — a vendoring tool the subject found cumbersome. The subject noted that Go's newer built-in dependency management made godep obsolete.

## Static Analysis

- **staticcheck** — static analysis for Go.
- **unused** — detects unused code.
- **gosimple** — suggests simplifications.
- **go vet** — the standard Go vetting tool.

## Code Generation

- **gojson** — generates Go struct definitions from JSON sample data.
