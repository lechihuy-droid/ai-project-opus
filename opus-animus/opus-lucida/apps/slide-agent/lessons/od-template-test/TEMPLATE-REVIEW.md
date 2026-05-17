# Grammar Card v2 Template Review

Date: 2026-05-14  
Template: `grammar_card_v2`  
Decision: PASS_WITH_NOTES

## Scope

This is a new Lucida slide-agent template created from the Open Design artifact:

```text
C:\Users\HUY\AI\open-design\.od\artifacts\lucida-grammar-card-v2\
```

Runtime files:

```text
apps/slide-agent/templates/grammar_card_v2/template.html
apps/slide-agent/templates/grammar_card_v2/slots.json
apps/slide-agent/templates/grammar_card_v2/template.css
```

## Design Rule Checks

- Uses the Grammar Card teaching contract from `production/01-rules/slide-system/02-slide-template-library.md`.
- Uses learner-facing Vietnamese labels: `Ý nghĩa`, `Dạng`, `Cách dùng`.
- Does not use English learner-facing labels.
- Does not use animation or reveal.
- Keeps LLM-facing JSON as typed plain-text slots.
- Renderer owns all HTML/CSS.
- JSON does not contain raw HTML.
- Example and trap are visually separated.
- No-bonus mode renders as a valid static frame.

## Test Variants

1. Realistic content with `bonus_vi`: `slide-01-od-gcv2-01.png`
2. Worst-case content with `bonus_vi`: `slide-02-od-gcv2-02.png`
3. No-bonus content: `slide-03-od-gcv2-03.png`

## Verification

```powershell
node scripts/validateTemplate.js templates/grammar_card_v2
node scripts/validateTemplate.js
node scripts/render.js --lane od-template-test
node scripts/exportFrames.js --lane od-template-test --out lessons/od-template-test/frames
node scripts/qa-layout.js --lane od-template-test
node scripts/qa-bannedlabel.js --lane od-template-test
npm test
```

Results:

```text
Template validation PASS (1)
Template validation PASS (15)
Render PASS
Export PASS, 3 frames
Layout QA PASS, []
Banned-label QA PASS, []
npm test PASS, 4/4
```

`runAgent.js --mode qa` is not used as the final verdict for this OD test lane because `qa-mapping.js` requires a production skeleton at:

```text
production/00-active/od-template-test/01-master-teaching-skeleton.md
```

The project rule says not to write into `production/00-active/<lane>/` except `frames/`, so this template spike does not create a fake active-lane skeleton.

## Notes

- Worst-case content fits and remains readable, but the intent row is dense.
- If this template becomes the default replacement for `grammar_card`, run it against all four Wake grammar-card slides before swapping template IDs in a production lane.

## Milestone Closure - 2026-05-14

Status: PASS.

Visual QA:

- `slide-01-od-gcv2-01.png` renders cleanly with no overlap.
- `slide-03-od-gcv2-03.png` renders cleanly in no-bonus mode; the bonus band collapses as intended.

Validation:

- `node scripts/validateTemplate.js templates/grammar_card_v2`
- `node scripts/render.js --lane od-template-test`
- `node scripts/exportFrames.js --lane od-template-test --out lessons/od-template-test/frames`
- `node scripts/qa-layout.js --lane od-template-test`
- `node scripts/qa-bannedlabel.js --lane od-template-test`
- `npm test`

This closes the OD-to-runtime template spike for `grammar_card_v2`.

## Wake Production Check - 2026-05-14

Status: PASS.

Verified against the four real Wake grammar-card slides using `grammar_card_v2`:

- `wake-v2-06` for `わけではない`
- `wake-v2-07` for `わけにはいかない`
- `wake-v2-08` for `わけだ`
- `wake-v2-09` for `わけがない`

Result:

- Render/export/QA passed.
- Visual frames are clean with no overlap.
- The template holds on the production-like long-form speaker-action and no-bonus edge cases.
