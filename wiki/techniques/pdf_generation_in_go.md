---
title: PDF Generation in Go
type: techniques
created: 2019-06-26
last_updated: 2019-06-26
related: ["[[Go HTTP Client]]", "[[Go Tooling]]", "[[Go Strings]]"]
sources: ["9e33251c9add"]
---

# PDF Generation in Go

In June 2019, the subject surveyed libraries for generating PDF documents in Go and documented two approaches: a pure-Go library and a CGO wrapper around a C-based HTML-to-PDF converter.

## gofpdf

[gofpdf](https://github.com/jung-kurt/gofpdf) is a pure Go implementation of PDF generation. It supports:

- UTF-8 fonts via `AddUTF8Font`.
- Drawing rectangles, lines, and filled shapes.
- Text output, including multi-line wrapping with `SplitText`.
- Image embedding.
- Basic SVG rendering via `SVGBasicParse` and `SVGBasicWrite`.
- Barcodes and QR codes through companion packages.
- Simple HTML rendering with bold, italic, underline, links, and center/right alignment.
- Cell formatting with alignment options.

The library is fast (benchmarks showed ~15 ms per SVG operation) and ships with extensive examples in `fpdf_test.go`. Its SVG support is limited to simple paths without coordinate transforms, and its HTML support covers only basic styling.

## wkhtmltopdf

For complex HTML-to-PDF conversion, the subject evaluated [go-wkhtmltopdf](https://github.com/adrg/go-wkhtmltopdf), a Go binding to the C library `wkhtmltopdf`. This approach can render full HTML pages, including externally loaded scripts such as jQuery. The trade-off is significantly slower generation speed compared with a pure-Go solution.
