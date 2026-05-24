---
title: "EARS for RD to RCD"
aliases: ["EARS Requirement Normalization", "RD to RCD with EARS", "EARS for Basic Design"]
topic: FDE
tags: [fde, ai-sdlc, requirements, ears, rcd, bd, human-in-the-loop, upstream]
status: evergreen
confidence: medium
sources: []
related: ["[[bd-rcd-ai-pack-pilot]]", "[[outcome-based-fde-model]]"]
applied: []
open_questions:
  - "Should EARS normalization be mandatory for all RCD items or only behavior-oriented requirements?"
  - "How strict should source authority rules be when QA appears to modify signed-off RD?"
  - "What minimum RCD schema is enough for the first BD sample?"
created: 2026-05-20
updated: 2026-05-20
---

# EARS for RD to RCD

## Summary
EARS / Easy Approach to Requirements Syntax is a structured natural-language pattern for writing requirements clearly. In the BD/RCD pilot, EARS should be used as a control mechanism for the upstream phase: RD / QA / pending decisions / legacy references → RCD.

The goal is not to make requirement sentences look formal. The goal is to force each requirement to expose its condition, trigger, system behavior, source, confidence, assumptions, and open questions before it is used to generate Basic Design.

## Key Points
- EARS is not a tool and not a full SDLC framework. It is a requirement syntax pattern.
- EARS helps turn ambiguous natural-language requirements into reviewable, traceable, testable statements.
- In this pilot, EARS should be applied after requirement candidate extraction, not directly to the whole raw RD.
- EARS must be combined with source labels, source references, confidence, status, gap/conflict logs, and human gates.
- EARS should control the input side. Spec-driven / Spec Kit style traceability should control the BD generation side.

## Why It Matters
The BD/RCD pilot is intended to prove that AI adoption depends on problem-solving design, not only engineering. EARS supports that thesis because it makes the upstream problem explicit: unclear requirements must be decomposed, normalized, sourced, reviewed, and approved before AI generates design content.

Without EARS-like normalization, AI may summarize RD fluently but mix confirmed facts, QA clarifications, pending decisions, legacy behavior, and AI inference. That is dangerous for BD creation because upstream ambiguity propagates into design, development, and testing.

## EARS Concept
EARS stands for Easy Approach to Requirements Syntax.

A simple way to remember it:

> EARS = a way to write requirements as "under what condition / when what happens / the system shall do what".

Typical elements:
- Condition or state
- Trigger or event
- System/module responsible
- Required behavior

Common patterns:

### Ubiquitous requirement
Used for rules that always apply.

Pattern:
- The system shall [behavior].

Example:
- The system shall record the created date and created user for each application.

### Event-driven requirement
Used when a trigger/event causes behavior.

Pattern:
- When [trigger], the system shall [behavior].

Example:
- When the user clicks Submit, the system shall validate required input fields.

### State-driven requirement
Used when behavior depends on a state.

Pattern:
- While [state], the system shall [behavior].

Example:
- While the application status is Approved, the system shall prevent the applicant from editing the application.

### Optional/configuration requirement
Used when behavior applies only under a feature/configuration.

Pattern:
- Where [feature/configuration applies], the system shall [behavior].

Example:
- Where email notification is enabled, the system shall send an approval request email to the approver.

### Exception/unwanted behavior requirement
Used for validation errors, failures, or exceptions.

Pattern:
- If [unwanted condition], then the system shall [behavior].

Example:
- If the user enters an invalid amount, then the system shall display a validation error.

## Source Types In The Pilot
The input side should distinguish source authority before converting requirement candidates into EARS-style RCD items.

### Source A: Signed-off RD
Role: primary source of truth.

Use for:
- business requirements
- functional requirements
- screen/API/process requirements
- approved scope
- approved constraints

Label:
- RD_FACT

Rule:
- If RD states it clearly, it can become a confirmed RCD requirement.
- If RD is vague, mark it as UNCLEAR_FROM_RD instead of over-interpreting.

### Source B: QA attached to RD
Role: clarification layer.

Use for:
- clarifying ambiguous RD items
- adding conditions or exceptions
- recording decision history

