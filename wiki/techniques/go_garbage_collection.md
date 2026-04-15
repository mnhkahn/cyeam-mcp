---
title: Go Garbage Collection
type: techniques
created: 2015-07-03
last_updated: 2015-07-03
related: ["[[Go Concurrency]]", "[[beego]]"]
sources: ["039efe3591ef"]
---

# Go Garbage Collection

In July 2015, the subject investigated a production memory issue in a high-traffic Go service. The application normally consumed around 200 MB, but after a logic change that removed caching from a frequently accessed list, memory usage spiked to over 20 GB. The incident led to a deeper study of Go's garbage collector (GC).

## Observed Behavior

Go's runtime pre-allocates a large block of memory and increases the GC threshold each time a collection occurs. For example, if the heap exceeds 10 MB and triggers GC, the next threshold becomes 20 MB, then 40 MB, and so on. The runtime also performs periodic GC regardless of heap size.

When the uncached endpoint experienced heavy traffic, database queries generated many temporary objects. This caused the GC threshold to rise rapidly and the collection frequency to drop. Because Go's runtime does not immediately return freed memory to the operating system, the process's resident memory appeared to grow continuously, creating the illusion of a memory leak.

## Stop-the-World Pause

Go uses a stop-the-world (STW) mark-and-sweep collector. During GC:

1. All goroutines are paused.
2. The runtime marks reachable objects.
3. Goroutines resume.
4. Sweeping occurs asynchronously in the background.

The pause duration is proportional to the number of live temporary variables, not the total heap size. In the subject's environment, pauses reached approximately 20 ms.

## Mitigation Strategies

The subject identified two practical ways to reduce GC pressure:

1. **Reuse local variables** instead of allocating new ones for each request.
2. **Group related variables into a single struct** so the garbage collector sees fewer individual pointers to scan.

Adding a cache layer to the hot endpoint eliminated both the database overload and the memory spike, confirming that the root cause was excessive short-lived allocations rather than a true leak.
