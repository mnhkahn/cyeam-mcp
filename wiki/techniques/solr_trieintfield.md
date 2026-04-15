---
title: Solr TrieIntField
type: techniques
created: 2014-08-27
last_updated: 2014-08-27
related: ["[[Nutch and Solr]]", "[[Web Architecture Concepts]]"]
sources: ["19184d33b77a"]
---

# Solr TrieIntField

In Apache Solr, `TrieIntField` is a numeric field type for 32-bit signed two's complement integers. It is commonly used for identifiers, counters, and other integral data.

## Range

- Minimum value: -2,147,483,648
- Maximum value: 2,147,483,647

## Configuration

A typical `schema.xml` definition:

```xml
<fieldType name="int" class="solr.TrieIntField" precisionStep="0" positionIncrementGap="0"/>
```

## Operational Note

The subject encountered an `Invalid Number` error when querying Solr with a list of IDs. The root cause was a missing comma in the query string, which caused Solr to interpret the concatenated digits as a single integer exceeding the 32-bit range. Verifying the `TrieIntField` bounds confirmed the diagnosis.
