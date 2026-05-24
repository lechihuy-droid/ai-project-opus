# From Seeing to Thinking: Decoupling Perception and Reasoning Improves Post-Training of Vision-Language Models

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.20177
**Published:** 2026-05-21 00:40 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Recent advances in vision-language models (VLMs) emphasize long chain-of-thought reasoning; yet, we find that their performance on visual tasks is primarily limited by a lack of visual perception as opposed to reasoning itself. In this work, we systematically study the interplay between perception and reasoning in VLM post-training by decomposing their capabilities into three separate training stages: visual perception, visual reasoning, and textual reasoning, incorporating specialized training data. We demonstrate that visual perception (a) requires targeted optimization with specialized data; (b) serves as a fundamental scaffold that should be solidified through staged training before refining visual reasoning; and (c) is more effectively learned via RL than caption-based SFT. Our experi | 👍 1
