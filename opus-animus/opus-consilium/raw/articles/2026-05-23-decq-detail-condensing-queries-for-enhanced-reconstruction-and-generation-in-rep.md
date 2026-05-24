# DecQ: Detail-Condensing Queries for Enhanced Reconstruction and Generation in Representation Autoencoders

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.22777
**Published:** 2026-05-22 23:36 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

Representation Autoencoders (RAEs) leverage frozen vision foundation models (VFMs) as tokenizer encoders, providing robust high-level representations that facilitate fast convergence and high-quality generation in latent diffusion models. However, freezing the VFM inherently constrains its spatial reconstruction capacity, limiting fine-grained generation and image editing; in contrast, incorporating reconstruction-oriented signals via fine-tuning disrupts the pretrained semantic space and degrades generative fidelity. To address this trade-off, we propose DecQ, a simple yet effective framework for RAEs. Specifically, DecQ introduces lightweight detail-condensing queries that extract fine-grained information from intermediate VFM features through condenser modules. These queries are incorpo | 👍 1
