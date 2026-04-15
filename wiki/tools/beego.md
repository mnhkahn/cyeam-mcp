---
title: beego
type: tools
created: 2014-01-21
last_updated: 2014-11-12
related: ["[[Linux Shell Commands]]", "[[Web Architecture Concepts]]", "[[API Security]]", "[[Go Interfaces]]"]
sources: ["11082d37e694", "0143d8a07a20", "4379e2e2acf1"]
---

# beego

beego is an open-source web framework for the Go programming language, created by astaxie. The subject studied it in January 2014 and noted that Go's design philosophy centers on reducing line count.

## Installation and Tooling

The framework is installed with `go get github.com/astaxie/beego`. A companion command-line tool, `bee`, provides project scaffolding and hot-reload development:

- `bee new [PROJECT_NAME]` creates a project under `$GOPATH/src`.
- `bee run [PROJECT_NAME]` starts the server with hot compilation.

## Router

Routes are registered in an `init()` function inside a `routers` package. The `beego.Router()` function binds a URL path to a controller and optionally maps HTTP methods to specific handler methods. Registrations must occur before `beego.Run()` is called.

## beego.Run()

`beego.Run()` starts the HTTP server and performs several initialization steps:

- Parses `conf/app.conf` for port, session, and application settings.
- Initializes the global session manager if enabled.
- Pre-compiles all templates in the `views` directory into an in-memory map.
- Starts an internal monitoring module on port 8088 exposing QPS, CPU, memory, GC, goroutine, and thread metrics.
- Binds and listens on the configured service port.

## Controller

beego controllers use Go's embedded struct mechanism to simulate inheritance. A custom controller embeds `beego.Controller` as an anonymous field, implicitly acquiring all of its methods and fields. If a custom controller does not implement a method for a given HTTP verb, beego returns HTTP 405 by default.

## Model and View

For simple applications, database access can live directly in the controller. For complex systems with repeated database logic, a dedicated Model layer is recommended. Go's visibility rules apply: exported identifiers start with an uppercase letter.

Views use templates stored in the `views` directory with `.html` or `.tpl` extensions. Data is passed through a `Data` map and rendered with `{{.Value}}` syntax. JSON responses are supported via `ServeJson()`.

## Filters

beego supports request filters via `beego.InsertFilter`:

```go
beego.InsertFilter(pattern string, position int, filter FilterFunc)
```

Positions include:

- `BeforeRouter` — before route matching.
- `BeforeExec` — after route matching, before controller execution.
- `AfterExec` — after controller execution.
- `FinishRouter` — after the request finishes.

Filters receive `*context.Context` and can abort the request with `ctx.Abort(status, body)`.

## Config Package

In November 2014, the subject analyzed beego's `config` package (version 1.4.2) as a case study in Go interface design. The package defines two interfaces:

- `ConfigContainer` — methods for reading configuration values (strings, ints, booleans, etc.).
- `Config` — an adapter interface for parsing raw configuration data into a `ConfigContainer`.

Implementations are provided for INI, JSON, XML, and YAML formats. The INI implementation (`IniConfigContainer`) stores data in a nested map (`map[string]map[string]string`) and embeds `sync.RWMutex` as an anonymous field to provide thread-safe access. This pattern demonstrates how Go uses composition and implicit interfaces to achieve modular, extensible design without class-based inheritance.

### Strings Bug

Shortly after the analysis, the subject encountered a regression in beego 1.4.2: `beego.AppConfig.Strings` stopped falling back to default configuration values when a run-mode-specific key was missing. The root cause was that `strings.Split` on an empty string returns a slice of length 1 (containing an empty string), so the fallback check `len(v) == 0` was never satisfied. The subject submitted a patch changing the check to `v[0] == ""`, which was merged into beego.

## bee Tool Internals

In April 2015, the subject analyzed the source code of `bee`, beego's companion CLI tool, specifically the `bee run` command. The command performs the following steps:

1. Reads `./conf/app.conf` to determine the application name.
2. Compiles controllers with `go install` to produce static libraries in the `pkg` directory.
3. Builds the executable with `go build -o [appname] main.go`.
4. Launches the executable as a child process using `exec.Command`.
5. Watches source files for changes using the `github.com/howeyc/fsnotify` package. When a file changes, the running process is killed and steps 2–4 are repeated.

The subject also noted that `bee` supports a `bee.json` configuration file for customizing watched directories, build arguments, and environment variables. A practical caveat is that `bee run` always compiles the project located in `$GOPATH`, even if invoked from a copied directory such as `/tmp`.

## Go Language Notes

The subject documented several Go syntax points while learning beego:

- `net/http` provides `http.Get()` for requests; `ioutil.ReadAll()` reads the response body.
- `encoding/json` unmarshals JSON into structs via `json.Unmarshal()`.
- Slices are declared with `[]type{}` and appended with `append()`.
- `len()` returns length according to the operand type.
- Both `make` and `new` allocate memory; `make` returns the object, while `new` returns a pointer.
