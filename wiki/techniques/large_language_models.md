---
title: Large Language Models
type: techniques
created: 2026-04-04
last_updated: 2026-04-04
related: ["[[OpenAI Integration]]", "[[Claude Code]]", "[[AI Assisted Development]]"]
sources: ["5bd9d11a54ab"]
---

# Large Language Models

In April 2026, the subject compiled a practical guide to selecting and deploying large language models (LLMs), covering architecture evolution, key metrics, and scenario-based recommendations.

## Historical Timeline

- **Pre-2017** — rule-based and statistical small models with limited long-text capability.
- **2017-2019** — Transformer architecture introduced self-attention and parallel training; GPT and BERT established the pre-train-and-fine-tune paradigm.
- **2020-2022** — GPT-3 demonstrated that scale yields emergent ability; ChatGPT applied RLHF to produce usable dialogue, bringing LLMs into mainstream use.
- **2023-present** — GPT-4 added native multimodality; open-source models proliferated; RAG and agent frameworks drove application adoption.

## Key Metrics

### Parameters

Parameter count determines the theoretical upper bound of knowledge capacity, reasoning depth, and generalization. Larger models do not automatically perform better if training quality is poor.

### Context Length

A longer context window improves performance on long documents, extended conversations, and complex RAG pipelines. For demanding use cases, 128K is a practical minimum; 256K or 1M is preferred.

### Architecture Families

| Architecture | Description | Strengths | Weaknesses | Examples |
|---|---|---|---|---|
| Transformer (Dense) | Standard attention-based architecture | Strong logic, stable reasoning, natural dialogue | Slower on very long texts, high compute cost | Llama, Qwen, GPT |
| Mamba (SSM) | State-space model that propagates state instead of full attention | Extremely fast on long contexts, memory-efficient | Slightly weaker on logic and math vs. Transformer | Mamba, Jamba |
| Hybrid Transformer-Mamba | Mixed layers combining both mechanisms | Balances reasoning quality and long-text speed | Complex structure, harder to train | Nemotron Nano |
| MoE (Mixture of Experts) | Activates only a subset of parameters per token | Fast inference, can scale to very large parameter counts | Potential instability and quality variance | Gemma 4, Qwen MoE, Mixtral |

### Embedding Models

Embedding models convert text into dense vectors for retrieval and similarity tasks. The subject recommends choosing dimensionality based on precision and latency needs:

| Dimensions | Typical Models | Best For |
|---|---|---|
| 128-384 | bge-small, m3e-small, text-embedding-3-small | Mobile, massive short text, cost-sensitive |
| 512-1024 | bge-base, m3e-base, text-embedding-3-large (base) | General RAG, enterprise knowledge bases |
| 1024-3072 | bge-large, text-embedding-3-large, gte-large | Legal, medical, scientific, high-recall |
| 3072+ | Research-only models | Rare niche use cases |

## Distillation vs. RAG

- **Knowledge Distillation** compresses a large teacher model into a smaller student model by transferring output distributions and reasoning patterns. Distilled models are fast and cheap but capped by the teacher's ability, often with a 10-15% performance loss.
- **Retrieval-Augmented Generation (RAG)** keeps the base model unchanged and injects retrieved external knowledge into the prompt. RAG extends knowledge boundaries without retraining but adds retrieval latency and token cost.

## Selection Guide

| Scenario | Priority | Architecture | Context | Parameters | Notes |
|---|---|---|---|---|---|
| Local/edge deployment | Size > architecture > context | Dense or hybrid | ≤32K | 1B-7B | Prefer quantized (int4/int8) models |
| Daily chat/light Q&A | Experience > cost > size | Any dense or MoE | 8K-32K | 3B-14B | Avoid 70B+ for simple tasks |
| Long docs / RAG | Context > architecture > size | Hybrid or long-context Transformer | ≥128K | 7B-32B | Avoid <32K context |
| Code development | Reasoning > architecture > tools | Dense Transformer | 32K-128K | 13B-34B | Verify tool-call compatibility |
| Multimodal (image/video) | Modality > context > architecture | Hybrid multimodal | 64K-128K | 7B-14B | Avoid "pseudo-multimodal" text+vision plugins |
| Complex reasoning/math | Reasoning > architecture > size | Dense Transformer | 32K-128K | 34B-70B+ | Avoid small MoE or pure Mamba |
| Vertical domains | Domain fit > architecture > size | Domain-finetuned dense | 32K-128K | 7B-14B | General models hallucinate more on specialized tasks |
| Free prototyping | Cost > usability > capability | Mature free-tier models | As large as available | Any | Watch for rate limits and capability cuts |
