# STATUS — jlpt-n2-slides
**Updated:** 2026-05-13
**Current owner:** Claude

## Objective

Set up Open Design-based pipeline to generate YouTube-format HTML slide decks for JLPT N2 grammar lessons.

## Active sub-systems

| Sub-system | Status | Note |
|---|---|---|
| Folder scaffold v2 | Done | Per user spec — `lessons/`, `templates/n2-master/`, `prompts/`, `ai/` |
| `CLAUDE.md` | Done | Pipeline + 4 MCP modes documented |
| `AGENTS.md` | Done | Agent roles + handoff rules |
| `template-rules.md` | Done | 16:9 + 3:4 ready, char budgets per slide type, `data-slide-id`/`data-duration` required |
| `brand-tokens.json` | Done v0.1 | Placeholder palette (JP-blue accent), pending user confirmation |
| `templates/n2-master/slide-types.md` | Done | 11 slide types with slot contracts |
| `templates/n2-master/design-system.md` | Done | Visual direction + rationale |
| `prompts/01..04` | Done | Pipeline driver prompts written |
| `templates/n2-master/sample-template.html` | **Next** | Mode 1: build master template (one-time) |
| `lessons/wake-family/` | Stubbed | Empty dir — awaiting `teaching-skeleton.md` + `video-script.md` |
| `slide-plan.json` schema spec | Open | User to confirm slot names match `slide-types.md` |

## Next step

1. User confirms accent color + font stack in `brand-tokens.json._pending` (or accepts placeholder).
2. Build `templates/n2-master/sample-template.html` (Mode 1 / Template Builder) — exercise all 11 slide types with placeholder content.
3. Validate master visually in OD daemon.
4. User supplies `lessons/wake-family/teaching-skeleton.md` + `video-script.md` → run `prompts/01-create-slide-plan.md`.

## Constraints

- Follow parent `opus-animus/CLAUDE.md` (SDD, Vietnamese responses, Python 3.11).
- OD MCP is render-only; never let it author lesson content.
- No new slide type without updating `slide-types.md` + `template-rules.md` first.
- Mode 3 (Layout Fixer) never redesigns.

## Open questions

- Accent color: JP-blue `#0B3D91` vs editorial terracotta `#B7472A` — TBD after thumbnail test.
- Whether `brand-tokens.json` compiles to CSS automatically or is hand-mirrored — v1: hand-mirrored.
- `slide-plan.json` JSON Schema file — defer until first lesson is in flight.
