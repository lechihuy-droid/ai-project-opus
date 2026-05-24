# ProtoPathway: Biologically Structured Prototype-Pathway Fusion for Multimodal Cancer Survival Prediction

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.21454
**Published:** 2026-05-21 20:30 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

We introduce ProtoPathway, an interpretable-by-design multimodal framework for cancer survival prediction that unifies whole slide imaging and transcriptomics through encoders producing biologically grounded representations on both sides of the fusion. On the histopathology side, K learnable morphological prototypes, trained end-to-end with the survival objective, serve as the slide representation itself: patches flow into prototype tokens via soft assignment, compressing variable-length patch sets into fixed task-adaptive tokens. On the genomic side, a bipartite graph neural network encodes gene expression within the Reactome pathway hierarchy, producing pathway embeddings that reflect both constituent genes and their broader biological context through bidirectional message passing over a
