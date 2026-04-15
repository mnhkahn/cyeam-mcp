---
title: Go Concurrent Downloads
type: techniques
created: 2015-07-02
last_updated: 2015-07-02
related: ["[[HTTP Protocol Analysis]]", "[[Go Concurrency]]"]
sources: ["aaa2d9081758"]
---

# Go Concurrent Downloads

In July 2015, the subject implemented a concurrent file downloader in Go using HTTP range requests. The goal was to study how multi-part downloads and resume capability work at the protocol level.

## HTTP Range Requests

HTTP supports partial content retrieval through the `Range` header. A server that supports ranges advertises this with the `Accept-Ranges: bytes` response header. The client can then request specific byte ranges:

```
Range: bytes=0-511
```

Before downloading, the client can issue a `HEAD` request to obtain metadata (file size, filename, range support) without fetching the body:

```go
req, _ := http.NewRequest("HEAD", url, nil)
resp, _ := client.Do(req)
contentLength := resp.ContentLength
mediaType, params, _ := mime.ParseMediaType(resp.Header.Get("Content-Disposition"))
filename := params["filename"]
```

## Concurrent Download Strategy

The file is divided into chunks. For each chunk, a separate goroutine issues a `GET` request with the corresponding `Range` header and writes the response to a temporary file named after the byte range (for example, `file.jpg.0-511`). Once all chunks finish, the temporary files are concatenated into the final file.

## Synchronization with sync.WaitGroup

The subject used `sync.WaitGroup` to block the main goroutine until all download workers complete:

```go
var wg sync.WaitGroup
for i := range downloadRanges {
    wg.Add(1)
    go func(index int) {
        defer wg.Done()
        // download chunk
    }(i)
}
wg.Wait()
```

## Resume Support

If a download is interrupted, the temporary files retain the already-fetched bytes. Before restarting, the tool checks the size of each temporary file via `os.FileInfo` and adjusts the range start offset to skip the completed portion:

```go
fi, err := tempFile.Stat()
if err == nil {
    downloadRange[i][0] += int(fi.Size())
}
```

## Limitations

The subject noted that the prototype was not suitable for production use because it lacked dynamic work-stealing (completed workers could not pick up remaining chunks), optimal chunk sizing, and fallback servers for hosts that do not support range requests.
