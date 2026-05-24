# More Thinking, More Bias: Length-Driven Position Bias in Reasoning Models

**Source:** arxiv-ai
**URL:** https://arxiv.org/abs/2605.06672
**Published:** 2026-05-11 04:00 UTC
**Topic:** AI
**Tier:** 2
**Goal-Score:** 4
**Relevance:** Phát hiện về Length-Driven Position Bias -> FPT có thể nghiên cứu và áp dụng cho dịch vụ AI

arXiv:2605.06672v1 Announce Type: new 
Abstract: Chain-of-thought (CoT) reasoning and reasoning-tuned models such as DeepSeek-R1 are commonly assumed to reduce shallow heuristic biases by thinking carefully. We test this on position bias in multiple-choice QA and find a different story: within any reasoning-capable model, per-question position bias scales with the length of the reasoning trajectory.
  Across thirteen reasoning-mode configurations (two R1-distilled 7-8B models, two base models prompted with CoT, and DeepSeek-R1 at 671B) on MMLU, ARC-Challenge, and GPQA, twelve show a positive partial correlation between trajectory length and Position Bias Score (PBS) after controlling for accuracy, ranging from 0.11 to 0.41 (all p < 0.05). All twelve open-weight reasoning-mode configuration
