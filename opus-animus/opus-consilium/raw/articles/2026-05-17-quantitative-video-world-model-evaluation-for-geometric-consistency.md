# Quantitative Video World Model Evaluation for Geometric-Consistency

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.15185
**Published:** 2026-05-17 13:42 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** Quantitative Video World Model Evaluation giúp đánh giá mô hình video -> đọc và lưu để nghiên cứu sau

Generative video models are increasingly studied as implicit world models, yet evaluating whether they produce physically plausible 3D structure and motion remains challenging. Most existing video evaluation pipelines rely heavily on human judgment or learned graders, which can be subjective and weakly diagnostic for geometric failures. We introduce PDI-Bench (Perspective Distortion Index), a quantitative framework for auditing geometric coherence in generated videos. Given a generated clip, we obtain object-centric observations via segmentation and point tracking (e.g., SAM 2, MegaSaM, and CoTracker3), lift them to 3D world-space coordinates via monocular reconstruction, and compute a set of projective-geometry residuals capturing three failure dimensions: scale-depth alignment, 3D motion | 👍 1
