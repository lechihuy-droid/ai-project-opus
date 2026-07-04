# Full Harness Research - 2026-06-26

## Verdict

Install path to pursue: **Inspect AI full stack**.

Use the existing local `harness/run_harness.py` as the deterministic workspace preflight, then add Inspect AI for model/agent evals:

```text
local harness
  -> fast workspace checks, recall tests, invariant checks

Inspect AI
  -> datasets, solvers/agents, scorers, sandboxing, approvals, eval logs

inspect-swe
  -> standard Inspect agents for Claude Code, Codex CLI, Gemini CLI, etc.

inspect-viz
  -> plots/dashboards over Inspect logs
```

This is the closest installable match to the paper pack's target shape: executable evaluation, trace capture, sandboxing, approvals, rubric/scoring, and agent bridge support.

## Criteria From Local Paper Pack

The local `agent_harness_papers.zip` points to six recurring requirements:

1. **Executable evaluation**: agents act in an environment and the harness checks consequences, not just text similarity.
2. **Trace-grounded diagnosis**: failures must preserve enough step evidence for repair.
3. **Composable harness primitives**: datasets, tools, agents, scorers, sandboxes, approval policy.
4. **Safety lifecycle**: sandboxing, permissioning, approval gates, and scoped write boundaries.
5. **Observability**: durable logs, trace JSONL, UI/reporting, anomaly scan.
6. **Versioned optimization loop**: compare harness versions, agents, budgets, and regressions.

Relevant local papers by signal:

| Paper | Useful idea | Installable today? |
|---|---|---|
| HarnessX | composable/adaptive/evolvable harness foundry | Not yet; arXiv abstract says codebase future release |
| HarnessFix | trace-guided repair of harness flaws | Research pattern; no mature install path found |
| Harness-Bench | diagnostic benchmark for model-harness configurations | Research benchmark idea |
| SafeHarness / HarnessAudit | security lifecycle and audit dimensions | Pattern, not workspace-ready package |
| Code as Agent Harness | code + trace as verifiable harness substrate | Pattern matches our local runner |
| VeRO | versioning, rewards, observations for agent optimization | Research harness, useful design pattern |

Inference: the paper pack is more useful as **architecture requirements** than as a package list.

## Candidate Matrix

| Candidate | Full install? | Fit for this workspace | Notes |
|---|---:|---:|---|
| **Inspect AI + inspect-swe + inspect-viz** | Yes | Best | Open-source eval framework; supports tasks/datasets/solvers/scorers, agents, tool calling, external CLI agents, Docker sandboxing, approvals, traces, and visualization. |
| promptfoo | Yes | Good secondary | Great for prompt/model/RAG regression and red-team reports. Less natural for long-horizon coding-agent workspace tasks. |
| DeepEval | Yes | Good secondary | Good pytest-like LLM evals and tracing. Useful for app/component evals, but most metrics use LLM-as-judge and often need API keys. |
| LangSmith | Yes, but cloud/hybrid/self-host | Later | Strong observability/monitoring. Heavier operationally and account/API-key centered. |
| OpenAI Evals platform/API | Legacy | Not primary | Official docs say Evals platform becomes read-only on 2026-10-31 and shuts down on 2026-11-30. The old `openai/evals` package is installable but not the best new foundation. |
| HarnessX / HarnessFix / VeRO / ProofAgent-style papers | Not reliably | Pattern only | Treat as design references until code/docs mature. |

## Recommended Full Install Scope

Phase A - install Inspect stack in an isolated venv:

```powershell
cd C:\Users\HUY\workspace\ai-project-opus
C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe -m venv harness\.venv-inspect
.\harness\.venv-inspect\Scripts\python.exe -m pip install -U pip
.\harness\.venv-inspect\Scripts\python.exe -m pip install inspect-ai inspect-swe inspect-viz
.\harness\.venv-inspect\Scripts\inspect.exe --version
```

Phase B - add Inspect workspace evals:

```text
harness/inspect/
  pyproject.toml or requirements.txt
  tasks/
    workspace_smoke.py
    recall_agent.py
    consilium_query.py
  datasets/
    recall_cases.jsonl
    workspace_agent_cases.jsonl
  sandboxes/
    compose.yaml
  approval.yaml
```

Phase C - connect Codex/Claude CLI through `inspect-swe` only after deterministic tasks are stable.

Phase D - add `inspect-viz` reports once there are enough runs to compare.

## Why Inspect Wins

Inspect directly covers the harness paper criteria:

- `Task = Dataset + Solver/Agent + Scorer`, matching executable eval structure.
- Built-in agent support, multi-agent primitives, external agent bridge.
- `inspect-swe` exposes Claude Code, Codex CLI, Gemini CLI, OpenCode, and Mini SWE Agent as Inspect agents.
- Docker sandboxing is built in; Kubernetes/other sandboxes exist through extensions.
- Tool approval supports human, auto, and custom approvers.
- Trace logs are JSONL and include model calls, subprocesses, Docker Compose controls, tool calls, and subtasks.
- `inspect view` and `inspect-viz` cover analysis and visualization.

## Risks

- Full agent evals need model/provider credentials unless using local models.
- Docker is needed for real sandboxed agent tasks.
- Running Codex/Claude CLI inside Inspect should start with read-only or disposable sample repos.
- Keep local `harness/run_harness.py` because it is faster, dependency-free, and catches workspace regressions before expensive agent evals.

## Sources Checked

- Local `agent_harness_papers.zip`: manifest, PDF text check, and download report.
- Inspect AI docs: https://inspect.aisi.org.uk/
- Inspect Agent Bridge: https://inspect.aisi.org.uk/agent-bridge.html
- Inspect sandboxing: https://inspect.aisi.org.uk/sandboxing.html
- Inspect tool approval: https://inspect.aisi.org.uk/approval.html
- Inspect tracing: https://inspect.aisi.org.uk/tracing.html
- Inspect SWE: https://meridianlabs-ai.github.io/inspect_swe/
- Inspect Viz: https://meridianlabs-ai.github.io/inspect_viz/
- promptfoo docs: https://www.promptfoo.dev/docs/intro/
- DeepEval docs: https://deepeval.com/docs/getting-started
- OpenAI Evals docs: https://developers.openai.com/api/docs/guides/evals
- OpenAI Evals repo: https://github.com/openai/evals
