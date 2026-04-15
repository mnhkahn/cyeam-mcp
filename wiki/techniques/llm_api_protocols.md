---
title: LLM API Protocols
type: techniques
created: 2026-04-14
last_updated: 2026-04-14
related: ["[[OpenAI Integration]]", "[[Claude Code]]", "[[Large Language Models]]"]
sources: ["82ee36654bc8"]
---

# LLM API Protocols

In April 2026, the subject compared three major LLM API interface families, analyzing their request formats, streaming behavior, and error-handling characteristics.

## Interface Comparison

| Endpoint | Protocol | Official Standard | Primary Use Case | Stability | Ecosystem |
|---|---|---|---|---|---|
| `/v1/messages` | Claude native | Anthropic Messages API | Long-context dialogue, reasoning chains, system prompts | High | Claude ecosystem, thinking support |
| `/v1beta/` | Google native beta | Google Antigravity Beta | Agent execution, code actions, multimodal | Medium (beta) | Google native toolchain |
| `/v2/chat/completions` | OpenAI-compatible | OpenAI Chat Completions | General chat, function calling | High | Cursor, Continue, LangChain, etc. |

## Request Structure

- **Claude** elevates the system prompt to a top-level field, decoupling it from the message history. This affects token accounting and alignment behavior in multi-turn conversations.
- **OpenAI** places the system message inside the `messages` array. Some OpenAI models (such as `o1`) may ignore or deprioritize system messages compared with Claude.

## Streaming Responses

Claude's Server-Sent Events (SSE) stream provides the richest event semantics. Clients can track the lifecycle of individual content blocks, which is useful for rendering thinking steps separately from final answers. OpenAI's SSE format is simpler and more widely supported by third-party clients.

## Error Handling and Rate Limits

All three services return HTTP 429 for rate limiting. Recommended backoff strategies:

- **Claude** — 429 / 529: exponential backoff.
- **Google** — 429 / 503: exponential backoff.
- **OpenAI** — 429: exponential backoff.

## Selection Guidance

- If the upstream client already speaks OpenAI format (Cursor, Continue, ChatGPT clients), `/v2/chat/completions` minimizes migration effort.
- For deep-reasoning agents that need to expose or control thinking budgets, Claude native `/v1/messages` is the most complete option.
- For very long context (>200K tokens) or native multimodal execution (video, audio, code execution), Google's beta endpoint offers architectural advantages.
