---
title: OpenAI Integration
type: techniques
created: 2025-05-21
last_updated: 2025-05-21
related: ["[[Model Context Protocol]]", "[[LangSmith]]", "[[Go HTTP Client]]"]
sources: ["5e89186e5bdd"]
---

# OpenAI Integration

In May 2025, the subject built a small news-summarization service ("Geek Headlines") by integrating an OpenAI-compatible LLM API into a Go application.

## Architecture

The pipeline consists of three stages:

1. **Tool call** — an MCP `tech_news` tool fetches the latest technology article URLs.
2. **Prompt generation** — an MCP `tech_news_prompt` tool formats the URLs into a summarization prompt.
3. **LLM inference** — the prompt is sent to the model, and the markdown response is rendered to HTML.

## Client Setup

The subject used the official `github.com/openai/openai-go` client with a third-party provider (SiliconFlow) as the base URL:

```go
aiClient = openai.NewClient(
    option.WithBaseURL("https://api.siliconflow.cn/v1"),
    option.WithAPIKey("ApiKey"),
)
```

## Chat Completion Parameters

A chat request is constructed with a message list, model name, optional tool definitions, and a seed for reproducibility:

```go
params := openai.ChatCompletionNewParams{
    Messages: []openai.ChatCompletionMessageParamUnion{
        openai.UserMessage(promptMsg),
    },
    Model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
    Tools: ts,
    Seed:  openai.Int(0),
}
chatCompletion, err := aiClient.Chat.Completions.New(ctx, params)
```

## Finish Reasons

The `FinishReason` field indicates why the model stopped generating:

- `stop` — natural end of the response.
- `length` — token limit reached.
- `content_filter` — output blocked by a safety filter.
- `tool_calls` — the model chose to invoke a tool.

## Rendering Markdown

Because the model returns markdown, the subject converted it to HTML with `github.com/gomarkdown/markdown` and rendered it safely in a Go template using `template.HTML`.

## Observations

The subject found that structured output formats such as JSON were unreliable with smaller models; plain markdown with simple instructions produced more consistent summaries. The subject also noted that LangChainGo and its MCP adapter were promising next steps for formalizing the agent workflow.
