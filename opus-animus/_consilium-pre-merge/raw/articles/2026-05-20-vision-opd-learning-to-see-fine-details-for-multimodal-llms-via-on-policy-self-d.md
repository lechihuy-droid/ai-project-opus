# Vision-OPD: Learning to See Fine Details for Multimodal LLMs via On-Policy Self-Distillation

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.18740
**Published:** 2026-05-19 18:01 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Multimodal Large Language Models (MLLMs) still struggle with fine-grained visual understanding, where answers often depend on small but decisive evidence in the full image. We observe a regional-to-global perception gap: the same MLLM answers fine-grained questions more accurately when conditioned on evidence-centered crops than on the corresponding full images, suggesting that many failures stem from difficulty to focus on relevant evidence rather than insufficient local recognition ability. Motivated by this observation, we propose Vision-OPD (Vision On-Policy Distillation), a regional-to-global self-distillation framework that transfers the model's own privileged regional perception to its full-image policy. Vision-OPD instantiates two conditional policies from the same MLLM: a crop-con | 👍 1
