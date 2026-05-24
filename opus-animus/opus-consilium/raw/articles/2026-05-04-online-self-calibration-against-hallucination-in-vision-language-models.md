# Online Self-Calibration Against Hallucination in Vision-Language Models

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.00323
**Published:** 2026-05-04 20:06 UTC
**Topic:** AI

Large Vision-Language Models (LVLMs) often suffer from hallucinations, generating descriptions that include visual details absent from the input image. Recent preference alignment methods typically rely on supervision distilled from stronger models such as GPT. However, this offline paradigm introduces a Supervision-Perception Mismatch: the student model is forced to align with fine-grained details beyond its perceptual capacity, learning to guess rather than to see. To obtain reliable self-supervision for online learning, we identify a Generative-Discriminative Gap within LVLMs, where models exhibit higher accuracy on discriminative verification than open-ended generation. Leveraging this capability, we propose Online Self-CAlibRation (OSCAR), a framework that integrates Monte Carlo Tree  | 👍 1
