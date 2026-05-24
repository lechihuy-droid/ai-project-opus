---
title: "BD RCD AI Pack Pilot"
aliases: ["AI-assisted BD Creation Pilot", "RCD to BD Workflow", "BD AI Pack"]
topic: FDE
tags: [fde, ai-sdlc, bd, rcd, human-in-the-loop, skills, prompts, pilot]
status: evergreen
confidence: medium
sources: []
related: ["[[outcome-based-fde-model]]", "[[fde-model]]", "[[fde-roadmap]]", "[[fde-dashboard-sync]]"]
applied: []
open_questions:
  - "Can the same RCD-to-BD workflow repeat successfully on the second BD sample?"
  - "Which human gates are necessary versus too heavy for a 2-3 person pilot team?"
  - "Which skill prompts should be optimized first after the first sample failure log?"
created: 2026-05-19
updated: 2026-05-21
---

# BD RCD AI Pack Pilot

## Summary
This page captures the current pilot architecture for AI-assisted Basic Design creation. The working flow is: input documents are converted to Markdown, chunked, filtered into an RCD / Requirement Consolidation Document, layered and numbered, then used to generate BD output through a fixed template with multiple human-in-the-loop review gates.

This is a micro FDE pilot. The goal is not to let AI produce BD autonomously, but to create a repeatable AI-assisted workflow with explicit skills, prompts, expected outputs, review gates, failure logs, and optimization rules.

## Key Points
- The pilot should be skill-first, not agent-first.
- Prompt templates should live inside skills, not as isolated one-off prompts.
- The AI Pack must include skill definition, prompt template, expected output, gate criteria, failure cases, and optimization rules.
- Human-in-the-loop should be designed as pass / revise / blocked gates, not vague manual review.
- AI self-review can check consistency, coverage, assumptions, and traceability, but it must not approve final output.
- The recommended setup for the current pilot is 8 core skills and 6 human gates.
- LLM wiki / Karpathy-style wiki is not part of the BD/RCD MVP; the MVP should use structured RCD, EARS, source labels, and human gates instead.

## Why It Matters
BD/RCD is an upstream delivery artifact. If the RCD or BD is wrong, downstream design, development, testing, and customer clarification will also be wrong. This makes human-in-the-loop design more important than pure automation speed.

For the offshore-to-FDE transition, this pilot is valuable because it turns a delivery pain point into a measurable workflow improvement. The team can measure time to first BD draft, review comment count, missing requirement detection, and dev-readiness.

## Details

### Current flow

```text
Input documents
→ Markdown conversion via MarkItDown
→ LLM chunking
→ requirement extraction
→ filtered / consolidated input as RCD
→ RCD layering and numbering
→ BD generation from fixed template
→ AI self-review
→ human gate review
→ final BD output
```

### MVP boundary: no LLM wiki layer for RCD
LLM-readable wiki / Karpathy-style wiki is useful for research, reskill, and long-term knowledge management, but it is out of scope for the first delivery-oriented BD/RCD MVP.

For the pilot, RCD should remain a controlled structured artifact, not a free-form wiki layer. The minimum viable control stack is:
- structured RCD table
- EARS-style requirement normalization
- source labels and source references
- confidence / status fields
- open questions and assumptions
- human approval gates
- failure log and measurement

This boundary prevents over-engineering and keeps the pilot focused on problem-solving-first AI adoption rather than knowledge-architecture research.

### Recommended skills

#### S1 Source-to-Markdown Normalization
Purpose: convert source documents into clean Markdown.

Input:
- PDF / Word / Excel / PowerPoint / text

Output:
- normalized Markdown
- conversion notes
- suspected missing or broken sections

Gate focus:
- content completeness
- table / list / heading preservation
- manual fix required or not

#### S2 Document Structure & Chunking
Purpose: split normalized Markdown into meaningful chunks.

Output:
- chunk list
- chunk ID
- source location
- section title
- content type
- confidence

Gate focus:
- chunk boundaries
- no important requirement split incorrectly
- stable chunk IDs

#### S3 Requirement Extraction
Purpose: extract requirement candidates from chunks.

Output:
- requirement candidates
- source chunk ID
- actor / function / data / rule / error if available
- confidence
- assumptions separated from facts

Gate focus:
- no invented requirements
- every requirement traceable to source chunk
- false positives removed

#### S4 RCD Consolidation
Purpose: consolidate, merge, deduplicate, and filter requirement candidates into an RCD.

Output:
- RCD draft
- grouped requirements
- duplicate / overlap merge list
- contradiction list
- open questions
- assumptions

Gate focus:
- no important requirement lost
- contradictions visible
- open questions explicit
- assumptions not hidden as facts

#### S5 RCD Layering & Numbering
Purpose: divide the RCD into layers and assign stable IDs.

Output:
- L1 business scope
- L2 function / screen / API / process
- L3 detailed requirement
- L4 data / validation / error / exception
- stable numbering such as RCD-001, RCD-001.1

Gate focus:
- no duplicate IDs
- parent-child logic clear
- BD can reference RCD IDs

#### S6 BD Generation From Template
Purpose: generate BD draft using the layered RCD and fixed BD template.

Input:
- layered RCD
- BD template
- glossary
- design rules

Output:
- BD draft
- RCD-to-BD mapping
- assumptions
- open questions

Gate focus:
- template compliance
- traceability to RCD IDs
- no unsupported design logic

