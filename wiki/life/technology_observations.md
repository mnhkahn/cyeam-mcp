---
title: Technology Observations
type: life
created: 2015-01-14
last_updated: 2026-04-09
related: ["[[Chinese Internet Observations]]", "[[AI Assisted Development]]", "[[Large Language Models]]"]
sources: ["afc0ea97248c", "e758d1dd0c51"]
---

# Technology Observations

## Beijing Subway Video System

In January 2015, the subject observed that the in-train video displays on Beijing Subway Line 8 were running VLC media player on what appeared to be a Windows XP system. The VLC taskbar was occasionally visible at the bottom of the screen.

The subject speculated that the system worked as follows: a central control room monitored train location and dynamically composed video streams that included both entertainment content and real-time station announcements. The composed stream was then transmitted to each train via a streaming protocol (such as RTSP or RTP) and played by the VLC client in each carriage.

This architecture decouples content management from train operation: the driver does not need to manage displays, and content updates can be pushed centrally rather than being copied to each train individually. Occasional stuttering in both the video and the station announcements supported the hypothesis that the feed originated from a remote source rather than a local file.

## LLM Capability Boundaries

In April 2026, the subject reflected on the practical limits of large language models. Despite their generative power, LLMs are poorly suited to high-frequency, high-volume repetitive tasks. The subject encountered this boundary while attempting to batch-upload hundreds of images through LLM-based tools (MCP and direct API calls). The results were unreliable: some agents began returning incorrect addresses after a small number of uploads, and progress was slow due to API rate limits and accumulated latency. The task was ultimately completed more reliably with a traditional shell script.

The subject concluded that LLMs excel at single-turn, logic-intensive, reasoning tasks, while traditional scripts or dedicated tools remain superior for high-frequency, mechanical, bulk-processing workflows.