Labels:
- QA_CLARIFICATION
- QA_ADDITION_NEEDS_APPROVAL
- CONFLICT_RD_QA

Rule:
- QA can clarify RD.
- QA should not silently override signed-off RD.
- If QA changes scope or contradicts RD, flag conflict and send to human gate.

### Source C: Pending decision items for BD
Role: decision backlog, not requirement fact.

Use for:
- open decisions
- assumptions
- design decision candidates
- questions that must be resolved in BD

Labels:
- PENDING_DECISION
- OPEN_DECISION

Rule:
- Do not convert pending items into confirmed requirements.
- Keep them visible as BD decisions or open questions.

### Source D: Legacy source / old system / data table / technical reference
Role: technical reference.

Use for:
- data item candidates
- current behavior reference
- validation reference
- table/column/API reference
- hidden technical constraints

Labels:
- LEGACY_REFERENCE
- TECH_DETAIL_CANDIDATE
- TECHNICAL_INFERENCE
- LEGACY_BEHAVIOR_NEEDS_CONFIRMATION

Rule:
- Do not automatically convert legacy behavior into business requirement.
- If legacy differs from RD, RD wins but conflict must be logged.

## Source Authority Model

| Source | Authority | Use For | Do Not Use For |
|---|---:|---|---|
| Signed-off RD | Very high | Confirmed requirement facts | Ignoring conflicts from other sources |
| QA attached to RD | Medium-high | Clarification and decision history | Silent RD override |
| Pending BD items | Medium | Open decision / assumption | Confirmed requirement fact |
| Legacy source/data table | Low-medium | Technical reference | New business requirement |
| AI inference | Low | Suggestion / gap detection | Approved fact |

## Recommended RD to RCD Flow

1. Source ingestion
2. Markdown normalization
3. Chunking
4. Source classification
5. Requirement candidate extraction
6. EARS normalization
7. Gap/conflict detection
8. RCD consolidation
9. RCD layering and numbering
10. Human RCD approval gate

Important rule:
- Do not apply EARS directly to all raw input in one pass.
- First classify source and extract candidates, then normalize into EARS.

## RCD Item Schema

Each RCD item should include:

| Field | Meaning |
|---|---|
| RCD ID | Stable ID |
| Layer | L1/L2/L3/L4 |
| EARS Type | Event / State / Conditional / Optional / Ubiquitous |
| Requirement Statement | Normalized EARS-style requirement |
| Source Label | RD_FACT / QA_CLARIFICATION / PENDING_DECISION / LEGACY_REFERENCE / AI_INFERENCE |
| Source Ref | RD section, QA ID, pending item ID, source path, table/column |
| Confidence | High / Medium / Low |
| Status | Confirmed / Needs Review / Pending Decision / Conflict |
| Assumption | Explicit assumption if any |
| Open Question | Question for customer/human reviewer |
| Conflict Flag | Conflict ID if any |
| BD Impact | Screen / API / DB / Batch / IF / Business Logic |
| Notes | Reviewer notes |

## RCD Layering

Recommended layers:

### L1 Business capability / scope
Examples:
- Application submission
- Approval workflow
- Notification
- Master data management

### L2 Function / screen / API / process
Examples:
- Application registration screen
- Approval API
- Notification batch
- Status update process

### L3 Requirement
EARS-style requirement statement.

Example:
- When the user clicks Submit, the system shall validate required fields.

### L4 Detail / data / validation / exception
Examples:
- Required fields
- Error message candidate
- Max length
- Status transition
- Data type candidate

## Human Gates For Input to RCD

### Gate R1: Source Completeness Gate
Placed after Markdown/chunking.

Reviewer checks:
- RD sections are complete.
- QA is linked to RD where possible.
- Pending list is included.
- Legacy source/data table is readable.
- Tables/images were not lost during conversion.

Decision:
- PASS
- RECONVERT
- MANUAL FIX
- BLOCKED

### Gate R2: Requirement Candidate Gate
Placed after requirement extraction.

Reviewer checks:
- Is this a real requirement?
- Is it only a note/reference?
- Is it technical reference only?
- Did AI misunderstand it?
- Should it be split or merged?

