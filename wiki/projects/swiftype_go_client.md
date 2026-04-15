---
title: Swiftype Go Client
type: projects
created: 2024-11-16
last_updated: 2024-11-16
related: ["[[Go HTTP Client]]", "[[Web Scraping]]", "[[Search Engine Crawlers]]"]
sources: ["691c1a098a44"]
---

# Swiftype Go Client

In January 2017, the subject published a Go client library for the Swiftype search API because no official Go SDK existed at the time.

## Motivation

The subject wanted to add site-search functionality to a personal website. After finding community implementations buggy or incomplete, the subject forked an existing repository and released a cleaned-up version.

## Installation

```bash
go get -v gopkg.in/mnhkahn/swiftype.v1
```

## API Surface

The client supports API-key and username-password authentication:

- `NewClientWithApiKey(api_key, host string) *Client`
- `NewClientWithUsernamePassword(username, password, host string) *Client`

Methods exposed:

- `Engine(engine string) ([]byte, error)` — retrieve a single engine.
- `Engines() ([]byte, error)` — list all engines.
- `Search(engine, query string) (*SwiftypeResult, error)` — execute a search query.

## Usage

```go
SWIFTYPE := swiftype.NewClientWithApiKey("YOUR_API_KEY", "api.swiftype.com")
data, err := SWIFTYPE.Search("YOUR_ENGINE", q)
```
