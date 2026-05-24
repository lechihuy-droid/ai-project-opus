# Stage-adaptive Token Selection for Efficient Omni-modal LLMs

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.20035
**Published:** 2026-05-20 11:44 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Omni-modal large language models (om-LLMs) achieve unified audio-visual understanding by encoding video and audio into temporally aligned token sequences interleaved at the window level. However, processing these dense non-textual tokens throughout the LLM incurs substantial computational overhead. Although training-free token selection can reduce this cost, existing methods either focus on visual-only inputs or prune om-LLM tokens only before the LLM with fixed per-modality ratios, failing to capture how cross-modal token importance evolves across layers. To address this limitation, we first analyze the layer-wise token dependency of om-LLMs. We find that visual and audio dependencies follow a block-wise pattern and gradually weaken with depth, indicating that many late-layer non-textual  | 👍 1
