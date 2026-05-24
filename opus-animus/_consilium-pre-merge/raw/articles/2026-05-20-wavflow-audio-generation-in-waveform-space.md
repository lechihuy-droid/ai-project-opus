# WavFlow: Audio Generation in Waveform Space

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.18749
**Published:** 2026-05-19 18:01 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Modern audio generation predominantly relies on latent-space compression, introducing additional complexity and potential information loss. In this work, we challenge this paradigm with WavFlow, a framework that generates high-fidelity audio directly in raw waveform space without intermediate representations. To overcome the inherent difficulties of modeling high-dimensional and low-energy signals, we reshape audio into 2D token grids through waveform patchify and introduce amplitude lifting to align signal scales, enabling stable optimization via direct x-prediction in flow matching. To capture complex semantic alignment and temporal synchronization, we leverage an automated data pipeline to curate 5 million high-quality video-text-audio triplets, allowing the model to learn fine-grained  | 👍 4
