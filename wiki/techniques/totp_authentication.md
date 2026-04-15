---
title: TOTP Authentication
type: techniques
created: 2025-04-15
last_updated: 2025-04-15
related: ["[[API Security]]", "[[Go Tooling]]", "[[Web Architecture Concepts]]"]
sources: ["dcd9c5be4da0"]
---

# TOTP Authentication

In April 2025, the subject documented the design and implementation of Time-based One-Time Password (TOTP) authentication in Go.

## Overview

TOTP is a widely used two-factor authentication mechanism defined in RFC 6238. Both the server and the user's device (typically a mobile authenticator app) share a secret key and an accurate clock. They independently derive a short-lived numeric code from the key and the current time window, usually 30 seconds.

## Generation Flow

1. **Key generation** — a 160-bit random secret is created and stored on both sides.
2. **Timestamp normalization** — the current Unix timestamp is divided by the time step (e.g., 30) to produce an integer counter.
3. **HMAC** — the counter and secret are fed into HMAC-SHA1, producing a 20-byte digest.
4. **Dynamic truncation** — the last 4 bits of the final byte determine an offset. Four bytes starting at that offset are extracted and interpreted as a 32-bit unsigned integer.
5. **Modulo** — the integer is taken modulo 1 000 000 to yield a 6-digit code.

## Verification

When the user submits a code, the server repeats the same computation and compares the result. A small clock-skew tolerance (typically one step in either direction) is often allowed.

## Go Implementation

The subject used the `github.com/pquerna/otp/totp` package to handle the cryptography. Key generation and QR-code rendering for setup:

```go
key, err := totp.Generate(totp.GenerateOpts{
    Issuer:      "cyeam.com",
    AccountName: "test@cyeam.com",
    SecretSize:  32,
})
```

Validation is a single function call:

```go
valid := totp.Validate(passcode, key.Secret())
```

The provisioning URI used to generate the QR code follows the `otpauth://` scheme and includes the algorithm, digit count, issuer, period, and Base32-encoded secret.
