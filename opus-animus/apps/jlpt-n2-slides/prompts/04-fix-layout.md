# Prompt 04 — Apply fixes from qa-report.md

**Mode:** OD MCP as **Layout Fixer**.

**Pre-req:** `lessons/<id>/qa-report.md` exists with an exact-fix list. Critical issues addressed first.

---

## Prompt

```
Use Open Design MCP to revise lessons/<id>/final-deck.html.

Input:
- lessons/<id>/final-deck.html
- lessons/<id>/qa-report.md  (the only source of truth for what changes)
- template-rules.md
- brand-tokens.json

Apply ONLY the fixes listed in qa-report.md §"Exact fix list".

Hard rules:
- Do not redesign the deck.
- Do not change the color system or tokens.
- Do not change typography unless qa-report flagged it for readability.
- Do not change slide order or slide_ids.
- Do not add or remove slides.
- Reduce text density where qa-report flagged overflow → move overflow text to <aside class="notes">.
- Fix layout / hierarchy / spacing only as listed.
- Preserve all data-slide-id and data-duration attributes.

Workflow:
1. get_artifact() the deck to load full context.
2. For each item in qa-report's exact-fix list:
   - get_file or search_files to locate the affected node
   - Edit in-place
   - Note which slide_id was touched
3. Re-validate: char budgets, slot completeness, interactivity intact.

After writing, print:
- list of changed slide_ids
- which qa-report items were applied (and which were skipped, with reason)
- new char-budget check (must remain zero violations)
- a one-line diff summary per changed slide
```

---

## Done when

- Every "critical" fix from `qa-report.md` is applied
- Char-budget violations remain at zero
- Slide order / count / ids unchanged
- Deck still opens cleanly in browser
- Loop back to Prompt 03 for a second pass if score < 9/10
