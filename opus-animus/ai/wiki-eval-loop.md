# Wiki Eval Loop

**Status:** test
**Owner:** Codex / Claude / ChatGPT
**Purpose:** Define the evaluation loop for promoting chat, research, articles, and decisions into durable Consilium wiki knowledge.

---

## Summary

The wiki must not become a transcript archive or raw news dump. It should become a durable decision and strategy memory.

This loop evaluates every proposed wiki update before and after writing.

```text
Input
chat / news / strategic article / paper / repo task / user feedback
        ↓
Intake
        ↓
Classification
        ↓
Layer routing
        ↓
Pre-write eval gate
        ↓
Write / no-write decision
        ↓
Post-write verification
        ↓
Failure learning loop
```

The loop is manual-first. Do not automate it until the human-reviewed cases are stable.

---

## Relationship To Other Control Artifacts

| Artifact | Role |
|---|---|
| `plugin-packs/wiki-ops/PACK.md` | operational pack for intake, classification, and wiki write rules |
| `skill-optimization-loop.md` | method for improving packs with bounded edits after failures |
| `operator-topology.md` | routing map across operator surfaces and subsystems |
| `wiki-eval-loop.md` | eval criteria, replay cases, and failure taxonomy for wiki updates |
| `news-research/PACK.md` | upstream research filter for Tech / CEO / Competitor signals |

This file evaluates wiki updates. It does not replace `wiki-ops/PACK.md`.

---

## Knowledge Layers

Route every durable input into one primary layer.

```text
Layer 1 — Strategy
Strategic lenses, threat lenses, operating-model frameworks, long-term direction.

Layer 2 — Radar
Things to watch: CEO radar, AI radar, competitor radar, DX radar, investment radar.

Layer 3 — Evidence
News, research papers, company moves, benchmark results, case studies, source-backed examples.

Layer 4 — Action
Opus tasks, FDE-lite offer changes, skill updates, pack edits, scheduler changes, learning roadmap.
```

### Routing Examples

| Input | Classification | Primary Layer | Target Example |
|---|---|---|---|
| McKinsey operating-model article | `strategic_lens` | Strategy | `personal-wiki/Strategy/agentic-operating-model.md` |
| arXiv End of Software Engineering | `threat_lens` | Strategy | `personal-wiki/Strategy/agentic-operating-model.md` |
| Wipro opens Claude CoE | `competitor_signal` | Radar / Evidence | `Business/competitor-business-model-radar.md` |
| repeated AI cost signal | `repeated_signal` | No update | chat response only |
| user says “tin này lệch tech quá” | `skill_failure` | Action | `news-research/PACK.md` proposal |
| user says “trong vault” | `wiki_update_request` | depends on classification | smallest correct target page |

---

## Evaluation Targets

Each wiki update should pass these targets.

| ID | Target | Question |
|---|---|---|
| E1 | Intent clarity | What did the user actually ask: explain, save, apply, update, run, or just discuss? |
| E2 | Durability | Is the insight useful beyond the current chat? |
| E3 | Correct layer | Is it Strategy, Radar, Evidence, or Action? |
| E4 | Correct target page | Is this the smallest correct existing page? |
| E5 | No transcript / no raw dump | Is the update synthesized rather than copied? |
| E6 | Source confidence | Is the source type clear: official, research, business press, social, user decision? |
| E7 | Non-duplication | Does the update avoid repeating an existing thesis without new evidence? |
| E8 | Smallest safe edit | Is the edit limited to the needed section instead of rewriting the page? |
| E9 | Explicit write permission | Did the user ask to apply, update, add to vault/wiki, or equivalent? |
| E10 | Return contract | Are changed files, commit hash, and decision label returned? |
| E11 | Regression risk | Could this edit break routing, duplicate pages, or conflict with another pack? |
| E12 | Actionability | Does the update produce a decision, watch item, open question, or next action? |

---

## Score Labels

Use simple labels first.

```text
PASS
REVISE
BLOCKED
```

### PASS

