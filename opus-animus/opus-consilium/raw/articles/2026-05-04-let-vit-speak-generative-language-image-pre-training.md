# Let ViT Speak: Generative Language-Image Pre-training

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.00809
**Published:** 2026-05-04 20:06 UTC
**Topic:** AI

In this paper, we present Generative Language-Image Pre-training (GenLIP), a minimalist generative pretraining framework for Vision Transformers (ViTs) designed for multimodal large language models (MLLMs). To better align vision encoders with the autoregressive nature of LLMs, GenLIP trains a ViT to predict language tokens directly from visual tokens using a standard language modeling objective, without contrastive batch construction or an additional text decoder. This design offers three key advantages: (1) Simplicity: a single transformer jointly models visual and textual tokens; (2) Scalability: it scales effectively with both data and model size; and (3) Performance: it achieves competitive or superior results across diverse multimodal benchmarks. Trained on 8B samples from Recap-Data | 👍 9
