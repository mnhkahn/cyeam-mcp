---
title: BaiduYunPush
type: project
created: 2014-06-11
last_updated: 2014-07-08
related: ["[[beego]]", "[[Android Development]]"]
sources: ["ccd5bb601b3e", "b428c7306524"]
---

# BaiduYunPush

BaiduYunPush is a Go language library written by the subject to interact with Baidu Cloud Push via its REST API. The project is hosted on GitHub.

## Motivation

In mid-2014, the subject needed push notification capabilities for an Android graduation project. Because Google Cloud Messaging was unavailable in China, the subject chose Baidu Cloud Push as an alternative. Baidu provided SDKs for PHP, Java, Python, Node.js, and C#, but not for Go. The subject decided to implement a Go client using the REST API.

## Initial Development

The first version, completed in June 2014, implemented only the simplest group-push notification feature. More advanced capabilities such as targeted ID pushes, custom notification layouts, and web-page redirects were left for future expansion.

A significant hurdle was the request signature algorithm. Baidu requires an MD5 signature computed according to specific rules. The subject initially failed to reproduce the signature using JavaScript's `encodeURI` and online MD5 tools. After debugging a Java SDK by OopsWare and capturing its signature output, the subject was able to match the algorithm in Go.

## Public Release

By July 2014, the subject had packaged the code into a reusable Go library installable with:

```bash
go get github.com/mnhkahn/BaiduYunPush
```

Usage requires an API key and secret key:

```go
push := BaiduYunPush.New(apikey, seckey)
s, err := push.Push("推送成功", "这是我的个人博客blog.cyeam.com")
```

When the call returns `true`, the push is accepted by Baidu's servers and will be delivered to devices bound via the Android SDK.

## Observations on Android

While integrating the Baidu Push SDK, the subject noted that the SDK's `libs` folder contained three architecture-specific subdirectories. The subject criticized Android's fragmented hardware ecosystem, observing that NDK-based development required triple the binary size compared to iOS and made chip-level optimization difficult. This fragmentation, in the subject's view, explained why Android lacked large-scale premium applications.
