---
title: Incident Response
type: life
created: 2024-11-26
last_updated: 2024-11-26
related: ["[[Engineering Management]]", "[[Technology Observations]]"]
sources: ["61a715d83110"]
---

# Incident Response

In November 2024, the subject documented a standard operating procedure for handling production incidents, emphasizing rapid response and clear escalation paths.

## Response Targets

The stated goal is:

- **5 minutes** — acknowledge the alert.
- **30 minutes** — stop the bleeding (mitigate customer impact).
- **Same day** — deploy a fix.
- **3 days** — post-mortem and action items.

The subject noted that incident severity is measured primarily by duration of impact, not by root-cause complexity. A fast response with a prepared playbook can reduce a potential major outage to a non-event.

## General Workflow

1. **Detection and triage** — confirm the symptom, identify the affected module, check for recent deployments, and estimate the blast radius.
2. **Communication** — for large or ambiguous incidents, pull a war-room chat with relevant engineering, product, QA, and business stakeholders. The engineer focuses on mitigation; product handles external communication.
3. **Mitigation** — roll back code, revert configuration, or apply partial fixes (for example, killing slow queries or adding rate limits) immediately rather than waiting for a perfect solution.
4. **Fix and verification** — drive the bug fix to completion, check whether data remediation is needed, and ensure QA signs off.
5. **Post-mortem** — construct a timeline, evaluate whether alerts fired early enough, and file follow-up tasks.

## Alert Design

Alerts are split into two categories:

- **Business alerts** — metrics that directly reflect user harm, such as order-failure rate or revenue drop. These are treated as critical and require 100% response within five minutes.
- **Technical alerts** — infrastructure signals such as CPU load or gateway rate limiting. These are used for root-cause analysis when a business alert fires, but do not warrant the same urgency if no business impact is present.

The subject recommended keeping the number of critical alerts small—roughly one per key system on the critical path—to avoid alert fatigue and preserve response discipline.
