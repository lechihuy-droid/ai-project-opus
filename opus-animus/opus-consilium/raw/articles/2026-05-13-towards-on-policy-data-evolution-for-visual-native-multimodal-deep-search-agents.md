# Towards On-Policy Data Evolution for Visual-Native Multimodal Deep Search Agents

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.10832
**Published:** 2026-05-12 15:48 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 4
**Relevance:** Tiến gần đến sự phát triển dữ liệu trực tuyến. -> Tận dụng cho dự án AI-augmented SDLC

Multimodal deep search requires an agent to solve open-world problems by chaining search, tool use, and visual reasoning over evolving textual and visual context. Two bottlenecks limit current systems. First, existing tool-use harnesses treat images returned by search, browsing, or transformation as transient outputs, so intermediate visual evidence cannot be re-consumed by later tools. Second, training data is usually built by fixed curation recipes that cannot track the target agent's evolving capability. To address these challenges, we first introduce a visual-native agent harness centered on an image bank reference protocol, which registers every tool-returned image as an addressable reference and makes intermediate visual evidence reusable by later tools. On top of this harness, On-po
