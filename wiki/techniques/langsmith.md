---
title: LangSmith
type: techniques
created: 2025-05-29
last_updated: 2025-05-29
related: ["[[OpenAI Integration]]", "[[Model Context Protocol]]", "[[Go Tooling]]"]
sources: ["e6bca18cd82c"]
---

# LangSmith

In May 2025, the subject evaluated LangSmith, a platform by LangChain for observability, evaluation, and prompt management in LLM applications.

## Capabilities

LangSmith provides three main features:

- **Observability** — traces and logs of every LLM call, enabling latency analysis, dashboarding, and alerting.
- **Evaluation** — automated scoring of production traffic against test sets.
- **Prompt engineering** — version-controlled prompt iteration with side-by-side comparison.

## Python Integration

Python applications can enable tracing automatically by setting environment variables before importing LangChain:

```python
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGSMITH_API_KEY"] = "..."
os.environ["LANGSMITH_PROJECT"] = "..."
```

## Go Integration

The official `langchaingo` package does not include built-in LangSmith tracing. The subject adopted a community client (`github.com/devalexandre/langsmithgo`) to manually record runs:

```go
runId := uuid.New().String()
smith.Run(&langsmithgo.RunPayload{
    RunID:   runId,
    Name:    "langsmithgo-chain",
    RunType: langsmithgo.Chain,
    Inputs: map[string]interface{}{
        "prompt": prompt,
    },
})

// after LLM response
smith.PatchRun(runId, &langsmithgo.RunPayload{
    Outputs: map[string]interface{}{
        "output": output,
    },
})
```

This manual approach requires the caller to book-end the LLM call with `Run` and `PatchRun`, but it still produces a complete trace in the LangSmith UI.
