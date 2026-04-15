---
title: Web Scraping
type: techniques
created: 2014-12-01
last_updated: 2014-12-01
related: ["[[Search Engine Crawlers]]", "[[HTTP Protocol Analysis]]", "[[Linux Shell Commands]]"]
sources: ["bc74cf0590de"]
---

# Web Scraping

Web scraping is the process of extracting structured information from HTML documents. In December 2014, the subject needed to extract author and description metadata from blog pages to build a search feature.

## Meta Tag Extraction

Many websites include machine-readable metadata in `<meta>` tags within the HTML `<head>`. For example:

```html
<meta name="description" content="...">
<meta name="author" content="...">
```

While XPath libraries exist for Go (such as `go-xmlpath/xmlpath`), they rely on `encoding/xml` and can fail on malformed or loosely structured HTML that does not conform to strict XML rules.

## Command-Line Parsing with pup

The subject adopted `pup`, a command-line HTML parser, as a more robust alternative. `pup` accepts CSS selectors and can be invoked via shell pipelines:

```bash
curl -s https://example.com | pup 'head meta[name="author"] attr{content}'
curl -s https://example.com | pup 'head meta[name="description"] attr{content}'
```

## Integration with Go

To use `pup` from within a Go program, the subject spawned a subprocess with `exec.Command` and fed the HTML bytes through the subprocess's standard input:

```go
cmd := exec.Command("pup", `head meta`)
stdin, _ := cmd.StdinPipe()
cmd.Stdout = &output
cmd.Start()
stdin.Write(htmlBytes)
stdin.Close()
cmd.Wait()
```

Closing `stdin` after writing is essential; otherwise the subprocess will block indefinitely waiting for the end of input. This pattern demonstrates how Go's `os/exec` package can integrate external command-line tools into an application workflow.
