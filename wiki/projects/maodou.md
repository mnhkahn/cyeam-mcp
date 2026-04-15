---
title: maodou
type: projects
created: 2015-04-05
last_updated: 2015-04-05
related: ["[[Search Engine Crawlers]]", "[[Web Scraping]]", "[[HTTP Protocol Analysis]]", "[[beego]]"]
sources: ["82da77a8a73a"]
---

# maodou

maodou is a vertical-search crawler framework written in Go by the subject in April 2015. It was inspired by the Python framework pyspider and is designed for targeted scraping of specific websites rather than broad web crawling.

## Architecture

A maodou scraper is implemented as a struct that embeds `maodou.MaoDou` and defines three callbacks:

- `Start()` — seeds the crawl with one or more entry URLs.
- `Index(resp *maodou.Response)` — parses list pages and enqueues detail pages.
- `Detail(resp *maodou.Response)` — extracts structured data from a single item page.
- `Result(result *models.Result)` — persists the extracted data.

The framework uses PuerkitoBio's `goquery` for DOM parsing and CSS-selector-based extraction.

## Anti-Detection Techniques

The subject documented several practical measures to avoid being blocked by target sites:

1. **User-Agent** — using a common browser User-Agent instead of a custom bot identifier.
2. **Referer** — setting the `Referer` header to the list page when requesting detail pages, because detail URLs are typically unreachable directly and should only be accessed from a listing.
3. **Rate limiting** — adding a 5-second delay between requests and scraping in small batches (for example, every 30 minutes) to simulate human browsing patterns.

## Image Hotlinking and Display

When displaying scraped images on a third-party site, the subject encountered hotlink protection. Two workarounds were noted:

- **iframe embedding** — loading the image inside an `iframe` prevents the browser from sending a `Referer` header on the image request.
- **HTTPS origin** — when a page is served over HTTPS, some browsers omit the `Referer` header on insecure subresource requests for privacy reasons. The subject experimented with a self-signed SSL certificate to achieve this.

## Storage

The framework supports pluggable data-access objects (DAOs). In the reference implementation, results were stored via the Duoshuo comment-system API.
