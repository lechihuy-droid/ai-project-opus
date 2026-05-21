---
title: "Chat To Wiki Classification Skill"
aliases: ["Chat Classification Skill", "Conversation To Wiki Skill", "Chat Routing Skill", "Wiki Intake Skill"]
topic: Research
tags: [research, wiki-ops, chat-to-wiki, classification, decision-brain, consilium]
status: evergreen
confidence: medium
sources: ["README.md", "AGENTS.md", "workflows/consilium-review.md", "personal-wiki/Research/intel-to-wiki-promotion.md"]
related: ["[[intel-to-wiki-promotion]]", "[[research-source-map]]", "[[open-questions]]", "[[decisions]]", "[[active-project-context]]", "[[ai-trend-radar]]", "[[reskill-roadmap]]"]
applied: []
open_questions:
  - "Should chat-derived insights be stored only in hub pages, or should repeated patterns create source-seed pages?"
  - "How much user intent is required before a chat idea becomes a durable wiki update?"
created: 2026-05-21
updated: 2026-05-21
---

# Chat To Wiki Classification Skill

## Summary
This skill classifies important chat content and decides whether it should be ignored, kept as temporary context, routed to an existing hub page, added as an open question, recorded as a decision, or converted into a new page.

Core rule:

> A chat message becomes wiki knowledge only when it affects a decision, project, method, roadmap, thesis, open question, or reusable operating rule.

The goal is to keep Consilium as a decision brain, not a transcript archive.

## When To Use
Use this skill when a conversation contains:
- a new project idea
- a decision or preference from Huy
- a reusable method or skill
- an open question worth tracking
- a filter rule for future news/research
- a correction to an existing belief
- a project scope boundary
- a repeatable workflow pattern

Do not use it to save every chat. Most chat should not enter the wiki.

## Inputs
Minimum input:

| Input | Meaning |
|---|---|
| chat_excerpt | short excerpt or summary of the relevant chat |
| user_intent | what Huy seemed to want: decide, explore, update, ignore, test |
| topic | AI, FDE, Research, Personal, Stock, Business, etc. |
| durability | one-off, recurring, reusable, decision-grade |
| affected_project | Opus Animus, Consilium, Lucida, FDE-lite, health app, etc. |
| current_page_candidate | existing page that may receive the update |

## Outputs
The skill should output:

| Output | Meaning |
|---|---|
| classification | ignore, temporary_context, hub_update, open_question, decision, method, new_page_candidate |
| target_page | smallest existing Markdown page to update |
| update_type | add bullet, add section, add open question, add decision, create page |
| decision_label | keep, change, test, ignore, research |
| reason | why the chat is or is not durable |
| confidence | high, medium, low |

## Classification Rules

| Classification | Meaning | Default action |
|---|---|---|
| ignore | interesting but not useful later | no wiki update |
| temporary_context | useful only in current session | no wiki update unless repeated |
| hub_update | affects existing hub | update smallest hub section |
| open_question | creates uncertainty to track | update [[open-questions]] or page frontmatter |
| decision | user made a durable choice | update [[decisions]] or relevant decision page |
| method | reusable workflow/skill | update or create method page |
| new_page_candidate | too large for hub and likely reusable | create page only if needed |

## Routing Rules

| Chat content | Primary route |
|---|---|
| AI trend affecting tools/workflow | [[ai-trend-radar]] |
| Reskill or learning priority | [[reskill-roadmap]] |
| Durable user/project context | [[active-project-context]] |
| Open question | [[open-questions]] |
| Durable decision | [[decisions]] |
| Research/news promotion rule | [[intel-to-wiki-promotion]] |
| Source routing/filtering | [[research-source-map]] or [[intel-to-wiki-promotion]] |
| FDE-lite / BD-RCD method | relevant FDE method page |
| Investment thesis | [[investment-theses]] |

## Promotion Criteria
Promote chat content to the wiki only if at least one is true:
- Huy explicitly asks to update the wiki.
- The chat records a decision or boundary.
- The insight will likely be reused across future sessions.
- The insight changes an active project or roadmap.
- The insight creates a useful open question.
- The insight defines a reusable method, skill, filter, or workflow.
- The same pattern appears repeatedly across conversations.

