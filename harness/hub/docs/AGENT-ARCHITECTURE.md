# Harness agent architecture

## Operating decision

Harness uses a manager-controlled, auditable software-delivery pipeline. The
`supervisor` retains objective, state, approvals, and the final decision; each
specialist produces a bounded artifact for the next stage.

```text
Objective -> supervisor -> triage -> discovery/design -> test-only TDD
          -> production implementation -> bounded repair -> assurance -> final report
```

This is intentionally not a free-form conversation handoff. `triage-router`
emits a routing record, but does not transfer user-facing ownership in v1. The
supervisor consumes that record and keeps state. A future dynamic graph can use
handoffs where a specialist should own the conversation; the current Hub
workflow is a linear, code-orchestrated path for repeatability and audit.

## Safety and execution rules

- One role, one artifact contract, bounded budget, and least privilege per
  profile. No profile may commit or push.
- Only `implementation-engineer`, `tdd-engineer`, and `build-error-resolver`
  can write the workspace. `tdd-engineer` modifies test files only; it must not
  implement production code. `implementation-engineer` owns production changes.
- `build-error-resolver` runs immediately after implementation. It may repair
  only evidenced build/type/lint/test failures. Without a supported failure it
  makes no source edit and returns `NO_SUPPORTED_FAILURE`, cited evidence, and
  the next verification command.
- All assurance agents and `e2e-runner` inspect the final workspace after that
  repair. `execute` permits only scoped verification commands; `network` is
  research-only and grants neither write nor general shell permission.
- Approval is placed on the node that consumes an artifact needing human
  acceptance. Validation emits an interrupt for a missing artifact contract.
  Agents must distinguish supplied/observed evidence from commands they have
  not run.

## Canonical profiles

The provider, `permission`, and `risk_tier` values below are the runtime
contracts from the canonical profiles. `cheap`, `smart`, and `code` are Harness
provider classes, not claims about a particular vendor model.

| ID | Category / responsibility | Provider | Permission / risk_tier | Input -> output contract | Provenance |
| --- | --- | --- | --- | --- | --- |
| `supervisor` | Control: scope, state, gates, final report | `smart` | `read_only` / `read_only` | objective + artifacts -> route/final decision | OpenAI Manager |
| `triage-router` | Control: classify scope, risk, next role | `cheap` | `read_only` / `read_only` | objective -> route record + assumptions | OpenAI Triage/Handoff |
| `explorer` | Discovery: repository facts and constraints | `code` | `read_only` / `read_only` | route -> evidence map, no edits | Anthropic Explore pattern; ECC inspiration |
| `planner` | Design: ordered plan, acceptance criteria, checks | `smart` | `read_only` / `read_only` | evidence -> plan, risks, verification | ECC role inspiration |
| `architect` | Design: boundaries, interfaces, trade-offs | `smart` | `read_only` / `read_only` | plan -> decision record | ECC role inspiration |
| `implementation-engineer` | Build: minimal production-code change | `code` | `workspace_write` / `execute` | approved design + tests -> change report | OpenAI sandbox pattern |
| `tdd-engineer` | Build: test files only, no production implementation | `code` | `workspace_write` / `execute` | approved design -> test change/report | ECC TDD; Anthropic test-writer |
| `build-error-resolver` | Repair: supported compilation/test failures only | `code` | `workspace_write` / `execute` | failure evidence -> minimal fix/report, or no-op evidence | ECC role inspiration |
| `database-reviewer` | Assurance: schema, query, transaction, rollback | `smart` | `read_only` / `read_only` | final diff/schema -> DB findings | ECC role inspiration |
| `code-reviewer` | Assurance: correctness, regression, maintainability | `code` | `read_only` / `read_only` | final diff + plan -> prioritized findings | Anthropic/ECC inspiration |
| `security-reviewer` | Assurance: auth, secrets, PII, injection, boundaries | `smart` | `read_only` / `read_only` | final diff + data flow -> findings/remediation | Anthropic/ECC inspiration |
| `performance-analyzer` | Assurance: hot paths, cost, I/O, memory | `code` | `read_only` / `read_only` | final diff + evidence -> performance findings | Anthropic template inspiration |
| `ui-reviewer` | Assurance: UX, responsive behavior, accessibility | `smart` | `read_only` / `read_only` | final UI diff/requirements -> UX/a11y findings | Anthropic template inspiration |
| `e2e-runner` | Verification: executable user-journey checks | `code` | `read_only` / `execute` | final workspace + AC -> command, evidence, failures/gaps | ECC role inspiration |
| `docs-researcher` | Discovery: source-backed API/library research | `smart` | `read_only` / `network` | research question -> cited compatibility note | ECC inspiration; OpenAI agents-as-tools |

## Workflow semantics

`software-delivery` uses every canonical profile, with `supervisor` at intake
and finalization. Its order is discovery -> plan -> design -> test-only TDD ->
implementation -> repair -> database/code/security/performance/UI assurance ->
E2E -> finalization. The workflow validates plan, design, and E2E artifacts;
approval gates protect consumption of plan, design, TDD output, implementation
evidence, and the final report. Its layout sidecar fits a 2400 x 1600 canvas.

## Sources and caveats

1. [OpenAI Agents SDK: Agent orchestration](https://openai.github.io/openai-agents-python/multi_agent/)
   documents the distinction used here: agents-as-tools keep manager control;
   handoffs make the selected specialist active. Harness uses the former for
   this static delivery workflow.
2. [Anthropic official subagent templates](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/claude-code-setup/skills/claude-automation-recommender/references/subagent-templates.md)
   inspire specialized roles and least privilege. They are examples, not a
   permission contract to copy unchanged.
3. [ECC README](https://github.com/affaan-m/ECC/blob/main/README.md) and its
   [agents tree](https://github.com/affaan-m/ECC/tree/main/agents) provide
   third-party role vocabulary only. Harness ports responsibilities, not prompts
   or authority. The `ysyecust/everything-claude-code` link in the input is not
   the `affaan-m/ECC` repository and is not evidence for ECC role availability.

## Compatibility and rollout

Legacy profiles (`coder`, `planner`, `reviewer`, `tester`, and others) remain
unchanged so existing workflows keep running. Canonical IDs are additive: do
not rename, delete, or silently alias legacy profiles. Roll out by validating
the workflow, running a small sandboxed task, reviewing artifacts and approval
interrupts, then expanding to larger changes. When Hub gains dynamic graph
execution, triage may select a subgraph; this reference stays linear so its
execution and evidence trail remain deterministic.
