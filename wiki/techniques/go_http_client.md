---
title: Go HTTP Client
type: techniques
created: 2019-03-15
last_updated: 2019-03-15
related: ["[[HTTP Protocol Analysis]]", "[[Go Tooling]]", "[[Go Modules]]", "[[Linux Network Troubleshooting]]"]
sources: ["db9c15cbe0bd"]
---

# Go HTTP Client

In March 2019, the subject documented how to send `multipart/form-data` requests and upload files using Go's standard library.

## Sending Multipart Form Data

The `mime/multipart` package provides a `Writer` that encodes form fields into a request body:

```go
bodyBuf := &bytes.Buffer{}
bodyWriter := multipart.NewWriter(bodyBuf)
_ = bodyWriter.WriteField("param", string(param))
defer bodyWriter.Close()

req, err := http.NewRequest("POST", callbackUrl, bodyBuf)
if err != nil {
    return nil, err
}
req.Header.Set("Content-Type", bodyWriter.FormDataContentType())

resp, err := http.DefaultClient.Do(req)
if err != nil {
    return nil, err
}
defer resp.Body.Close()
```

Setting `Content-Type` to `bodyWriter.FormDataContentType()` is required so the server can parse the boundary separating each form part.

## Uploading Files

Files are attached with `CreateFormFile`, which automatically sets the correct `Content-Type` for the file part:

```go
fileWriter, _ := bodyWriter.CreateFormFile("file", filename)
io.Copy(fileWriter, file)
```
