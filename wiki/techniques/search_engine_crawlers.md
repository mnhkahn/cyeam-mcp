---
title: Search Engine Crawlers
type: techniques
created: 2014-12-26
last_updated: 2014-12-26
related: ["[[Web Scraping]]", "[[Bloom Filter]]", "[[Hash Functions]]", "[[Go Graphs]]"]
sources: ["f3d35cd52fc8"]
---

# Search Engine Crawlers

A web crawler systematically discovers and retrieves pages from the internet. In December 2014, the subject studied crawler fundamentals and noted that the crawling process can be modeled as traversing a directed graph, where web pages are nodes and hyperlinks are edges.

## Graph Traversal

Crawlers typically use one of three traversal strategies:

- **Breadth-first search (BFS)** — explores all pages at the current depth before moving deeper. This is the most common strategy because important pages tend to be close to seed URLs.
- **Depth-first search (DFS)** — follows a single path as deep as possible before backtracking. This can cause the crawler to become trapped in deep or cyclic regions of the web.
- **Best-first search** — uses a scoring function (such as topical relevance or PageRank) to prioritize the most promising URLs at each step.

## Cycle Prevention

Because the web contains cycles, crawlers must track visited URLs to avoid infinite loops. Common techniques include:

- **Hash tables** — store visited URLs in memory. For persistence across restarts, the table can be kept on disk or in an external store such as Redis.
- **MD5 fingerprints** — hash long URLs into fixed-length keys to reduce memory overhead. Content fingerprints (MD5 of the page body) can also detect duplicate content at different URLs.
- **Bloom filters** — a space-efficient probabilistic data structure that can test whether a URL has likely been seen before. See [[Bloom Filter]] for details.
- **Throttling** — limit the maximum number of fetches per domain or path to bound resource usage.

## Content Extraction

After fetching a page, the crawler must extract useful information:

- **Hyperlinks** — to discover new URLs for the crawl frontier.
- **Metadata** — such as title, author, and description, often found in `<meta>` tags.
- **Main content** — separating article text from navigation, ads, and boilerplate.

Simple content extraction can use heuristics based on the ratio of text to HTML tags: main content tends to have a high text-to-tag ratio, while navigation and advertisements are tag-heavy. For structured sources (such as sports scores on a fixed template), template-based extraction is more reliable.

## Regular Expressions for HTML

For lightweight parsing, regular expressions can match common HTML patterns:

- HTML tags: `(?is)<.*?>`
- Anchor tags: `(?is)<a .*?</a>`
- Images: `(?is)<img .*?>`

The `(?is)` modifier enables case-insensitive matching and causes `.` to match newlines, which is useful when HTML spans multiple lines.
