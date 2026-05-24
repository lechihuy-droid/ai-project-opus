# Lucida · N2 Slide Template Gallery

**Status:** Active v1.0
**Date:** 2026-05-19
**Scope:** Reusable HTML slide templates for any JLPT N2 grammar cluster
**Role:** Implementation layer — concrete HTML/CSS/JS gallery a deck author clones from
**Owner layer:** rule / policy → implementation artifact
**Parent:** `../02-slide-template-library.md` (canonical spec) · `../03-slide-design-production-rules.md` (production rules)
**Supersedes:** —
**Superseded by:** —

## What this folder answers

> "Where do I copy from when I start a new grammar-cluster deck?"

The 25 templates in `lucida-n2-slide-templates.html` are the rendered, working HTML the deck author clones. They implement the contract defined in the parent spec (`02-slide-template-library.md`).

## Files

| File | Role |
|---|---|
| `lucida-n2-slide-templates.html` | 25-slide gallery (T01–T25), 1920×1080, Wake cluster demo data |
| `lucida-n2-slide-templates.md` | Per-template spec — Purpose · Slots · Keep · Don't · Use-when |
| `deck-stage.js` | Slide shell — scaling, keyboard nav (←/→), print-to-PDF, screen labels |
| `tweaks-panel.jsx` | Tweaks panel (A/B test type + spacing + color mode) — optional |

## Template index (T01–T25)

| ID | Name | Use |
|---|---|---|
| T01 | Hook Situation | Open with pain point (5–15s) |
| T02 | Hook Contrast | 2 near-identical sentences, different logic |
| T03 | Quiz Before/After | Learner attempt before reveal |
| T04 | Promise Board | State outcome after hook |
| T05 | Story Context | Ground grammar in a natural situation |
| T06 | Method Board | Introduce 3-view thinking method |
| T07 | Grammar Card | Teach 1 pattern · speaker intent + 3 views |
| T08 | Minimal Pair | Separate 2 confusable patterns by 1 axis |
| T09 | Comparison Matrix | 3–4 patterns in 1 decision map |
| T10 | Clue Map | Convert understanding to answer-choice behavior |
| T11 | Worked Example | Full think-aloud solving process |
| T12 | Diagnostic Practice | Test transfer + diagnose error type |
| T13 | Trap Explanation | Why wrong answer feels right |
| T14 | Recap Map | Screenshot-friendly memory map |
| T15 | CTA Diagnostic | Lead to worksheet/quiz |
| T16 | Form Table | Connection rules + common mistake |
| T17 | Example Stack | 3 contexts, 1 shared logic |
| T18 | Section Divider | Chapter break for long video |
| T19 | Common Mistake | "Người Việt hay sai thế này" — branded |
| T20 | Outro | 1 takeaway + next-ep tease + subscribe CTA |
| T21 | JLPT Item Card | 文法形式の判断 dạng đề thực tế |
| T22 | Sentence Assembly | 文の組み立て (★ marker) |
| T23 | Passage Grammar | 文章の文法 (passage + focused blank) |
| T24 | Distractor Analysis | 4 options + trap-type taxonomy |
| T25 | Time Strategy | Section time budget (105 phút) |

## Reuse workflow (cluster mới)

1. **Duplicate** `lucida-n2-slide-templates.html` → `production/00-active/<cluster>/<cluster>-deck.html`
2. **Audit skeleton** — cluster mới cần Master Teaching Skeleton trước (`lessons/templates/01-master-teaching-skeleton-template.md`)
3. **Replace JP content** trong từng `<section>` — giữ class names, `.tmpl-badge`, `.slide-num`, `.brand` nguyên
4. **Map patterns vào color slots** theo speaker-action (xem spec MD §3) — không theo JP alphabet
5. **Rewrite speaker-intent lines** cho T07 — không copy paste Wake
6. **Validate** từng slide theo `../04-slide-framework-qa-checklist.md`
7. **Light mode pass** — print preview qua Tweaks → Print mode để check worksheet variant

## Provenance

- Bundle date: 2026-05-19
- Source: `references/claude-design/project/` (Claude Design hand-off)
- Brand + design system reference: `references/claude-design/project/lucida-brand.html` + `lucida-design-system.html`
- Earlier OD prototype `grammar_card_v2` (vertical-stack variant) archived as historical exploration — current T07 is the canonical Grammar Card.

## Open follow-ups

- Reconcile naming with `../02-slide-template-library.md` (uses semantic IDs like `grammar_card`; gallery uses `T07`). Decide on single ID convention before next cluster build.
- Port `grammar_card_v2` OD-side fixes (`:has()` bonus collapse, `--pattern-shrink`) into T07 if Lucida hits the same edge cases at scale.
