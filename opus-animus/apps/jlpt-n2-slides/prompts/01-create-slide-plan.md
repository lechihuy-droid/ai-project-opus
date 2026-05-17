# Prompt 01 — Create slide-plan.json

**Mode:** Claude as Content Planner. OD MCP not used.

**Pre-req:** `lessons/<id>/teaching-skeleton.md` and `lessons/<id>/video-script.md` exist and are reviewed.

---

## Prompt

```
Read lessons/<id>/teaching-skeleton.md and lessons/<id>/video-script.md.

Do not generate HTML yet.

Create lessons/<id>/slide-plan.json for a 12–15 minute YouTube lesson.

Required flow (every lesson):
1.  HookSlide
2.  PainPointSlide (global)
3.  PainPointSlide (local)
4.  StorySlide (Nam)
5.  GrammarMapSlide (the family)
6.  ThreeViewGrammarSlide — grammar point 1
7.  ThreeViewGrammarSlide — grammar point 2
8.  ThreeViewGrammarSlide — grammar point 3
9.  ThreeViewGrammarSlide — grammar point 4
10. ComparisonSlide
11. JLPTClueMapSlide
12. PracticeSlide
13. PracticeSlide
14. RecapSlide
15. CTASlide

For each slide, include:
- slide_id          — kebab-case, unique within deck
- slide_type        — must match templates/n2-master/slide-types.md exactly
- title             — short label for nav / map
- main_message      — one-line learning objective
- on_slide_text     — the actual text that appears on screen (respect char budgets in template-rules.md §5)
- visual_direction  — hint for layout (e.g. "three column, accent on pattern")
- speaker_notes     — long-form Vietnamese narration
- source_section    — section anchor in teaching-skeleton.md
- duration_sec      — integer seconds, sums to 720–900
- layout_constraints— any per-slide deviation (rare; usually empty)

Hard rules:
- Keep on-slide text under the type's char budget (see template-rules.md §5). If you can't, move it to speaker_notes.
- Every slide_id must trace to a section in teaching-skeleton.md.
- Slide_type must be one of the 11 in templates/n2-master/slide-types.md.

After writing, print:
- total slide count
- total duration_sec
- any budget violations (with the slide_id) — should be zero
```

---

## Done when

- `lessons/<id>/slide-plan.json` exists, validates against the 11 slide types
- Total duration in 720–900 sec range
- Zero budget violations
- User approves the plan before Prompt 02 runs
