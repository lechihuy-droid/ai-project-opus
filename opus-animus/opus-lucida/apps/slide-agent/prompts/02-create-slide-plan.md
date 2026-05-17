# Mode 1B - Create slide-plan.json

Map `lesson.json` to slides using only template IDs already present in `apps/slide-agent/templates/`.

Output path: `apps/slide-agent/lessons/<lane>/slide-plan.json`.

Required per slide: `slide_id`, `phase`, `template_id`, `slots`, `source_section`, `duration_sec`.

Pass condition: `node scripts/render.js --lane <lane>` exits 0 and no banned labels appear.