Do not promote if:
- it is only casual brainstorming
- it is a one-off answer
- it does not affect a future decision
- it would duplicate an existing page
- it would create a new page just to preserve a transcript

## Token Discipline
This skill must be lightweight.

Rules:
- Do not paste full conversation transcripts into the wiki.
- Summarize only the durable decision or reusable insight.
- Prefer updating an existing hub page over creating a new page.
- Create at most one wiki update per classification run unless explicitly requested.
- Use short bullets instead of long prose.
- If uncertain, record an open question instead of a conclusion.

## Prompt Lite
Use this after a conversation when deciding whether anything should enter Consilium.

```text
Run the Chat To Wiki Classification Skill.

Input:
- Chat excerpt or summary:
- User intent:
- Current Consilium focus:

Output:
- classification: ignore / temporary_context / hub_update / open_question / decision / method / new_page_candidate
- target_page:
- update_type:
- reason:
- decision_label: keep / change / test / ignore / research

Rules:
- Do not save transcript content.
- Prefer the smallest existing Markdown page.
- Do not create a new page unless the insight is reusable and too large for a hub.
```

## Prompt Standard
Use for end-of-day or weekly chat review.

```text
Run the Chat To Wiki Classification Skill on today's conversation themes.

For each theme, classify:
- durable insight
- classification
- target page
- update type
- decision label
- reason

Then recommend:
1. What should be updated now?
2. What should stay temporary?
3. What should be ignored?
4. What open question should be added, if any?

Rules:
- Keep Consilium as a decision brain, not a transcript archive.
- Update only the smallest necessary Markdown page.
- If no durable insight exists, return no update.
```

## Examples

### Example 1 — Health app idea
Chat: Huy proposes a personal health management app using food photos and raw activity data.
Classification: hub_update.
Target page: [[active-project-context]].
Update type: candidate project idea.
Decision label: test.
Reason: affects Opus Animus/reskill context but is not yet an active build commitment.

### Example 2 — Skill-first vs agent-first
Chat: Huy asks about agent-first tooling and future trend.
Classification: method.
Target page: [[agent-first-vs-skill-first]].
Update type: create or update method page.
Decision label: test.
Reason: reusable distinction for AI workflow design.

### Example 3 — Casual explanation
Chat: Huy asks what artifact means.
Classification: temporary_context.
Target page: none.
Update type: none.
Decision label: keep.
Reason: useful explanation, but not necessarily durable unless reused in a method page.

### Example 4 — Explicit boundary
Chat: Huy says health should stay separate because he is creating a dedicated health app.
Classification: decision.
Target page: [[active-project-context]] or [[decisions]].
Update type: project boundary note.
Decision label: change.
Reason: clarifies scope and prevents Consilium from over-expanding into Health.

## Human Gate
Pass:
- The skill identifies the smallest correct route and avoids transcript storage.

Revise:
- The skill suggests a new page when a hub update is enough.
- The target page is plausible but not the smallest route.

Blocked:
- The skill stores private/raw chat unnecessarily.
- The skill promotes a casual idea into a durable decision without user intent.
- The skill creates duplicate pages.

## Metrics
Track lightly:
- number of chat themes classified
- number ignored
- number promoted to hub updates
- number converted to decisions
- number of duplicate/new-page proposals avoided

## Application To OPUS ANIMUS
This skill turns ChatGPT conversations into a controlled intake layer for Consilium. It helps preserve durable insight without polluting the wiki with raw chat history.

Use it together with [[intel-to-wiki-promotion]]: Intel-to-wiki handles external signals; Chat-to-wiki handles Huy's own thinking and decisions.

## Open Questions
- Should a weekly chat review run classify all important conversation themes?
- Should explicit phrases like "update wiki" and "để đấy" become routing signals?
- Should chat-derived decisions always go to [[decisions]], or stay near the relevant project page?

## Applied
- 2026-05-21 — Created to support controlled routing from ChatGPT conversations into Consilium.

## See Also
- [[intel-to-wiki-promotion]]
- [[research-source-map]]
- [[open-questions]]
- [[decisions]]
- [[active-project-context]]
- [[ai-trend-radar]]
- [[reskill-roadmap]]

## Sources
- `README.md`
- `AGENTS.md`
- `workflows/consilium-review.md`
- `personal-wiki/Research/intel-to-wiki-promotion.md`