#### S7 AI Self Review / Consistency Review
Purpose: let AI review RCD or BD before human gate review.

Output:
- coverage issues
- unsupported assumptions
- contradictions
- missing sections
- traceability gaps
- gate recommendation: PASS / REVISE / BLOCKED

Rules:
- AI self-review can recommend but cannot approve.
- AI must not praise the draft.
- AI must not rewrite the whole document unless requested.
- AI must separate fact, assumption, and inference.

#### S8 Human Gate Review Pack
Purpose: prepare a compact review package for human reviewers.

Output:
- human review checklist
- high-risk items
- decision points
- questions requiring judgment
- final gate form

Gate focus:
- reduce human effort while preserving human judgment
- make pass / revise / blocked decisions explicit

### Recommended human gates

#### H-Gate 1 Source Completeness Check
Placed after S1 and S2.

Human decision:

```text
PASS / RECONVERT / MANUAL FIX
```

Reviewer checks whether Markdown and chunks are usable before LLM extraction continues.

#### H-Gate 2 Requirement Candidate Check
Placed after S3.

Human decision:

```text
ACCEPT / REMOVE / NEED CLARIFICATION
```

Reviewer checks whether extracted requirement candidates are real requirements, notes, references, or AI misunderstandings.

#### H-Gate 3 RCD Structure Approval
Placed after S4 and S5.

Human decision:

```text
APPROVE STRUCTURE / RESTRUCTURE / BLOCKED
```

Reviewer checks grouping, layers, numbering, traceability, and whether requirements were merged incorrectly.

#### H-Gate 4 RCD Business Approval
Placed after AI self-review of RCD.

Human decision:

```text
READY FOR BD / REVISE RCD / CUSTOMER CLARIFICATION
```

Reviewer checks business correctness, dangerous assumptions, open questions, and whether the RCD is enough to create BD.

#### H-Gate 5 BD Draft Review
Placed after S6 and S7.

Human decision:

```text
PASS / REVISE / BLOCKED
```

Reviewer checks whether BD follows the template, maps to RCD IDs, avoids unsupported content, and contains enough design detail.

#### H-Gate 6 Dev-Readiness / Final Approval
Placed after S8.

Human decision:

```text
DEV-READY / DEV-READY WITH ASSUMPTIONS / NOT READY
```

Reviewer checks whether developers can implement from the BD, what remains unclear, and whether customer clarification is required before development.

### Skill and prompt relationship

```text
Skill = reusable capability / module of work
Prompt = executable instruction used to perform the skill
Agent = orchestrator that uses multiple skills
Workflow = chain of skills + gates + human review
```

Do not optimize isolated prompts first. Optimize the skill definition, then update prompt templates inside the skill.

### AI Pack required contents

Each skill must include:

```text
Purpose
Input
Output
Prompt template
Expected output format
Gate criteria
Failure cases
Optimization rule
```

The full AI Pack should include:

```text
Workflow overview
Skill list
Skill detail
Prompt template per skill
Expected output per prompt
Review gate per skill
Failure log taxonomy
Optimization rule
Sample run record
Version history
```

### Failure log taxonomy

Use a structured failure log instead of free-form comments.

```text
F1 Unsupported assumption
F2 Missing requirement coverage
F3 Wrong business logic
F4 Format / template mismatch
F5 Inconsistent terminology
F6 Missing validation / error case
F7 Japanese ambiguity
F8 Dev-readiness gap
F9 Over-generation / unnecessary content
F10 Needs customer clarification
F11 Chunking / source boundary error
F12 RCD numbering or hierarchy error
```

Failure log row:

```text
Case ID:
Skill:
Prompt version:
Gate:
Failure type:
Example:
Severity: Critical / Major / Minor
Detected by: AI / Human
Fix type: Prompt / Checklist / Template / Human rule / Customer clarification
Action:
```

### Optimization loop

After each sample, optimize in this order:

```text
1. Fix input contract if source ambiguity caused the problem.
2. Fix checklist if reviewers did not know how to judge output.
3. Fix prompt if the LLM misunderstood the task.
4. Fix output format if downstream steps were hard to consume.
5. Fix human gate rule if judgment or responsibility was unclear.
6. Fix workflow only if the step order caused repeated failure.
```

For sample 1, the goal is to debug the workflow. For sample 2, the goal is to prove repeatability using the same skills, gates, and output formats.

## Application To OPUS ANIMUS
This pilot should become an internal proof of FDE-lite capability. It tests whether a small team can improve a real delivery workflow through AI-assisted processing, structured review gates, and measurement.

If repeatable, this can become a diagnostic sprint or pilot offer for offshore-to-FDE transformation.

## Open Questions
- Which BD type should be the first official sample: screen design, API/IF design, business logic design, or data mapping?
- How much human-in-the-loop is necessary before the workflow becomes too slow?
- Which prompt/skill should be optimized first after sample 1?
- What metric best proves improvement: time to draft, review comment count, dev clarification count, or missing requirement detection?

## Applied
- 2026-05-19 — Captured the BD/RCD AI Pack pilot architecture after discussion of skills, prompts, AI self-review, and human-in-the-loop gates.
- 2026-05-21 — Added MVP boundary: LLM wiki layer is out of scope for delivery-oriented RCD; use structured RCD + EARS + source labels + human gates instead.

## See Also
- [[outcome-based-fde-model]]
- [[fde-model]]
- [[fde-roadmap]]
- [[fde-dashboard-sync]]

## Sources