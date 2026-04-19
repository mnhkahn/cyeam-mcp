---
name: google
description: Search the web using Google (HTML scraping, no API key required).
homepage: https://www.google.com
---

# Google Search

Simple HTML search via curl, no API key needed.

## Basic search

```bash
curl -s "https://www.google.com/search?q=hello+world"
```

## Search with language filter

```bash
curl -s "https://www.google.com/search?q=hello+world&hl=en"
```

## Search with number of results

```bash
curl -s "https://www.google.com/search?q=hello+world&num=10"
```

## Tips
- Replace spaces with `+`
- URL-encode special characters
- Google may return a simplified page when accessed via curl
