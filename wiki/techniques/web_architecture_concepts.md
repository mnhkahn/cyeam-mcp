---
title: Web Architecture Concepts
type: techniques
created: 2014-01-14
last_updated: 2014-01-14
related: ["[[HTTP Protocol Analysis]]", "[[Java Interview Preparation]]"]
sources: ["ef9dc84e0cd4"]
---

# Web Architecture Concepts

On 10 January 2014, the subject attended a technical summary meeting on back-end architecture and documented the terminology and technologies discussed.

## Metrics and Analytics

**KPI** (Key Performance Indicator) derives from the Pareto principle: roughly 80% of outcomes come from 20% of behaviors. The idea is to focus evaluation on the critical minority of actions that produce the majority of results.

**PV** (Page View) counts how many times a page is loaded from the server. **UV** (Unique Visitor) counts distinct clients within a 24-hour window. **IP** counts distinct source addresses in the same period.

## Caching and Acceleration

**Varnish** is a high-performance reverse proxy and HTTP accelerator. It can mitigate request avalanches: when 1,000 simultaneous requests hit a cached resource, Varnish can serialize them so that only one request reaches the back end while the other 999 wait for the result.

**CDN** (Content Delivery Network) places nodes across multiple geographic locations and networks. These nodes dynamically exchange content to optimize download speed, reduce bandwidth costs for the origin server, and improve system stability.

## Storage and Search

**MongoDB** is a document-oriented database that stores data in a JSON-like format called BSON. For massive file storage, GridFS combined with MongoDB sharding enables distributed file storage.

**Solr** is an open-source enterprise search server built on Apache Lucene. It requires a Servlet container and exposes XML/HTTP and JSON APIs for indexing and querying.

**Redis** is a key-value store noted as the most popular of its category at the time.

## Infrastructure and Operations

**MySQL clustering** and **InnoDB row locking** were mentioned as concerns for high-concurrency database access. The homepage of a site should not query the database directly; it should be served from static files or cache.

**Crontab** provides Unix-based scheduled task execution, commonly used for redundant or timed computations such as pre-aggregating statistics.

**Reverse proxy** sits on the server side, fetching resources from back-end servers on behalf of clients. This differs from a forward proxy, which acts as an intermediary on behalf of the client to access the internet.

**HTTP status codes** 502 (Bad Gateway) and 503 (Service Unavailable) indicate upstream or overload conditions respectively.

## Security

**DoS** (Denial of Service) attacks aim to make a computer or network unable to provide normal service by overwhelming it with traffic or exploiting resource exhaustion.
