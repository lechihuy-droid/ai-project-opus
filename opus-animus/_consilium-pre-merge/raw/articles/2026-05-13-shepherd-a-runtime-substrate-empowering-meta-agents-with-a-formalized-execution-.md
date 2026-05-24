# Shepherd: A Runtime Substrate Empowering Meta-Agents with a Formalized Execution Trace

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.10913
**Published:** 2026-05-12 16:14 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 4
**Relevance:** Shepherd: mô hình lập trình chức năng cho meta-trợ lý. -> đọc và so sánh với các mô hình khác

We introduce Shepherd, a functional programming model that formalizes meta-agent operations on target agents as functions, with core operations mechanized in Lean. Shepherd records every agent-environment interaction as a typed event in a Git-like execution trace, enabling any past state to be forked and replayed. The system forks the agent process and its filesystem 5times faster than Docker, achieving >95% prompt-cache reuse on replay. We demonstrate the model through three applications. First, in runtime intervention, a live supervisor increases pair coding pass rates from 28.8% to 54.7% on CooperBench. Second, in counterfactual meta-optimization, branching exploration outperforms baselines across four benchmarks by up to 11 points while reducing wall-clock time by up to 58%. Third, in 
