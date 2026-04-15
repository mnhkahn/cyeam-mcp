---
title: Sorting Algorithms
type: techniques
created: 2013-04-02
last_updated: 2014-09-01
related: ["[[Bitwise Operations]]", "[[C++ Memory and Objects]]", "[[Go Testing]]"]
sources: ["e6f3ad44477b", "26299db4b291", "fa4b04f4e23b", "0e8ca21eec55", "0716c28387df", "2303f7ecf33d", "c8af8341fb19"]
---

# Sorting Algorithms

## Bubble Sort

Bubble sort operates on an exchange principle: adjacent elements are compared and swapped if out of order. Each full pass through the array moves the largest unsorted element to its final position. The algorithm terminates early if a pass completes with no swaps.

- Time complexity: O(n²) average and worst case; O(n) best case (already sorted).
- Space complexity: O(1).
- Stable: equal elements retain their relative order.

## Selection Sort

Selection sort divides the array into sorted and unsorted regions. Each iteration selects the minimum (or maximum) element from the unsorted region and swaps it into place at the boundary.

- Time complexity: O(n²) in all cases.
- Space complexity: O(1).
- Unstable: swapping the selected element with the first unsorted element can change the relative order of equal values.

## Heap Sort

Heap sort is an optimized selection sort that uses a heap data structure to find the extremum element efficiently. A heap is a complete binary tree where every parent node satisfies a dominance relation with its children (min-heap: parent ≤ children; max-heap: parent ≥ children).

The algorithm builds a heap from the unsorted data, then repeatedly extracts the root (the extremum) and rebuilds the heap on the remaining elements.

- Time complexity: O(n log n) in all cases.
- Space complexity: O(1) for the in-place variant.
- Unstable.

### Go Implementation

Go's `sort` package uses heap sort as one of its strategies. The `heapSort` function builds a max-heap and repeatedly swaps the root with the last heap element:

```go
func heapSort(data Interface, a, b int) {
    first := a
    lo := 0
    hi := b - a

    for i := (hi - 1) / 2; i >= 0; i-- {
        siftDown(data, i, hi, first)
    }

    for i := hi - 1; i >= 0; i-- {
        data.Swap(first, first+i)
        siftDown(data, lo, i, first)
    }
}

func siftDown(data Interface, lo, hi, first int) {
    root := lo
    for {
        child := 2*root + 1
        if child >= hi {
            break
        }
        if child+1 < hi && data.Less(first+child, first+child+1) {
            child++
        }
        if !data.Less(first+root, first+child) {
            return
        }
        data.Swap(first+root, first+child)
        root = child
    }
}
```

## Quick Sort

Quick sort applies a divide-and-conquer strategy. A pivot element is chosen (typically the first element). The array is partitioned so that all elements smaller than the pivot precede it and all larger elements follow it. The process recurses on the two sub-arrays.

The efficiency of quick sort depends heavily on pivot selection. If the pivot is near the minimum or maximum — as occurs in nearly sorted or reverse-sorted arrays — quick sort degrades to O(n²) behavior, effectively becoming bubble sort. The ideal pivot is near the median value.

- Time complexity: O(n log n) average; O(n²) worst case.
- Space complexity: O(1) auxiliary for the in-place partition.
- Unstable.

## Insertion Sort

Insertion sort builds a sorted sequence one element at a time. Each new element is inserted into its correct position within the already-sorted prefix.

Go's `sort` package implements an in-place variant that walks backward from the current element, swapping adjacent out-of-order pairs until the correct position is found:

```go
func insertionSort(data Interface, a, b int) {
    for i := a + 1; i < b; i++ {
        for j := i; j > a && data.Less(j, j-1); j-- {
            data.Swap(j, j-1)
        }
    }
}
```

- Time complexity: O(n²) average and worst case; O(n) best case.
- Space complexity: O(1).
- Stable.

## Value Swapping Techniques

Three methods for swapping two integer values were documented:

1. **Temporary variable** — store one value in a temporary variable, assign the second to the first, then restore the temporary to the second.
2. **XOR swap** — use the self-inverse property of XOR: `a = a ^ b; b = b ^ a; a = a ^ b`.
3. **Addition/subtraction** — `a = a + b; b = a - b; a = a - b`.

The XOR and arithmetic methods do not declare explicit temporary variables, but intermediate values still reside in CPU registers during computation.
