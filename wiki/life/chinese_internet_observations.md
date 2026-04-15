---
title: Chinese Internet Observations
type: life
created: 2010-11-03
last_updated: 2015-09-11
related: ["[[Linux Gaming with Dota 2]]", "[[Reading and Self-Discovery]]", "[[Waves at the Peak]]"]
sources: ["83ee06ab88d3", "5fa9315978a5", "22c7703c3219"]
---

# Chinese Internet Observations

## The 3Q War

In November 2010, the subject wrote about the conflict between Qihoo 360 and Tencent, known as the "3Q War." The entry traced Zhou Hongyi's career from his time at Yahoo, where he led development of the 3721 malware plugin, to his founding of Qihoo and creation of 360 Safe Guard, which targeted the very software he had helped create (later renamed Yahoo Assistant).

Zhou's explanation for this contradiction was that he had opened Pandora's box and intended to close it himself.

The 2010 escalation involved 360's release of a privacy protector, sparking another public feud with Tencent. The subject viewed both companies unfavorably: 360 for offering a free antivirus that could not handle serious threats, and Tencent for copying competitors, tolerated only because of the user's social network being trapped on the platform.

## WeChat and the Tencent Empire

In May 2014, the subject analyzed Tencent's newly created WeChat Business Group, which elevated WeChat to the same strategic status as QQ. The subject quoted WeChat president Zhang Xiaolong's stated principles: do what is valuable to users, maintain the team's own values, keep teams small and agile, prioritize learning and fast iteration over past experience, think in systems, let users bring users through word of mouth, and value critical thinking over blind execution.

The subject argued that WeChat had leapfrogged China's three major telecom carriers and could change the country's communication patterns. What stood out most was the public account ecosystem, which transformed WeChat from a simple instant-messaging tool into a content-consumption platform.

The subject also analyzed Tencent's deliberate separation of WeChat from QQ. After WeChat 5.0, registration by QQ number was discontinued. The reasoning, in the subject's view, was to escape Tencent's traditional user base of children and less-developed regions, a demographic that would drag WeChat down to QQ's level. The subject concluded that a product cannot serve every user type, and that sacrificing the low-end user base was necessary to build a world-changing product.

## Alibaba and Baidu

The subject contrasted Tencent with Alibaba, praising Alibaba for serving the social middle class through Taobao and Alipay. Yu'e Bao (余额宝) was cited as a product that had forced large banks to raise demand-deposit interest rates roughly tenfold. Alibaba's IPO was imminent at the time of writing, with projections placing it as the fourth-most-valuable company globally.

Baidu was viewed far more critically. The subject described Baidu's core loyal users as "otaku" and its main product as adult video, citing Baidu Xiala, Baidu Player, and Baidu Netdisk. Internal problems at Baidu — executive self-dealing and inter-departmental infighting — were identified as the root cause of its mobile failures. A Robin Li internal email demanding 10 a.m. arrival and "wolf spirit" was dismissed as scapegoing ordinary employees for leadership failures.

## Developer Workarounds for Restricted Access

In September 2015, the subject documented the difficulty of accessing Go's official documentation from mainland China. Because golang.org was blocked, checking documentation or downloading updates required workarounds such as using Bing's cached pages or locating alternative download mirrors.

To solve the problem locally, the subject downloaded the entire Go package documentation site with `wget` and hosted it on a personal VPS with CDN acceleration:

```bash
wget -r -p -np -k http://URL
```

The flags used were:

- `-r` — recursive download.
- `-p` — download all images and assets referenced by the HTML.
- `-np` — do not ascend to parent directories.
- `-k` — convert relative links to absolute links.

The subject compared this practice to reports of Cuban internet users downloading entire websites onto USB drives to circumvent government blocking, noting the parallel between developers in restricted-network environments.
