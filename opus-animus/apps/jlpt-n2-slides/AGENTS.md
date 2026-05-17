# AGENTS — jlpt-n2-slides

Agent roles + handoff rules for the slide generation pipeline.

---

## Agent Map

```
JLPT N2 Slide Agent
├── Claude Orchestrator
│   ├── reads teaching-skeleton.md + video-script.md
│   ├── creates slide-plan.json
│   ├── reviews lesson logic
│   ├── reviews HTML deck against plan + skeleton
│   └── drives OD MCP via prompts/*
│
├── Open Design MCP
│   ├── builds N2 master template
│   ├── renders HTML deck from slide-plan.json
│   ├── fixes layout from qa-report.md
│   └── exports final artifact
│
└── QA Loop
    ├── layout QA (overflow, hierarchy, spacing)
    ├── teaching QA (pedagogy, clarity)
    ├── skeleton-mapping QA (every slide ↔ skeleton section)
    └── final publish check (score /10)
```

---

## Hard Rules

1. **OD MCP is render-only.** It never invents lesson structure. Claude creates `slide-plan.json` first.
2. **No HTML without an approved plan.** `slide-plan.json` must be user-approved before Mode 2.
3. **No redesign during fix.** Mode 3 (Layout Fixer) applies only the fixes listed in `qa-report.md` — no aesthetic changes.
4. **Speaker notes are first-class.** Long explanations go in `<aside class="notes">`, not on the slide.
5. **Every slide carries `data-slide-id` and `data-duration`** for YouTube sync.

---

## Session Handoff

Follows parent `opus-animus/` convention. End of session → `/handoff` updates:

- `ai/status.md` — current lesson, current mode (Builder/Renderer/Fixer/Export), blocker
- `ai/handoff-claude.md` — exact next prompt to run from `prompts/`
- `ai/sessions/YYYY-MM-DD-<lesson>.md` — what changed, qa-report verdict

---

## Owner Switching

If a session switches owner (Claude ↔ Codex), the new owner reads `ai/status.md` first, then runs the next prompt from `prompts/` rather than improvising.
