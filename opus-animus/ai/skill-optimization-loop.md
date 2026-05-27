# Skill Optimization Loop

**Status:** test
**Owner:** Codex / Claude / ChatGPT
**Purpose:** Turn PACK.md / skill documents into trainable artifacts instead of one-off prompts.

---

## Summary

Skill documents should be improved through a controlled loop:

```text
Run → Score → Propose bounded edit → Validate → Accept / Reject → Version
```

This is inspired by recent SkillOpt-style research: treat the skill document as external state of a frozen agent, improve the text with bounded edits, and accept edits only when validation improves.

For this workspace, the practical version is manual first. Do not build an optimizer or automation until the human-reviewed loop is stable.

---

## Why This Matters

The current workspace now has task-specific packs such as:

- `opus-animus/ai/plugin-packs/wiki-ops/PACK.md`
- `opus-animus/ai/plugin-packs/news-research/PACK.md`

These files should not be treated as final. They are skill artifacts that should improve through real failures and feedback.

Key principle:

```text
Do not keep adding global rules to AGENTS.md.
Optimize the relevant PACK.md through small validated edits.
```

---

## Lessons From Skill Optimization Research

### 1. Skill text is trainable state

A skill file is not just documentation. It functions like an external memory/control layer for an agent.

For this repo:

```text
PACK.md = skill document
AGENTS.md = router + global law
status.md = project state
handoff.md = transfer package
lessons.md = local correction memory
```

### 2. Optimize skill documents, not model weights

Do not fine-tune first. Improve:

- instructions
- gates
- examples
- failure modes
- routing rules
- do-not-do rules
- validation criteria

This is cheaper, faster, and portable across ChatGPT, Claude, Codex, and Gemini.

### 3. Use bounded edits

Do not rewrite the whole skill after one failure.

Allowed edit types:

- add one specific rule
- replace one ambiguous rule
- delete one noisy instruction
- add one failure example
- tighten one gate

Default edit budget:

```text
1–3 small changes per optimization cycle
```

### 4. Accept only after validation

A proposed edit is not automatically correct.

Accept if:

- it fixes the observed failure
- it does not break a previous good behavior
- it improves the next run or a replayed test case
- it keeps the skill smaller or clearer when possible

Reject if:

- it overfits one example
- it adds vague advice
- it bloats the skill
- it conflicts with another pack
- it belongs in a different pack

### 5. Prefer pruning and substitution over accumulation

More instructions do not always help. Effective skill packs should be minimal and focused.

If a pack becomes long, first ask:

```text
Can we remove or replace a rule instead of adding another rule?
```

### 6. Watch for skill technical debt

Skill libraries can accumulate debt:

- duplicate rules
- conflicting gates
- outdated assumptions
- vague do-not-do lists
- packs that overlap too much
- global AGENTS.md bloat
- skills that were added but never used

Run periodic cleanup before adding more packs.

---

## Manual SkillOpt Loop

### Step 1 — Run

Use a pack on a real task.

Examples:

```text
Use News Research Pack, run CEO brief today.
Use Wiki Ops Pack, classify today’s chat for wiki update.
```

### Step 2 — Score

Use simple labels first.

For News Research:

```text
good
too tech
repeated
not actionable
wrong lane
over-promote
missing CEO angle
weak evidence
```

For Wiki Ops:

```text
good
wrong target page
copied transcript
too broad
created unnecessary page
missed decision
updated without explicit apply
overwrite risk
```

### Step 3 — Diagnose root cause

Classify the failure source:

```text
Input ambiguity
Skill rule missing
Skill rule unclear
Gate too weak
Output format weak
Wrong pack loaded
AGENTS.md routing issue
User preference changed
```

### Step 4 — Propose bounded edit

Write an edit proposal before changing the file.

Template:

```text
Observed failure:
Root cause:
Target file:
Proposed edit type: add / replace / delete / tighten gate / add example
Proposed change:
Expected improvement:
Regression risk:
Validation case:
```

### Step 5 — Validate

Validate with either:

- replaying the same task
- running the next similar task
- checking against prior known-good behavior
- human gate review

### Step 6 — Accept or reject

If accepted:

- update the relevant `PACK.md`
- add a short Applied entry if the pack has one
- return changed files + commit hash + decision label

