---
title: Go Modules
type: techniques
created: 2018-09-18
last_updated: 2019-03-12
related: ["[[Go Tooling]]", "[[Go Ecosystem]]", "[[Go Concurrency]]", "[[Go HTTP Client]]"]
sources: ["1d06d34bcb66", "7940f31a89d1", "85f3ded75ecf"]
---

# Go Modules

Go 1.11 introduced preliminary support for modules, allowing projects to declare dependencies in a `go.mod` file and build outside of `GOPATH`. In September 2018, the subject documented how to use modules in CI environments and how to run a private module proxy.

## Enabling Modules

Modules are enabled by setting the `GO111MODULE` environment variable:

```bash
export GO111MODULE=on
```

A new module is initialized with:

```bash
go mod init
```

This creates `go.mod` and `go.sum`, which should be committed to version control.

## Downloading Dependencies Behind a Firewall

When some upstream hosts are unreachable, the subject recommended using an HTTP proxy for external traffic:

```bash
export http_proxy=...
export https_proxy=...
```

For private repositories accessed over HTTPS, `go get` disables interactive password prompts by default. Two common solutions are:

- Store credentials in `$HOME/.netrc`:
  ```
  machine github.com login USERNAME password APIKEY
  ```
- Rewrite HTTPS URLs to SSH with Git's `insteadOf`:
  ```bash
  git config --global url."ssh://git@github.com/".insteadOf "https://github.com/"
  ```

## Private Module Proxy with Athens

To improve build reliability and speed, the subject deployed [Athens](https://github.com/gomods/athens), an open-source Go module proxy.

### Running Athens

After installing Athens, it can be run directly or managed by a process supervisor such as Supervisor:

```ini
[program:proxy]
command=/path/to/proxy -config_file=/path/to/config.dev.toml
environment=HTTP_PROXY="...",HTTPS_PROXY="..."
stdout_logfile=/tmp/proxy.log
stderr_logfile=/tmp/proxy.log
autostart=true
autorestart=true
```

### Using the Proxy

Clients point `GOPROXY` at the Athens instance:

```bash
export GO111MODULE=on
export GOPROXY=http://127.0.0.1:3000
```

Athens caches module metadata and source archives. The first fetch for a given version may be slow because Athens downloads it from upstream; subsequent requests are served from the cache.

### GOPROXY Protocol

A Go module proxy implements a simple HTTP API:

- `GET $GOPROXY/<module>/@v/list` — list known versions.
- `GET $GOPROXY/<module>/@v/<version>.info` — JSON metadata (`Version`, `Time`).
- `GET $GOPROXY/<module>/@v/<version>.mod` — the `go.mod` file for that version.
- `GET $GOPROXY/<module>/@v/<version>.zip` — the module source as a ZIP archive.

Module paths are case-normalized: uppercase letters are escaped with a leading `!` (e.g., `github.com/Azure` becomes `github.com/!azure`).

## Semantic Versioning and v2+ Upgrades

In March 2019, the subject documented how to publish v2 and higher versions of a Go module. Go modules follow [Semantic Versioning](https://semver.org/): `vMAJOR.MINOR.PATCH`.

To release a v2 module:

1. Update `go.mod` to append `/v2` to the module path:
   ```
   module github.com/mnhkahn/aaa/v2
   ```
2. Update all import paths within the module and in consumers to include `/v2`.
3. Create a Git tag `v2.0.0`.

For modules that have not adopted Go modules but have Git tags, `go.mod` may record the dependency with a `+incompatible` suffix (e.g., `v3.2.1+incompatible`).

### Pseudo-Versions

When a dependency has no Git tag, Go generates a pseudo-version:

```
v0.0.0-yyyymmddhhmmss-abcdefabcdef
```

### Cache Invalidation

If a Git tag is deleted and recreated, `go get` may still use the old version cached in `$GOPATH/pkg/mod/cache`. Clearing that cache forces a fresh download.
