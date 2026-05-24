---
title: "Wiki Chat Protocol"
aliases: ["Codex Wiki Protocol", "Daily Wiki Chat"]
topic: Personal
tags: [decision-brain, codex, workflow, mobile]
status: evergreen
confidence: medium
sources: []
related: ["[[current-beliefs]]", "[[active-project-context]]", "[[open-questions]]", "[[decisions]]", "[[ai-trend-radar]]", "[[reskill-roadmap]]", "[[investment-theses]]"]
applied: []
open_questions: ["Which prompt format produces the best daily output?", "Can ChatGPT mobile become a reliable inbox for wiki decisions?"]
created: 2026-05-19
updated: 2026-05-19
---

# Wiki Chat Protocol

## Summary
This page defines how Huy should talk with Codex about the wiki. Codex is the interface; Obsidian is optional for deep reading.

## Key Points
- Do not ask for all news.
- Ask for decision impact across AI trends, re-skill, and investment thinking.
- Codex should read the decision pages first, then inspect relevant seed pages.
- Every answer should separate signal, action, risk, and what to ignore.
- ChatGPT mobile is for quick briefs, routing, and small approvals; desktop Codex remains the place for source inspection, file edits, and verification.
- GitHub `main` is the source of truth for wiki content; local Codex is the sync, audit, schema, dashboard/API, and bulk-edit backstop.
- Before creating a new folder or topic, check `SCHEMA.md` and `INDEX.md`. If a new topic is needed, update both in the same commit.
- Every cloud edit should return changed files, commit hash, and decision label.

## Why It Matters
The wiki should reduce cognitive load. A stable chat protocol keeps daily use simple.

## Details
Daily prompt:

```text
Use the wiki decision brain. Give me today's AI trend, re-skill, and investment brief:
1. What changed?
2. What should I do?
3. What should I ignore?
4. Which wiki pages should be updated?
```

Weekly prompt:

```text
Use the wiki decision brain. Update my current beliefs, open questions, re-skill roadmap, and investment theses from this week's sources.
```

Deep-dive prompt:

```text
Use the wiki to analyze this trend for Opus Animus, Lucida, re-skill, and investment implications. Separate evidence from speculation.
```

Mobile inbox prompt:

```text
Use opus-consilium.
Give me today's AI trend for the Consilium wiki.
Return only:
1. Signal
2. What it means
3. Update wiki or ignore?
4. If update, which page and why?
Do not edit files unless I explicitly say "update wiki".
```

Mobile approval prompt:

```text
Use opus-consilium.
Update only the page you recommended.
Keep the change small.
Show me the changed page name and the decision label.
```

Cloud update prompt:

```text
Use opus-consilium.
Read README.md, SCHEMA.md, INDEX.md, and the relevant hub/topic pages.
Update the wiki directly on GitHub.

Rules:
- Treat GitHub main as the source of truth for wiki content.
- Keep changes small and decision-oriented.
- Do not rewrite whole pages unless necessary.
- Add sources when the update is based on external facts.
- Add links to related hub pages.
- Before creating a new folder/topic, check SCHEMA.md and INDEX.md.
- If a new topic is needed, update both SCHEMA.md and INDEX.md in the same commit.
- Return changed files, commit hash, and decision label.
```

## Application To OPUS ANIMUS
Use this page as the operating contract for Codex-wiki conversations.

For mobile ChatGPT, use Consilium as a decision inbox, not a full editing environment. Mobile is good for asking what changed, deciding whether a source matters, and approving a narrow wiki update. Avoid approving broad thesis changes, multi-page edits, or investment conclusions from mobile unless the evidence has already been reviewed on desktop.

Cloud-first does not mean cloud-only. GitHub is the source of truth for Markdown wiki content, but local Codex remains responsible for audit, sync, schema-sensitive changes, Opus Home dashboard/API code, bulk operations, and conflict resolution.

## Open Questions
- Should the daily output be saved as a reflection page?
- Which signals should trigger a new decision log entry?

## Applied
- 2026-05-19 - Test ChatGPT mobile as a lightweight Consilium inbox for daily AI trend review and narrow wiki-update approval.
- 2026-05-19 - Adopt cloud-first wiki updates with schema/index guardrails and local Codex as audit/backstop.

## See Also
- [[current-beliefs]]
- [[active-project-context]]
- [[open-questions]]
- [[decisions]]
- [[ai-trend-radar]]
- [[reskill-roadmap]]
- [[investment-theses]]

## Sources
