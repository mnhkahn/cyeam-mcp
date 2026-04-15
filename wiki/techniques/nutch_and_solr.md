---
title: Nutch and Solr
type: techniques
created: 2014-06-21
last_updated: 2014-08-27
related: ["[[Web Architecture Concepts]]", "[[Linux Shell Commands]]", "[[Solr TrieIntField]]"]
sources: ["691bf8046403", "19184d33b77a"]
---

# Nutch and Solr

In June 2014, the subject set up Apache Nutch and Apache Solr together to build a small-scale search engine. Nutch is a Java-based web crawler, and Solr is an enterprise search server built on Lucene. The subject had prior experience with Solr and treated the project as an extension of that knowledge.

## Installation

Because domestic download speeds for foreign resources were slow, the subject used 360 Yunpan to cache the archives. Solr was started directly from its example directory using Jetty:

```bash
cd example
java -jar start.jar
```

Nutch was configured according to the official tutorial:

1. Add the `bin` directory to `PATH`.
2. Set `http.agent.name` in `conf/nutch-site.xml`.
3. Because an empty value triggered an error, the value was also added to `conf/nutch-default.xml`.
4. Create a `urls/seed.txt` file containing the starting URLs.
5. Update `conf/regex-urlfilter.txt` to restrict crawling to the target domain.
6. Add required fields to `example/solr/collection1/conf/schema.xml` for digest, segment, boost, tstamp, anchor, and cache.

## Crawling and Indexing

The crawl was launched with:

```bash
bin/crawl urls/seed.txt TestCrawl http://localhost:8983/solr/ 2
```

After crawling, Solr reported 22 indexed documents from the subject's blog. The subject noted that the result count was lower than expected and that the first result appeared to be the archive page rather than individual articles. Despite the incomplete indexing, the subject considered the stack successfully deployed.

## Future Plans

The subject planned to use this crawler-based approach to populate the main site with blog content, rather than building a custom generator on top of Jekyll.
