# Lucida Subagent System Architecture
**Status:** Active draft  
**Role:** Reusable governance for subagents across Lucida production lanes

---

## 1. Purpose

Lucida should use subagents as bounded workers, not as vague brainstorming copies of the main agent.

System pattern:

```text
main agent
-> bounded subagents
-> structured outputs
-> merge
-> QA
-> production artifact
```

---

## 2. Core Rule

Every subagent must have:

```text
task
input files
output contract
write scope
do-not-change rule
decision label
language contract
```

---

## 3. Role Families

Use stable role families:

```text
research
pedagogy
localization
design
curation
qa
```

Reuse a role family before inventing a new agent type.

---

## 4. Write Modes

```text
read_only
single_file_writer
scoped_multi_file_writer
```

Do not assign overlapping write scope in the same round unless coordination is explicit.

---

## 5. Main Agent Responsibilities

Main agent always owns:

- sequencing;
- final truth;
- final merge;
- cross-file consistency;
- final recommendation.

---

## 6. Example Lane Recommendation

For the example bank, default setup is:

```text
main agent
-> situation research
-> japanese naturalness
-> vietnamese naturalness
-> pedagogy fit
-> curation
```

If the task is small, merge:

```text
vietnamese naturalness + curation
```

---

## 7. Escalation Rule

Subagents may:

- fix local wording inside their scope;
- flag a structural problem;

but only the main agent should:

- change workflow;
- change global criteria;
- change lesson architecture truth.

---

## 8. Conflict Prevention

Before spawning or reusing subagents, the main agent should lock:

```text
shared objective
source of truth files
role family
write mode
write scope
output format
merge order
```

Do not run parallel subagents with overlapping write scope unless:

```text
one is read_only
or one is explicitly reviewing the other's output
```

If two subagents can affect the same artifact, assign one of these patterns:

```text
research -> writer
writer -> qa
writer -> localization
```

Do not assign:

```text
writer + writer on the same file in the same round
```

---

## 9. Lack Prevention

To avoid under-specified subagent runs, every subagent handoff should include:

```text
why this agent exists
what it must read
what it must not change
what finished output looks like
where the result will be merged
```

Minimum handoff contract:

```text
Task
Inputs
Write scope
Do not change
Output format
Decision target
Language contract
```

If any of these are missing, the main agent should not spawn yet.

### Language contract rule

If a subagent generates any learner-facing Vietnamese,
its input set must include:

```text
production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md
production/01-rules/slide-system/08-learner-facing-language-audit-checklist.md
production/01-rules/slide-system/09-learner-facing-generation-spec.md
production/01-rules/slide-system/10-banned-preferred-language-dictionary.md
production/01-rules/slide-system/12-vietnamese-jlpt-n2-explanation-pattern-bank.md
```

And the handoff must state:

```text
Use learner-facing Japanese-study Vietnamese.
Do not leak internal framework language into public phrasing.
Use `Ý nghĩa - Dạng - Cách dùng` if the 3-view method appears publicly.
Rewrite banned wording before returning output.
```

---

## 10. Runner Pack Rule

Repeatable lanes should have a short prompt runner pack.

A runner pack is:

```text
a copy-pasteable set of subagent prompts
with stable roles
stable output shapes
and replaceable variables
```

Use runner packs when:

- the same lane will be run more than once;
- multiple subagents must stay consistent;
- output format drift would slow merge or QA.

Do not treat runner packs as strategy documents.

They are execution tools.

---

## 11. Recommended Runner Pack Structure

Every runner pack should have:

```text
purpose
when to use
shared variables
spawn order
one block per subagent
merge checklist
```

Shared variables should be declared once, for example:

```text
topic_slug
grammar_need
persona_slice
deliverable_goal
input_paths
output_path
```

---

## 12. Current Runner Packs

Current pack:

```text
automation/workflows/31-runner-example-lane.md
automation/workflows/32-runner-lesson-production.md
automation/workflows/33-runner-assessment.md
automation/workflows/34-runner-production.md
automation/workflows/35-automation-gated-execution-flow.md
automation/workflows/36-automation-flow-matrix.md
automation/workflows/37-automation-execution-contract.md
automation/workflows/38-audio-generation-sop.md    ← Step 4.5 audio pipeline SOP
```

This pack is the operational companion to:

```text
production/02-assets/example-intelligence/11-example-subagent-prompts.md
```
