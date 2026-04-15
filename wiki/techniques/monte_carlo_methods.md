---
title: Monte Carlo Methods
type: techniques
created: 2013-03-27
last_updated: 2013-03-27
related: ["[[C++ Memory and Objects]]"]
sources: ["118c5fa19f2b"]
---

# Monte Carlo Methods

## Estimating Pi

In March 2013, the subject implemented a Monte Carlo simulation to approximate the value of pi. The method relies on geometric probability.

Consider a square with side length `l` containing a quarter-circle of radius `l`. Random points are generated uniformly within the square. The ratio of points falling inside the quarter-circle to the total number of points approximates the ratio of the quarter-circle's area to the square's area:

```
(π * l² / 4) / l² = π / 4
```

Therefore, `π ≈ 4 * (hits / total)`.

## Implementation

The program accepted the number of simulation iterations as a command-line argument. It generated random x and y coordinates in the range `[0, R]` using `rand()` with a time-based seed, then counted how many satisfied `x² + y² ≤ R²`. The radius `R` was set to 1000.

In theory, the result is independent of radius, but in practice a larger radius improves precision because it expands the coordinate space and reduces the relative quantization error of the integer random number generator.