If rejected:

- do not change the pack
- optionally log the rejected idea in a failure note

---

## Apply To Wiki Ops Pack

### Failure types to watch

```text
created too many pages
wrong target page
copied transcript into wiki
missed durable decision
updated wiki without explicit apply
over-promoted casual discussion
edited too much content
```

### Optimization examples

| Failure | Bounded edit |
|---|---|
| Created unnecessary page | Add rule: prefer existing hub page unless no suitable page exists |
| Copied transcript | Tighten no-transcript rule with an example |
| Wrong target page | Add routing example |
| Updated without explicit apply | Add blocked condition |
| Overwrote too much content | Add gate: smallest safe edit only |

### Validation case

Use a recent chat where the user says:

```text
Add vào wiki
```

Expected behavior:

1. classify first
2. choose smallest target page
3. update only when requested
4. return changed files, commit hash, decision label

---

## Apply To News Research Pack

### Failure types to watch

```text
repeated yesterday’s signal
too technical for CEO lane
not actionable
weak business implication
over-promoted product announcement
mixed Tech Learning and CEO Business lanes
missed customer / pricing / competitor angle
```

### Optimization examples

| Failure | Bounded edit |
|---|---|
| Repeated signal | Add one suppress rule or stronger anti-repetition condition |
| Too technical | Tighten CEO lane gate |
| Weak action | Require action to affect customer, offer, pricing, operating model, or thesis |
| Product launch over-promoted | Add evidence threshold: customer, KPI, revenue, adoption, workflow proof |
| Wrong lane | Add route examples for Tech vs CEO |

### Validation case

Run:

```text
Use News Research Pack, run CEO brief today.
```

Expected behavior:

1. one to three signals only
2. no repeated thesis without new evidence
3. explicit watch / ignore decision
4. explicit wiki action
5. no generic tech digest

---

## Apply To Future BD/RCD Pack

Potential failure types:

```text
pending item treated as fact
legacy reference treated as requirement
QA answer not linked to RD
unsupported assumption
missing source trace
RCD duplicate
BD not dev-ready
human review gate too vague
```

Useful metrics:

```text
unsupported assumption count
source authority errors
missing requirement count
human review comments
dev clarification count
review time
pass / revise / blocked ratio
```

Suggested first loop:

```text
Sample 1 = debug the skill pack
Sample 2 = validate repeatability
```

---

## Operating Rules

- Optimize the specific pack, not `AGENTS.md`, unless routing itself is the problem.
- Do not add new packs until existing packs are used at least a few times.
- Prefer deletion/replacement over accumulation.
- Keep every accepted edit traceable to a real failure or user feedback.
- Do not automate optimization until manual scoring is stable.
- If a skill becomes long, split by workflow rather than expanding global rules.

---

## Decision Labels

Use these labels when reporting a skill optimization cycle:

| Label | Meaning |
|---|---|
| `keep` | No skill change needed |
| `test` | Use the current rule for more runs before updating |
| `change` | Update the skill document |
| `reject` | Do not apply proposed edit |
| `split` | Move overloaded logic into a separate pack |

---

## Next Implementation Plan

### Phase 1 — Manual loop

Apply this loop to:

- Wiki Ops Pack
- News Research Pack

Track feedback in chat and update only when failures repeat or are high severity.

### Phase 2 — Add lightweight logs

If needed, add:

```text
opus-animus/ai/plugin-packs/wiki-ops/failures.md
opus-animus/ai/plugin-packs/news-research/failures.md
```

Do this only after 3+ useful failure cases exist.

### Phase 3 — Add pack routing

Add a small router section to `AGENTS.md` only after the packs prove useful.

Router should stay short:

```text
Wiki update / chat-to-wiki → read wiki-ops/PACK.md
News / CEO brief / research filter → read news-research/PACK.md
```

### Phase 4 — Create BD/RCD Pack

Create only after Wiki and News packs are stable enough to copy the pattern.

---

## References

- SkillOpt: optimize skill documents through bounded edits and validation
- SkillMOO: multi-objective skill bundle optimization; pruning and substitution often matter
- SkillOps: skill libraries can accumulate technical debt and need maintenance
- ECC: selective context, skills, commands, hooks, and verification loops
