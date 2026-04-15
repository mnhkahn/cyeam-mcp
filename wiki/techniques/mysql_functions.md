---
title: MySQL Functions
type: techniques
created: 2014-10-13
last_updated: 2014-10-13
related: ["[[Linux Shell Commands]]", "[[xorm Database Tuning]]"]
sources: ["d83e52bdc910"]
---

# MySQL Functions

## FIND_IN_SET

`FIND_IN_SET(str, strlist)` is a MySQL string function that searches for `str` within a comma-separated string `strlist`. It returns the 1-based position of the match, or `0` if the string is not found. If the first argument is a constant and the second is a column of type `SET`, the function is optimized to use bit arithmetic.

This function is useful when a database schema stores simple many-to-one relationships in a single column as comma-separated values rather than using a separate lookup table. For example, a column might store `1,2,3` to indicate multiple associated flags, and `FIND_IN_SET('1', flags)` can test for membership without splitting the string in application code.

The subject noted that while this pattern violates normal form and is sometimes described as an anti-pattern, it can be pragmatic for small, stable enumerations (such as gender or fixed status codes) where creating a separate table would add unnecessary complexity.
