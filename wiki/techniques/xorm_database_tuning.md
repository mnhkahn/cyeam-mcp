---
title: xorm Database Tuning
type: techniques
created: 2014-07-09
last_updated: 2014-07-11
related: ["[[Go JSON Parsing]]", "[[beego]]"]
sources: ["ec66c5b832bf", "f68c72c1a19b"]
---

# xorm Database Tuning

In July 2014, the subject resolved several database issues while developing Go back-end services with the xorm ORM.

## Timezone Issues

A query filtering by start and end times initially failed to return correct results:

```go
Where("displayorder<>0 AND effectivetime< ? AND expirationtime> ?", time.Now(), time.Now())
```

The SQL worked when run directly in a database client but behaved incorrectly through xorm. The root cause was a timezone mismatch: xorm was passing `time.Now()` in UTC while the MySQL server expected local time.

Two fixes were identified:

1. Append `parseTime=true&loc=Asia%2FChongqing` to the MySQL connection string.
2. Use MySQL's built-in `NOW()` function instead of passing a Go `time.Time` value:

```go
Where("displayorder<>0 AND effectivetime< NOW() AND expirationtime> NOW()")
```

## Connection Limits

During load testing with `wrk`, the application returned `Too many connections`. The fix was to configure a maximum connection pool size in xorm:

```go
engine.SetMaxConns(dbMaxConns)
```

## Caching

To reduce database load, the subject added an LRU cache:

```go
cacher := xorm.NewLRUCacher2(xorm.NewMemoryStore(), time.Duration(interval)*time.Second, max)
engine.SetDefaultCacher(cacher)
```

When a query's result is present in the cache, xorm returns it without hitting the database.