Decision:
- ACCEPT
- REMOVE
- SPLIT
- MERGE
- NEEDS CLARIFICATION

### Gate R3: EARS Normalization Gate
Placed after EARS conversion.

Reviewer checks:
- Does the EARS statement match RD/QA meaning?
- Did AI turn pending/legacy into fact?
- Are condition, trigger, actor, and behavior clear enough?
- Are assumptions explicit?

Decision:
- CONFIRMED
- REWRITE
- DOWNGRADE TO ASSUMPTION
- MOVE TO OPEN QUESTION

### Gate R4: RCD Approval Gate
Placed after consolidation/layering/numbering.

Reviewer checks:
- Is RCD ready for BD?
- Are open questions clear?
- Are pending decisions separated?
- Are conflicts logged?
- Are BD impact tags assigned?

Decision:
- READY FOR BD
- READY WITH ASSUMPTIONS
- REVISE RCD
- CUSTOMER CLARIFICATION REQUIRED

## Skills For Input to RCD

### Skill R1: Source Classification
Purpose: classify each chunk/source item by authority and role.

Output:
- RD_FACT candidate
- QA_CLARIFICATION candidate
- PENDING_DECISION candidate
- LEGACY_REFERENCE candidate
- AI_INFERENCE candidate

### Skill R2: Requirement Candidate Extraction
Purpose: extract requirement candidates from classified chunks.

Output:
- candidate text
- source ref
- candidate type
- confidence
- reason

### Skill R3: EARS Normalization
Purpose: convert candidates into EARS-style RCD items.

Output:
- EARS statement
- EARS type
- missing EARS element
- source label
- confidence

### Skill R4: Gap and Conflict Detection
Purpose: detect missing information and source conflicts.

Output:
- gap log
- conflict log
- open questions
- suggested human gate action

### Skill R5: RCD Consolidation, Layering, and Numbering
Purpose: merge duplicates, preserve traceability, assign layers and stable IDs.

Output:
- layered RCD
- stable IDs
- BD impact tags
- pending decision list
- open question list

## Gap Types

Common gaps:
- missing actor
- missing trigger
- missing data item
- missing validation rule
- missing exception handling
- missing status transition
- missing permission rule
- missing external dependency

## Conflict Types

Common conflicts:
- RD vs QA
- RD vs legacy
- QA vs pending list
- requirement vs data table
- duplicate/overlapping requirements

## Definition of Done For RCD

RCD is ready for BD when:
- Every RCD item has a source reference.
- Every confirmed requirement has source label RD_FACT or QA_CLARIFICATION.
- No pending decision is written as confirmed fact.
- No legacy reference is promoted to business requirement without approval.
- Major conflicts have decisions or open questions.
- Critical gaps have open questions.
- Each RCD item has a BD impact tag.
- Human gate R4 returns READY FOR BD or READY WITH ASSUMPTIONS.

## Relationship With Spec-Driven BD Generation

EARS controls the input side:
- requirement clarity
- condition/trigger/behavior
- source labeling
- gap/conflict detection

Spec-driven / Spec Kit style traceability controls the output side:
- RCD as source of truth
- BD items mapped to RCD IDs
- separation of input-derived content vs design decisions
- design assumptions and open questions explicitly labeled

Together:
- EARS prevents weak input from entering BD generation.
- Spec-driven traceability prevents BD from mixing input facts with newly created design decisions.

## Application To OPUS ANIMUS
This note supports the FDE-lite thesis that AI adoption depends first on problem-solving and workflow design, not engineering. EARS is useful because it forces the team to structure the problem before generating output.

In the BD/RCD case, EARS helps PM/BrSE reviewers see whether the input is clear enough, whether AI is inventing content, and where human decisions are required.

## Applied
- 2026-05-20 — Captured the EARS concept and proposed approach for RD / QA / pending decisions / legacy references → RCD, including source authority, RCD schema, human gates, skills, and definition of done.

## See Also
- [[bd-rcd-ai-pack-pilot]]
- [[outcome-based-fde-model]]

## Sources