Use `PASS` when:

- the insight is durable
- the layer is clear
- the target page is correct
- the source confidence is acceptable
- there is explicit write permission
- the edit is small and safe
- the output contract can be satisfied

### REVISE

Use `REVISE` when:

- the insight is useful but the target page is unclear
- the update is too broad
- the insight should become an open question instead of a conclusion
- source confidence is weak but still useful as a seed
- the article is strategic but its implications need synthesis before write

### BLOCKED

Use `BLOCKED` when:

- there is no write permission
- the update would copy raw transcript or raw article content
- the source is too weak for a durable claim
- the request would create a duplicate page
- the agent is unsure what the user decided
- the edit would be broad, risky, or not grounded

---

## Pre-write Gate

Before writing to GitHub, fill this internally or explicitly in the response when helpful.

```text
Durable insight:
Classification:
Layer:
Target page:
Existing overlap:
Source confidence:
Write permission:
Edit size:
Regression risk:
Decision label:
```

### Example: Strategic Article

```text
Durable insight:
Agentic delivery is operating-model redesign.

Classification:
strategic_lens

Layer:
Strategy

Target page:
personal-wiki/Strategy/agentic-operating-model.md

Existing overlap:
Related to AI trend radar and competitor radar, but belongs above both.

Source confidence:
Tier A strategic source.

Write permission:
User said “trong vault”.

Edit size:
Small hub evidence update.

Regression risk:
Low, if not copied into daily news.

Decision label:
test
```

---

## Post-write Verification

Every successful repo write must return:

```text
Changed files:
Commit hash:
Decision label:
What changed:
Why this target:
Regression risk:
```

If the GitHub tool returns an error, do not claim success. Report the error and, if safe, refetch latest SHA and retry once.

---

## Failure Taxonomy

Use these codes when a wiki update fails or user feedback indicates a bad update.

| Code | Failure | Example |
|---|---|---|
| W1 | Wrong layer | Strategic lens stored as daily news |
| W2 | Wrong target page | McKinsey article stored mainly inside competitor radar |
| W3 | Over-promotion | Repeated news creates a wiki update |
| W4 | Under-promotion | User makes durable decision but no update is proposed |
| W5 | Transcript leak | Raw chat copied into wiki |
| W6 | Raw dump | Raw article pasted instead of synthesized |
| W7 | Duplicate content | New page created when hub page was enough |
| W8 | Missing source confidence | No distinction between Reuters, arXiv, vendor blog, or social post |
| W9 | No action / decision label | Wiki grows but future use is unclear |
| W10 | Write without permission | File updated before user says apply/update/vault |
| W11 | Oversized edit | Whole page rewritten for a small new section |
| W12 | Stale context | Update based on outdated file SHA or old repo state |
| W13 | Pack mismatch | News pack used when wiki-ops pack should route |
| W14 | Strategy/evidence confusion | Treating a lens as fact, or treating a news item as thesis |
| W15 | Weak actionability | Insight saved but no watch item, open question, or implication |
| W16 | Runtime boundary error | Claiming local execution happened when only repo edit was possible |

---

## Replay Cases

Replay these cases after changing `wiki-ops/PACK.md`, this file, or related routing rules.

### Case 1 — “Trong vault”

Input:

```text
Trong vault
```

Expected:

```text
Use Wiki Ops.
Infer wiki/vault update intent.
Classify first.
Choose smallest correct target page.
Apply only if enough context and permission are clear.
Return changed files, commit hash, decision label.
```

### Case 2 — Strategic article

Input:

```text
Tóm tắt bài McKinsey này, trong vault
```

Expected:

```text
Classification: strategic_lens
Layer: Strategy
Primary target: Strategy/agentic-operating-model.md
Do not make competitor radar the primary target.
```

### Case 3 — Threat lens

Input:

```text
Add “End of Software Engineering” vào Strategy layer như Threat Lens.
```

Expected:

```text
Classification: threat_lens
Layer: Strategy
Target: Strategy/agentic-operating-model.md
Add threat interpretation and watch criteria.
Decision label: test
```

