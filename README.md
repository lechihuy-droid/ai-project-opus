# Opus Consilium

Private Consilium wiki export for ChatGPT mobile access.

This repository is not an application codebase. The main content is the Markdown wiki under:

```text
personal-wiki/
```

Start with these decision pages:

```text
personal-wiki/Personal/wiki-chat-protocol.md
personal-wiki/Personal/current-beliefs.md
personal-wiki/Personal/open-questions.md
personal-wiki/Personal/decisions.md
personal-wiki/Personal/active-project-context.md
personal-wiki/AI/ai-trend-radar.md
personal-wiki/Personal/reskill-roadmap.md
personal-wiki/Stock/investment-theses.md
```

For the Opus Home FDE tab, read this wiki area:

```text
personal-wiki/FDE/fde-dashboard-sync.md
personal-wiki/FDE/fde-model.md
personal-wiki/FDE/fde-japan-gap-analysis.md
personal-wiki/FDE/fde-roadmap.md
personal-wiki/FDE/fde-adoption-radar.md
personal-wiki/FDE/fde-research-queue.md
```

For research source routing and Intel-to-wiki sync, read:

```text
personal-wiki/Research/research-source-map.md
personal-wiki/Research/intel-to-wiki-promotion.md
```

Use this repo as a decision brain for AI trends, re-skill planning, investment thinking, and Opus Animus/Lucida workflow implications.

## Cloud-First Operating Rules

Treat GitHub `main` as the source of truth for wiki content.

Use ChatGPT mobile/cloud for:

- small and medium Markdown updates
- short synthesis bullets
- decision log entries
- open questions
- small topic pages
- README or hub-page routing links

Reserve local Codex for:

- sync and audit
- schema changes
- dashboard/API/code changes
- bulk imports or renames
- Obsidian cleanup
- complex conflict resolution

Before creating a new folder or topic, check:

```text
personal-wiki/SCHEMA.md
personal-wiki/INDEX.md
```

If a new topic is needed, update both `SCHEMA.md` and `INDEX.md` in the same commit.

For every GitHub edit, return:

```text
changed files
commit hash
decision label
```

Recommended ChatGPT mobile prompt:

```text
Use opus-consilium.
Read lechihuy-droid/opus-consilium.
Start from README.md, then read the decision pages listed there.
Give me today's AI trend from the Consilium wiki.
Return:
1. Signal
2. What it means
3. Update wiki or ignore?
4. Which page should change?
Do not edit unless I say "update wiki".
```
