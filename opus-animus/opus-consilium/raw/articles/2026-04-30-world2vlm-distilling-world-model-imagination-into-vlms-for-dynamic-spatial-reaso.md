# World2VLM: Distilling World Model Imagination into VLMs for Dynamic Spatial Reasoning

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2604.26934
**Published:** 2026-04-30 03:37 UTC
**Topic:** AI

Vision-language models (VLMs) have shown strong performance on static visual understanding, yet they still struggle with dynamic spatial reasoning that requires imagining how scenes evolve under egocentric motion. Recent efforts address this limitation either by scaling spatial supervision with synthetic data or by coupling VLMs with world models at inference time. However, the former often lacks explicit modeling of motion-conditioned state transitions, while the latter incurs substantial computational overhead. In this work, we propose World2VLM, a training framework that distills spatial imagination from a generative world model into a vision-language model. Given an initial observation and a parameterized camera trajectory, we use a view-consistent world model to synthesize geometrical
