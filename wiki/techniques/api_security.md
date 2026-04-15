---
title: API Security
type: techniques
created: 2014-08-18
last_updated: 2017-10-27
related: ["[[beego]]", "[[Hash Functions]]", "[[Web Architecture Concepts]]", "[[HTTP Protocol Analysis]]"]
sources: ["0143d8a07a20", "3d9de70ed23f"]
---

# API Security

API security mechanisms ensure that requests are authentic, unmodified, and fresh. A common approach combines HMAC-SHA1 signatures with timestamp validation.

## HMAC-SHA1

HMAC-SHA1 is a keyed hash algorithm. It mixes a secret key with the message data, hashes the mixture with SHA1, mixes the result with the key again, and hashes once more. The output is a 160-bit digest.

Because SHA1 alone is deterministic and vulnerable to brute-force reversal, HMAC adds a secret key. Without the key, the signature cannot be reproduced or forged.

## Request Signing Flow

1. The client collects request parameters, appends a timestamp, and concatenates them with the secret key.
2. The client computes an HMAC-SHA1 signature over the concatenated string.
3. The client sends the parameters, timestamp, and signature to the server.
4. The server independently recomputes the signature using its own copy of the secret key.
5. If the signatures match and the timestamp is within an acceptable window (e.g., 10 minutes), the request is authorized.

This design prevents parameter tampering: changing any parameter invalidates the signature.

## beego Filter Implementation

The subject implemented signature validation as a beego filter positioned at `BeforeRouter`:

```go
func FilterOauth(ctx *context.Context) {
    timestamp, err := strconv.ParseInt(ctx.Input.Query("timestamp"), 10, 64)
    if err != nil {
        ctx.Abort(http.StatusUnauthorized, "")
    }
    timestamp_t := time.Unix(timestamp, 0)
    if time.Now().Sub(timestamp_t).Minutes() > 10 {
        ctx.Abort(http.StatusUnauthorized, "")
    }

    size := ctx.Input.Query("size")
    sign := ctx.Input.Query("sign")
    if size == "" || sign == "" {
        ctx.Abort(http.StatusUnauthorized, "")
    }

    if !CheckMAC(size+timestamp_t.String(), sign, "seckey") {
        ctx.Abort(http.StatusUnauthorized, "")
    }
}
```

## Signature Verification

```go
func CheckMAC(message, sign, key string) bool {
    mac := hmac.New(sha1.New, []byte(key))
    mac.Write([]byte(message))
    return hex.EncodeToString(mac.Sum(nil)) == sign
}
```

The `encoding/hex` package converts the raw `[]byte` digest into a readable hexadecimal string for comparison.

## JSONP and XSS Risks

In October 2017, the subject analyzed security issues surrounding JSONP (JSON with Padding). JSONP wraps a JSON response inside a JavaScript function call specified by a `callback` query parameter. While this enables cross-domain data retrieval, it introduces an injection vector: the callback name is embedded directly into the response body.

If a JSONP endpoint is accessed directly in a browser (rather than through an AJAX library that validates the callback), the response is rendered according to its `Content-Type`. When `Content-Type` is `text/html`, any HTML or script injected via the callback parameter will execute in the user's browser, creating a cross-site scripting (XSS) vulnerability.

Mitigations documented by the subject include:

- **Strict Content-Type** — return `application/json` and never `text/html` for API responses.
- **Callback validation** — restrict the callback parameter to alphanumeric characters.
- **Callback encoding** — escape the callback string before embedding it:
  ```go
  callback = template.JSEscapeString(callback)
  ```
- **Length limits** — enforce a maximum length on the callback parameter as a secondary defense.

The subject recommended solving cross-origin requirements with same-origin proxies or CORS rather than JSONP whenever possible.
