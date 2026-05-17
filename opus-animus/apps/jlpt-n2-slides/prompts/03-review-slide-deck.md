# Prompt 03 — Review deck → qa-report.md

**Mode:** Claude as Reviewer. OD MCP read-only (`get_artifact`, `get_file`, `search_files`).

**Pre-req:** `lessons/<id>/final-deck.html` exists.

---

## Prompt

```
Review lessons/<id>/final-deck.html.

Act as three reviewers in sequence:
1. HTML slide layout QA reviewer
2. Japanese grammar pedagogy reviewer
3. YouTube education strategist

Use OD MCP to load the deck:
- get_artifact(entry="lessons/<id>/final-deck.html", include="auto")
- search_files for any specific class/pattern you need to verify
- get_file for targeted re-reads

Check:
A. Plan fidelity
   - Does the deck follow slide-plan.json exactly (order, count, ids)?
   - Does every slide map back to a section in teaching-skeleton.md?

B. Layout / structure
   - Is any slide likely to overflow (char count vs budget in template-rules.md §5)?
   - Is visual hierarchy strong on every slide (one accent max, clear H1→body flow)?
   - Are data-slide-id and data-duration present and correct on every <section>?

C. Pedagogy
   - Are the 4 grammar points clearly separated and distinguishable?
   - Are example sentences natural Japanese (not textbook-stiff)?
   - Are Vietnamese explanations clear and concise?
   - Is any slide too dense or too sparse?
   - Are ComparisonSlide pairings genuinely useful (real confusion, not invented)?

D. Speaker notes
   - Is every <aside class="notes"> populated with useful narration?
   - Do notes complement (not duplicate) on-slide text?

E. Practice
   - Does PracticeSlide reveal work? Correct answer index matches the explanation?

Write lessons/<id>/qa-report.md with:
1. Overall verdict: Pass / Pass with revisions / Fail
2. Critical issues — block publish (e.g. overflow, wrong answer, broken interactivity)
3. Major issues — should fix before publish
4. Minor issues — nice-to-have
5. Exact fix list — slide_id + change needed (this drives Prompt 04)
6. Final publish readiness score /10

Do not modify the deck. Only write qa-report.md.
```

---

## Done when

- `lessons/<id>/qa-report.md` exists with verdict + scored exact-fix list
- Critical issues count is zero → ready for Prompt 04
- Score ≥ 8/10 considered publishable after Prompt 04 pass
