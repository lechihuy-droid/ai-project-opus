# Skim: Speculative Execution for Fast and Efficient Web Agents

**Source:** arxiv-ai
**URL:** https://arxiv.org/abs/2605.16565
**Published:** 2026-05-19 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.16565v1 Announce Type: new 
Abstract: Skim is a speculative execution framework for web agents that exploits the predictable structure of purpose-built websites. Today's web-agent expense is not intrinsic to the tasks but a property of how agents are composed: frontier-model inference, browser rendering, and ReAct-style planning are applied to every step of every task regardless of complexity. Skim's key observation is that websites enforce stable URL patterns, answer formats, and task-to-trajectory mappings across queries of the same type, so most queries can bypass these heavyweight components entirely. An offline profiler captures these patterns once per site. At runtime, Skim matches each query to a template, synthesizes the destination URL, and extracts the answer with a sm
