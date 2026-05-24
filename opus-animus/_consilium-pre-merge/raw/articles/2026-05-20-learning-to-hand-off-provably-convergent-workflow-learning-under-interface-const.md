# Learning to Hand Off: Provably Convergent Workflow Learning under Interface Constraints

**Source:** arxiv-ai
**URL:** https://arxiv.org/abs/2605.19140
**Published:** 2026-05-20 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.19140v1 Announce Type: new 
Abstract: We study workflow learning in a setting where specialized agents hand off control through a shared artifact, each agent observes only a local function of that artifact and its own private state, and no centralized learner accesses joint trajectories -- the operating regime of multi-agent LLM pipelines that span organizational, vendor, or trust boundaries. We formalize this regime as an interface-constrained semi-Markov decision process (IC-SMDP), whose decision epochs occur at handoff times, and design IC-$Q$, an asynchronous decentralized $Q$-learning algorithm in which cross-agent coordination at every handoff is exactly one scalar. Our main result is a finite-sample bound for neural IC-$Q$ that decomposes into three independently controll
