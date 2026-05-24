# On the Trainability of Masked Diffusion Language Models via Blockwise Locality

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.24832
**Published:** 2026-04-29 04:00 UTC
**Topic:** AI

arXiv:2604.24832v1 Announce Type: new 
Abstract: Masked diffusion language models (MDMs) have recently emerged as a promising alternative to standard autoregressive large language models (AR-LLMs), yet their optimization can be substantially less stable. We study blockwise MDMs and compare them with AR-LLMs on three controlled tasks that stress different aspects of structured generation: in-context linear regression, graph path-finding, and Sudoku solving. We find that standard random-masking MDMs fail to reliably learn linear regression, exhibit high variance training dynamics on graph path-finding, while outperforming AR-LLMs on Sudoku. To mitigate these instabilities, we propose two locality aware blockwise models, namely Jigsaw and Scatter, that inject left-to-right inductive bias by e
