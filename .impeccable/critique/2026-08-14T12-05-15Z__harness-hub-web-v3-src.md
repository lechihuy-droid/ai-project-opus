---
target: critique giao dien tung man hinh cua app harness
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-08-14T12-05-15Z
slug: harness-hub-web-v3-src
---
# Re-Critique — harness hub v3 (run visual world)

## Method: dual-agent (A: haiku design review · B: haiku detect.mjs rerun by parent)

Assessment A (DeepSeek-V4-Flash) ran from source; Assessment B (haiku) wandered into detector regex internals and did not return structured findings, so the parent reran `detect.mjs --json` directly. **A had 2 stale findings (border-claude running @ RunSpine:13, bg-[#181B21] @ ArtifactRail:12) that code-verification showed were already remediated in a prior wave — A read DESIGN.md §5.1 audit-log rows as live code. Both removed from synthesis.** Remaining A findings were cross-checked against source and confirmed. Detector returned `[]` exit 0 on full-tree and shape/polish subset — but the detector's CSS rules (glow/font) do not scan `.tsx` files, so `[]` covers only its scoped rules, not all motion/contrast reality.

## Heuristic Scores

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Pulse disc + Status label + vgov badge + 1s poll; minor: 1000ms poll lag between ticks, pending node labeled "paused" |
| 2 | Match System / Real World | 3 | Provider names, run_id, node IDs domain-native; status vocab fragments across layers (paused/ready vs done/SUCCEEDED) |
| 3 | User Control and Freedom | 3 | Gate approve/reject clean two-button exit; no cancel/abort on a running run, no back from a reopened run |
| 4 | Consistency and Standards | 3 | Token discipline good (bg-surface, border-accent, space-*); GateCard uses raw `border-[var(--hub-warning)]` vs token class; motion gating inconsistent (node-pulse gated, animate-pulse not) |
| 5 | Error Prevention | 3 | vgov disables Run until input+businessKey set; RunsPage free-form objective; no retry affordance (recovery, not prevention) |
| 6 | Recognition Rather Than Recall | 3 | Rails, discs, RunStatusBadge marks recognizable; StateView forces recall of IR model (current_node/node_index/completed_nodes) |
| 7 | Flexibility and Efficiency | 2 | Tabs primitive has full roving keyboard; no launch shortcut, no batch re-run, thinking toggle is a lone ghost button |
| 8 | Aesthetic and Minimalist Design | 3 | Clean 4-tier surface stack, tight 32px controls, restrained cyan; marred by StateView raw-JSON dump |
| 9 | Error Recovery | 2 | Alerts with dismiss + inline node.error present; no suggested next step, no retry/regenerate, failed run leaves spine dead |
| 10 | Help and Documentation | 2 | title tooltips + aria-labels thoughtful; gate interrupt ships with no consequence explanation, no state-meaning help |
| **Total** | | **27/40** | **Acceptable (top of band)** |

## Design Specificity Verdict

The run visual world is authored for THIS harness, not category-interchangeable. Two distinct idioms are genuine design decisions: the **provider-as-rail ladder** (ProviderRail 3px colored bar + 18px state disc on the horizontal-vertical spine, multi-node full resolution) and the **condensed vgov single-gauge** (neutral rail + one RunStatusBadge) — matching the multi-provider orchestration vs governed single-shot mental models. Provider identity (claude #D97757 / codex #A78BFA / nvidia #76B900) lives ONLY on rails/dots, never as action color — disciplined. The specificity weakens only in status grammar (three overlapping vocabularies across layers) and one raw-IR dump (StateView). The rail idiom is specific; the status grammar is not unified, though much of it is layer-internal and not user-facing.

## Overall Impression

Wave shape+polish delivered a coherent run visual world. The provider-rail metaphor is product-native and the condensed vgov gauge is a disciplined counterpoint. Biggest remaining opportunity: the status grammar is layered but not unified at the consumer-visible label layer, and two small motion/a11y gaps (reduced-motion gating, paused-for-pending) sit below the detector's floor.

## What's Working

1. **Provider-as-rail ladder is product-native** — a 3px colored rail per node encodes provider identity spatially along the run timeline; authored for a multi-provider harness, not a generic dashboard.
2. **RunStatusBadge glyph marks (✓ ! ◆ ○ ?) + label** — color never carries the signal alone, a real accessibility win; shines for the condensed vgov gauge.
3. **Tabs primitive is production-grade** — roving tabindex, Arrow/Home/End with disabled-tab skip, aria-selected, 2px underline; the standard the status system should meet.

## Priority Issues

- **[P2] Tailwind `animate-pulse` cursor not gated by prefers-reduced-motion** — `RunSpine.tsx:13` running-output cursor and `OverviewPage.tsx:19` skeleton use Tailwind `animate-pulse`, but `index.css` only gates `.node-pulse` (line 223). Users with reduced-motion still see pulsing. Detector clean ([]) misses it — Tailwind utility is out of CSS-rule scope. **Fix:** add `@media (prefers-reduced-motion: reduce){ .animate-pulse{ animation: none; } }` (or replace animate-pulse with the gated .node-pulse). **Suggested:** /impeccable adapt.
- **[P2] Pending node renders as Status "paused"** — `RunSpine.tsx:13` maps the else-branch (pending) to `Status kind="paused"`. Paused implies it-ran-then-stopped; pending means not-started. Confusing visible label. **Fix:** add a `'pending'` StatusKind (bg-muted, label "pending") or map pending to a neutral kind. **Suggested:** /impeccable clarify.
- **[P3] StateView is a raw-IR dump** — `ArtifactRail.tsx:14` renders current_node/node_index/completed_nodes as mono strings plus raw-JSON toggle, forcing recall of the IR model. **Fix:** render completed nodes as chips aligned to the spine's node names; deepen or drop the JSON toggle. **Suggested:** /impeccable distill.
- **[P3] GateCard has no consequence hint** — `GateCard.tsx` Approve/Reject are bare verb labels with no "Reject stops the run / Approve continues" framing; the highest-stakes decision ships without consequence. **Fix:** one-line subtext under each button (i18n keys gate.approveHint / gate.rejectHint). **Suggested:** /impeccable onboard.
- **[P3] GateCard & title-size token inconsistency (minors)** — `GateCard.tsx` uses raw `border-[var(--hub-warning)] bg-[var(--hub-warning-subtle)]` instead of `border-warning bg-warning-subtle` token classes; `RunSpine.tsx:12` uses `text-[length:var(--hub-title-size)]` vs `text-title` used elsewhere. **Fix:** adopt token classes. **Suggested:** /impeccable polish.

## Persona Red Flags

**Alex (Power User):** Launch flow is select→type→pick→click with no keyboard shortcut to the primary Run button; no abort/cancel on a running run (can't bail a runaway job); recent runs are one-at-a-time rows with no batch re-run. StateView requires decoding raw mono strings to know what's done. Third re-launch tests patience.

**Sam (Accessibility-Dependent):** ProviderRail, spine disc, and the gate diamond are `aria-hidden="true"` with `title` only — provider identity and node state reach a screen reader only via the tiny Status label. RunStatusBadge glyph marks (✓ ! ◆ ○ ?) may read as punctuation. The visible-but-real gap: `animate-pulse` output cursor is not gated by prefers-reduced-motion (node-pulse is). Contrast otherwise strong.

## Minor Observations

- `VgovRunPage.tsx:7` defines `terminal` locally; the runStatusKind mapping is a third place state→kind is translated.
- Spine `opacity-45` on pending nodes dims the provider rail too — queued work loses identity.
- RunStatusBadge "queued"=○ and "interrupted"=◆ use two different geometric metaphors for "not running."

## Provocative Questions

1. What if the running node were the single "now" anchor — a persistent elapsed ticker at the active node — so the operator never hunts for which node is live?
2. If a gate fires, should the rail turn amber along its whole length (not just the diamond) so the interrupt is unmistakable across both the hub ladder and the vgov gauge?
3. Could RunStatusBadge's kinds subsume the spine's disc colors so "done" is one word everywhere — and what's the cost of unifying across layers where enums are genuinely different domains?
