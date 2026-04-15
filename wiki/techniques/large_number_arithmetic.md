---
title: Large Number Arithmetic
type: techniques
created: 2014-08-15
last_updated: 2014-08-15
related: ["[[Go Strings]]", "[[Go Slices]]"]
sources: ["94c8c833a2eb"]
---

# Large Number Arithmetic

When integers exceed the capacity of native types, arbitrary-precision arithmetic can be implemented on decimal strings or digit arrays.

## Multiplication by Vertical Addition

Large number multiplication follows the grade-school column method. Each digit of the multiplicand is multiplied by each digit of the multiplier, and the partial results are offset by position and summed.

### Algorithm

1. Reverse both input strings so that the least significant digit is at index 0.
2. Allocate a result byte slice of length `len(a) + len(b)`.
3. For each pair of digits at indices `i` and `j`, accumulate the product into `c[i+j]`.
4. Handle carries in a second pass.
5. Reverse the result string to restore most-significant-first order.

```go
func LargeNumberMultiplication(a string, b string) string {
    a = strings.Reverse(a)
    b = strings.Reverse(b)
    c := make([]byte, len(a)+len(b))

    for i := 0; i < len(a); i++ {
        for j := 0; j < len(b); j++ {
            c[i+j] += (a[i] - '0') * (b[j] - '0')
        }
    }

    var plus byte = 0
    var result string
    for i := 0; i < len(c); i++ {
        if c[i] == 0 {
            break
        }
        temp := c[i] + plus
        plus = 0
        if temp > 9 {
            plus = temp / 10
            result += string(temp - plus*10 + '0')
        } else {
            result += string(temp + '0')
        }
    }
    return strings.Reverse(result)
}
```

Character-to-digit conversion uses `a[i] - '0'`, and digit-to-character conversion uses `temp + '0'`.
