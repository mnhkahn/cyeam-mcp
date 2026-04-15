---
title: JD
type: companies
created: 2015-11-23
last_updated: 2018-11-11
related: ["[[Technology Observations]]", "[[Redis Data Structures]]", "[[Go Concurrency]]", "[[Load Testing]]", "[[Linux Network Troubleshooting]]"]
sources: ["0ae7ce612f22", "951b4b36413c"]
---

# JD

In September 2015, the subject joined JD.com and spent the first two months onboarding, learning the codebase, and handling data-loading operations for the listing-page service. The service was written in Go and backed by MySQL, JimDB (a Redis-compatible in-house cache), and twemproxy for sharding.

## Infrastructure

The listing-page service ran across two clusters, each with three data centers (Huangcun, Yongfeng, and Langfang). The online cluster served live traffic, while the offline cluster handled full data loads. There were roughly 1,000 categories, and each category required loading approximately 20,000 products. Loading data on the online cluster would trigger CPU and database alerts even for a single category, so all bulk loading was isolated to the offline cluster.

Data flow:

1. Colleagues in another team computed product data and persisted it to MySQL.
2. The subject's team loaded the MySQL data into JimDB and local memory.
3. twemproxy acted as the frontend sharding proxy for JimDB.

## Double-11 Phoenix Project

In October 2015, the subject began developing the "Phoenix" project for the Double-11 shopping festival. The project was a simplified version of the listing-page service, responsible for the "buy-4-get-1-free" POP-merchant activity page. Because the logic was similar but simpler than the main listing page, it served as a practical introduction to the larger system. Development took less than a week; the remaining time was spent resolving operational issues.

### Issue 1: Missing Products

After data loading completed, some activity pages consistently lost the same set of products. Debugging was difficult because the service was distributed and JimDB was sharded behind twemproxy, making it hard to identify which shard was affected. The problem only appeared in production, not in the test environment. The team provisioned a pre-production machine and added logging to trace the issue.

The root cause was eventually found in the JimDB client wrapper: the write function returned an `error` type, but all errors were being silently swallowed. Once the wrapper was fixed and errors were surfaced, the logs revealed a permission-denied error. Comparing twemproxy configurations showed that one instance had been misconfigured to point to a read-only JimDB replica instead of the master, causing writes to fail on that shard. The subject concluded that visible error logging could have reduced the debugging time from half a day to roughly 30 minutes.

### Issue 2: twemproxy Shard Imbalance

twemproxy distributed keys evenly across shards, but the values stored for those keys varied significantly in size. Even with uniform key distribution, one shard could receive disproportionately large values and exhaust its memory. JimDB did not evict entries via LRU; instead, writes failed once memory was full. The mitigation was to monitor shard memory usage and manually apply for additional memory on the affected shard.

### Issue 3: Connection Count and Throughput

During load testing, cluster performance was lower than expected. After investigating disk I/O, MySQL reads and writes, and Redis reads and writes, the bottleneck was identified as the number of connections between the application and twemproxy. Raising the connection count to 1,000 improved results to approximately 1,800 TPS per machine. A remaining optimization opportunity was that `MGet` requests, although presented as a single operation, were still serialized across the backend shards because different products resided on different servers.

## Big Promotion Operations

From 2015 to 2018, the subject participated in four 618 mid-year sales and three Double-11 shopping festivals while working on JD's PC listing-page service. Preparations began roughly one month before each event and focused on load testing, performance tuning, monitoring, and incident response.

### Load Testing

Routine load testing was performed monthly on a single offline machine using real traffic traces captured from production. Concurrency was increased incrementally until TP99 latency fell below acceptable thresholds. Before each big promotion, whole-cluster night-time load tests were conducted against multiples of the previous peak traffic. If capacity was insufficient, the primary remediation was horizontal scaling.

### Performance and Reliability Rules

- **TP99 target** — the company maintained an informal requirement that TP99 remain under 200 ms.
- **No direct database reads** — online read-only services were forbidden from querying MySQL directly. All data had to be served from cache; fallback cache-to-database logic was disallowed because a single slow query could cascade into a site-wide outage.
- **No cross-datacenter calls** — normal traffic was kept within the local datacenter to preserve dual-active redundancy.

### Monitoring and Alerting

Monitoring covered interface latency, throughput, error rates, and machine health. The subject also implemented page-level rendering checks that periodically loaded a category page, rendered it, and scraped the HTML to verify business correctness.

### Degradation and Fallback

The team maintained roughly a dozen degradation playbooks. If a downstream dependency such as Redis became unhealthy, traffic could be shifted to alternate clusters or datacenters. In the worst case, the listing page would render a static fallback page tailored to the category, so users would not see a generic nginx error screen.

### On-Call Experience

During promotion months, the codebase was frozen and engineers rotated on-call shifts. Peak traffic occurred at midnight on key dates (1 June, 10 November, 11 November, 18 June), requiring overnight stays at the office or nearby hotels. On one occasion, an unexpected traffic surge at 23:20 on 10 November was traced to a partner team's cache being invalidated, causing a flood of requests to backfill through the listing service. Because the service had been performance-tuned to handle high load, it absorbed the spike without manual intervention.
