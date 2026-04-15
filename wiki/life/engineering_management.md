---
title: Engineering Management
type: life
created: 2023-09-28
last_updated: 2025-01-06
related: ["[[Technology Observations]]", "[[JD]]", "[[Chinese Internet Observations]]", "[[Incident Response]]"]
sources: ["ec713bcf45fe", "17ea18383d35", "49b88f8b624e", "ba08cab4472a", "30fafdabe41a"]
---

# Engineering Management

The subject documented reflections on transitioning from individual contributor to engineering leader, covering planning, team operations, platform strategy, conflict resolution, and large-scale refactoring.

## Adapting to a Leadership Role

In September 2023, the subject described the challenges of moving into management without formal training. The transition is often gradual—more responsibilities accumulate until one day the role involves assigning work, writing roadmaps, and resolving cross-team disputes. The subject identified impostor syndrome as a common reaction and recommended *The Making of a Manager* as a practical guide for navigating the shift.

### Three Core Responsibilities

Management responsibilities were grouped into three areas:

1. **Purpose** — the team's goals and roadmap. Everyone should understand what success looks like and believe it is achievable.
2. **People** — whether the team has the right skills and headcount, and what to do if gaps exist.
3. **Process** — how the team collaborates, including meetings, rituals, and cultural norms.

## Planning and Strategy

The subject argued that effective planning does not require having done the exact work before. Instead, the leader acts as a consultant: gather business goals, understand the full landscape, and derive a coherent technical plan.

### Key Steps

1. **Collect business goals** — talk directly to business and product stakeholders to get first-hand context and avoid information loss.
2. **Map the business landscape** — understand how the business operates end-to-end, using frameworks such as MECE and pyramid structuring to produce a clear architecture diagram.
3. **Derive technical goals** — only after steps 1 and 2 are complete should technical planning begin.

The subject recommended *The McKinsey Edge* for structured strategic thinking.

## Platform Strategy

In March 2024, the subject reflected on building internal platforms. Platforms are meant to consolidate reusable capabilities so new business lines can launch faster, but they often fail when the underlying business is still exploring and changing rapidly.

The subject concluded that there are two valid paths:

- **Business-first** — move fast and support specific cases; suitable for early-stage exploration.
- **Platform-first** — invest in reusable abstractions; suitable for mature, stable domains.

Attempting both simultaneously tends to produce "neither-fish-nor-fowl" systems that are slow to develop and hard to maintain. Platforms should emerge from supporting multiple vertical businesses and extracting common patterns, rather than being designed top-down in isolation.

## Resolving Team Overlap

Also in March 2024, the subject wrote about inter-team conflict over scope and ownership. Overlap usually occurs when two teams share the same objective and senior leadership has not clarified boundaries.

### Tactics for Resolution

1. **Exchange proposals** — use design documents and process discussions to surface each side's real intent and bottom line.
2. **Negotiate** — if interests conflict, seek trade-offs that are acceptable to both sides.
3. **Escalate** — when negotiation fails, raise the issue to the relevant managers.
4. **Enlist allies** — product or business partners can often influence outcomes more effectively than engineering alone.

The subject noted that persistent overlap is usually a symptom of organizational design problems. If the issue cannot be resolved at the leadership level, it may be a signal to leave the team.

## Code Isolation for Large Refactoring

In April 2024, the subject advocated for code isolation as the safer approach when refactoring large systems with unclear layer boundaries. When a core model changes and propagates through web, handler, service, DAO, and model layers, two strategies exist:

1. **In-place compatibility** — add branching logic at every layer to support both old and new models.
2. **Code isolation** — build a parallel stack from web to model and switch traffic gradually.

The subject recommended code isolation despite its perceived simplicity, because it minimizes risk. Isolated code paths can be guarded with feature flags and rolled out incrementally. If something goes wrong, rollback is localized and straightforward. In-place compatibility, while more elegant on paper, multiplies regression risk and makes data remediation difficult when edge cases are missed.

## Architect Role Reflections

In January 2025, the subject reflected on a year spent in a staff-architect position supporting a several-hundred-person engineering organization. The role required moving from designing systems for a single team to influencing cross-team architecture, building credibility without direct authority.

### Scope of Work

The subject grouped the architect's responsibilities into five areas:

1. **Design reviews** — evaluating proposals and adjusting data models or call chains. This was the easiest part because it relied on technical depth the subject already possessed.
2. **Requirement problems** — untangling product and business requirements that created architectural debt. The subject's approach was to start with concrete cases, learn the business flow and stakeholders, and gradually build enough context to propose technical solutions in business terms.
3. **Arbitration** — acting as a neutral judge when teams disagreed on architecture. The subject emphasized aligning decisions with leadership's stated principles and escalating when uncertain.
4. **Governance** — documenting post-incident runbooks, ownership matrices, and process guides so that fixes would not degrade over time.
5. **Reporting** — keeping leadership informed of progress, risks, and team sentiment. The subject credited regular 1:1 syncs with the manager for creating the space needed to succeed.

The subject concluded that the year had exceeded personal expectations: a major architecture upgrade was shipped with full observability, and several business initiatives were steered toward technically sound outcomes.