### Case 4 — Repeated daily news

Input:

```text
Có tin gì mới không?
```

If signals repeat an existing thesis:

```text
No wiki update.
Decision label: keep.
Say signal was suppressed as repeated unless there is new action, metric, contradiction, or competitor move.
```

### Case 5 — User says no update

Input:

```text
Không cần update.
```

Expected:

```text
No file write.
Optional chat-only summary.
Decision label: keep.
```

### Case 6 — Skill failure feedback

Input:

```text
Tin tức bị lệch khỏi Consilium, đi sâu vào tech quá.
```

Expected:

```text
Score: wrong lane / too tech
Root cause: News Research gate too weak or wrong pack loaded
Target: news-research/PACK.md
Propose bounded edit before applying
```

### Case 7 — Local runtime request

Input:

```text
Chạy run_collect.py thật.
```

Expected:

```text
Route to scheduler-ops.md.
Do not claim local execution unless runtime bridge exists.
Prepare handoff or command-gateway task.
```

---

## Failure Learning Loop

When a failure occurs, use this template before changing any pack.

```text
Observed failure:
Failure code:
Root cause:
Target artifact:
Proposed bounded edit:
Expected improvement:
Regression risk:
Validation replay case:
Decision: keep / test / change / reject / split
```

### Example

```text
Observed failure:
McKinsey strategic article was stored too much inside competitor radar.

Failure code:
W1 wrong layer, W2 wrong target page

Root cause:
No explicit Strategy layer existed yet.

Target artifact:
Strategy/agentic-operating-model.md
competitor-business-model-radar.md

Proposed bounded edit:
Create Strategy layer and treat competitor radar as downstream evidence, not strategy home.

Validation replay case:
Next strategic article should route to Strategy first.

Decision:
change
```

---

## Decision Labels

Use these labels in wiki-eval reporting.

| Label | Meaning |
|---|---|
| `keep` | No wiki or pack change needed |
| `test` | Add as a hypothesis, lens, watch item, or experimental rule |
| `change` | Update a durable artifact now |
| `reject` | Do not promote or apply |
| `split` | Current page/pack is overloaded and needs a separate artifact |
| `blocked` | Cannot proceed due to missing permission, weak source, or runtime boundary |

---

## Maturity Model

### Stage 1 — Manual Eval

Current mode.

```text
ChatGPT / Codex / Claude use gates manually.
User feedback decides accept/reject.
GitHub commit provides version history.
```

### Stage 2 — Eval Artifact

This file.

```text
Shared eval targets.
Failure taxonomy.
Replay cases.
Pre-write and post-write contract.
```

### Stage 3 — Failure Logs

Add later, after at least 3–5 useful failure cases.

```text
plugin-packs/wiki-ops/failures.md
plugin-packs/news-research/failures.md
```

### Stage 4 — Replay Harness

Future.

```text
test-inputs/*.md
expected-routing/*.md
manual or script-based replay
```

### Stage 5 — Automated Checks

Future.

```text
frontmatter checks
changed-file checks
decision-label checks
source-tier checks
no-transcript checks
duplicate-page checks
```

---

## Operating Rules

- Evaluate before writing.
- Default to hub update over new page.
- Store insight, not transcript.
- Store strategic lenses in Strategy first.
- Treat daily news as evidence, not thesis, unless it changes a thesis.
- Prefer no update over noisy update.
- If a failure repeats, update the relevant pack with a bounded edit.
- Do not expand `AGENTS.md` unless global routing is the root cause.
- Do not increase automation before observability and replay cases exist.

---

## Next Actions

1. Use this file for the next 5 wiki/vault updates.
2. If the same failure appears 2+ times, propose a bounded edit to `wiki-ops/PACK.md`.
3. After 3–5 meaningful failures, create `plugin-packs/wiki-ops/failures.md`.
4. Later, build `surface-compliance-matrix.md` and `observability-readiness.md`.

---

## Decision Label

`test`
