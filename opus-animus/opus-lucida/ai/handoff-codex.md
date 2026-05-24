# HANDOFF - opus-lucida (Codex)
**Updated:** 2026-05-13
**Owner:** Codex
**Active task:** JLPT N2 Slide Agent implemented; next is video assembly from migrated Wake frames

## Step 0 Sign-off - JLPT N2 Slide Agent

**Status: APPROVED FOR BUILD v0.3/v0.1**

Codex read, in order:

1. `docs/RD-jlpt-n2-slide-agent.md` - RD v0.3, user-approved
2. `docs/SD-jlpt-n2-slide-agent.md` - SD v0.1
3. `docs/BD-jlpt-n2-slide-agent.md` - BD v0.1

Verdict: APPROVED. The RD/SD/BD are coherent enough to start Phase A with the existing scope controls. No blocking changes are required before code.

Locked decision acknowledgement:

- LLM/agents output typed JSON only: preserve by keeping `lesson.json` and `slide-plan.json` as the only orchestrator-authored content artifacts.
- Renderer owns HTML/CSS: preserve by making Mustache templates and renderer scripts the only layer that emits HTML/CSS.
- JSON does not contain raw HTML: preserve by default escaping, with any no-escape behavior explicitly limited to declared slot types where the template owns the markup contract.
- No animation/reveal in v1: preserve `1 logical slide = 1 PNG frame = 1 audio segment`.
- Lucida skeleton/script are read-only: preserve; only `production/00-active/<lane>/frames/` may be written during export.

Implementation concerns to resolve during Phase 4, not blockers:

- The docs use "Claude orchestrator" language, but SD defines it as prompt-driven files, not an automated Claude API runner. Phase 4 should implement prompts plus local validation/render/export scripts; do not invent an LLM framework.
- Template count/naming needs reconciliation against the existing React app and Lucida library. Port the existing Wake/layout surface 1:1 and do not add new slide types just because SD lists candidate folders.
- Mustache escaping must be explicit in `slots.json`. Default should be escaped text; limited trusted rich text such as JP ruby should use a declared slot type and renderer-owned sanitation/allowlist.
- Banned dictionary parsing should be derived from the active Markdown rule doc at runtime or via a deterministic generated JSON checked by tests. Avoid a manually divergent copy.
- Wake visual review tolerance should be documented in `lessons/wake-cluster/VISUAL-REVIEW.md`: PASS only when meaning, hierarchy, safe zones, labels, frame count, and audio-index contract match baseline; minor font hinting/spacing differences may be noted without failing.

Hard gates to preserve:

- Step 21 FR-MIG-002: Wake 17 PNG post-migration visual review must PASS before Phase I.
- Step 22 NFR-008: existing audio sync must pass with new frames.
- Step 23 NFR-005: same input must produce byte-identical `final-deck.html`.
- Phase H gate failure stops the rollout; do not archive React or update canonical docs as active until Wake gates pass.

Next action: continue existing audio/video pipeline using `production/00-active/wake-cluster/frames/slide-01-wake-01.png` through `slide-17-wake-17.png`.

## Video Pipeline Milestone Update - 2026-05-14

M1 pipeline inspection: DONE.

- Active docs mention HTML recording path, but required scripts (`compute_durations.py`, `screenrecord_slides.py`, `merge_audio.py`) are not present yet.
- Available runnable fallback is `automation/video/assembly_agent.py`, which assembles PNG frames + audio.
- Old assembly logic assumed exact stem match (`slide-01.png` -> `slide-01.mp3`) and failed for new slide-agent names (`slide-01-wake-01.png`).

M2 compatibility patch: DONE.

- `automation/video/assembly_agent.py` now sorts frames by numeric `slide-NN` prefix.
- Audio resolution now accepts `slide-NN.mp3`, `slide-NN.wav`, `rvc-slide-NN.wav`, or `rvc-slide-NN.mp3`.
- SOP docs updated to state `slide-NN*.png` is valid and numeric prefix is the sync contract.

M3 video smoke: PASS.

- Installed missing Python dependency `imageio-ffmpeg`.
- Smoke command reached ffmpeg and correctly resolved `slide-01-wake-01.png` to `audio/slide-01.mp3`.
- Added `--tmp-dir` to `automation/video/assembly_agent.py`.
- Used `D:\lucida-temp` for temp segments and exported to `D:\lucida-output\raw-wake-cluster-slide-agent-test.mp4`.
- Copied verified output to `production/00-active/wake-cluster/video/raw-wake-cluster-slide-agent-test.mp4`.
- Raw TTS audio exists for 17 slides; `audio-rvc/` is currently empty, so this smoke used raw MP3.
- Output probe: duration `00:16:26.24`, H.264 1920x1080 video, AAC mono audio.

Next action:

- Human review `production/00-active/wake-cluster/video/raw-wake-cluster-slide-agent-test.mp4`.
- If accepted, either rename/copy it to `raw-wake-cluster.mp4` or rerun assembly with that final output name.

## Completion Update - 2026-05-14

Slide Agent Phase 4 implementation is complete through Phase I.

Implemented:

- `apps/slide-agent/` Node project with Mustache renderer, JSON Schemas, template validator, QA scripts, Playwright frame export, prompts, tests, and Wake lesson artifacts.
- 14 existing React template IDs ported 1:1 into `apps/slide-agent/templates/<template_id>/`.
- Wake plan normalized into `apps/slide-agent/lessons/wake-cluster/slide-plan.json`.
- `final-deck.html` rendered deterministically.
- Production Wake frames exported to `production/00-active/wake-cluster/frames/`.
- React renderer archived to `99-archive/schema-html-prototype-pre-mcp/` with rollback instructions.
- Canonical docs updated to make slide-agent the active renderer.

Verified:

- `node scripts/validateTemplate.js`: PASS (14 templates)
- `npm test`: PASS (4/4)
- `node scripts/runAgent.js --lane wake-cluster --mode qa`: PASS
- Frame/audio prefix sync: PASS (17 PNG / 17 MP3)
- Reproducibility: PASS, SHA256 `024CD9BB92579D7857580328CF47935BE46334FB98309A77E1EE687BED7DFE66`

---

## Previous Handoff - 2026-05-12

## Done

1. Expanded Wake schema-first artifacts from 5 slides to the full 17-slide deck:
   - `production/00-active/wake-cluster/wake-slide-plan.json`
   - `production/00-active/wake-cluster/wake-typed-deck.json`
   - `apps/schema-html-prototype/src/fixtures/wakeTypedDeck.json`

2. Added missing renderer templates:
   - `quiz_before_after`
   - `grammar_card`
   - `minimal_pair`
   - `clue_map`
   - `worked_example`
   - `diagnostic_practice`
   - `cta_diagnostic`

3. Added schema/catalog/test coverage:
   - extended `LayoutIdSchema` and `SlideRoleSchema`
   - added requiredSlots + slotBudgets for the new templates
   - added React components in `WakeTemplateLayouts.tsx`
   - added CSS for the new deterministic layouts
   - added fixture tests for full Wake deck schema/catalog/slot budget

4. Hardened Wake validation and public labels:
   - Japanese anchor checks for grammar/quiz/minimal-pair/clue/worked/diagnostic templates
   - learner-facing banned phrase lint for internal labels such as `Blank`, `speaker action`, `Decision rule`
   - public 3-view label enforcement: `Ý nghĩa - Dạng - Cách dùng`
   - template-specific checks for quiz/worked-example/diagnostic/CTA slides
   - `displayLabels.ts` maps renderer topbar/kicker/footer labels into Vietnamese
   - slide 02 and slide 14 copy changed from `Blank` / `speaker action` to `Chỗ trống` / `ý người nói`

5. Verified end-to-end:
   - `npm run validate -- src/fixtures/wakeTypedDeck.json`: PASS wake-cluster-v1 (17 slides)
   - `npm test`: PASS, 4 test files, 13 tests
   - `npm run build`: PASS
   - `npm run export:screenshots -- src/fixtures/wakeTypedDeck.json output/wake-frames`: PASS, 17/17
   - `npm run qa -- src/fixtures/wakeTypedDeck.json`: PASS
   - visual spot-check after public-label patch: exported slides 06, 14, 17 look clean, no obvious overflow

6. Applied a first design-rule pass after human feedback:
   - quiz/diagnostic templates now show `Trước khi chốt` / `Sau khi chốt`
   - worked-example template now separates `Đề bài` and `Cách giải`
   - grammar cards now foreground the Japanese pattern and the prompt `Ở câu này, người nói đang muốn nói gì?`
   - semantic accents corrected for Wake grammar points: correction = blue, constraint = green, conclusion = amber, strong denial = red, clue map = violet
   - background moved away from decorative radial blobs toward a quieter exam-console grid
   - slide 14 was compacted after QA caught an out-of-bounds rule strip
   - visual spot-check after pass: slides 02, 06, 14, 15

## Exact next action

1. Human-review exported frames:
   - `apps/schema-html-prototype/output/wake-frames/slide-01.png` ... `slide-17.png`
   - Check teaching fidelity against `production/00-active/wake-cluster/03-slide-deck.md`
   - Check whether any slide needs copy compression or hierarchy tuning before audio lock

2. After human review, decide whether to:
   - keep schema-first React renderer as active production path, or
   - patch specific templates/copy before timed video assembly

3. If frames pass human review, move toward audio-lock / timed video assembly using the current 17 exported PNGs.

## Files touched

- `apps/schema-html-prototype/src/schema/layout.ts`
- `apps/schema-html-prototype/src/layouts/layoutCatalog.ts`
- `apps/schema-html-prototype/src/layouts/components/*.tsx`
- `apps/schema-html-prototype/src/layouts/components/WakeTemplateLayouts.tsx`
- `apps/schema-html-prototype/src/renderer/SlideRenderer.tsx`
- `apps/schema-html-prototype/src/renderer/displayLabels.ts`
- `apps/schema-html-prototype/src/qa/lucidaRules.ts`
- `apps/schema-html-prototype/src/styles/slide.css`
- `apps/schema-html-prototype/tests/schema.test.ts`
- `apps/schema-html-prototype/tests/renderer.test.ts`
- `apps/schema-html-prototype/tests/slotBudget.test.ts`
- `apps/schema-html-prototype/tests/lucidaRules.test.ts`
- `apps/schema-html-prototype/src/fixtures/wakeTypedDeck.json`
- `production/00-active/wake-cluster/wake-slide-plan.json`
- `production/00-active/wake-cluster/wake-typed-deck.json`
- `ai/status.md`
- `ai/handoff-codex.md`

## Risks / check next

- Design rules are still partially compiled beyond the Wake-specific rules; QA does not prove teaching quality.
- The new design pass is closer to the active brief, but still needs human taste review before audio lock.
- Browser plugin Node REPL tool was not exposed in the latest sessions, so in-app Browser verification was not available; fallback was Playwright export + local PNG spot-check.
- Human review needed before audio/video lock.
- No git repo was detected from `opus-lucida` or `opus-animus`, so no git diff/status summary is available.

## Locked decisions

- LLM/agents output typed JSON only
- Renderer owns HTML/CSS
- JSON does not contain raw HTML, arbitrary CSS, or arbitrary absolute positioning
- NotebookLM = optional support layer, not core path
- Do not migrate to CrewAI/LangGraph before the Wake schema-first renderer is accepted after human review

## Validation commands

```powershell
cd apps/schema-html-prototype
npm run validate -- src/fixtures/wakeTypedDeck.json
npm test
npm run build
npm run export:screenshots -- src/fixtures/wakeTypedDeck.json output/wake-frames
npm run qa -- src/fixtures/wakeTypedDeck.json
```

Preview while dev server is running:

```text
http://127.0.0.1:4177/?deck=wake
```

## 2026-05-14 OD template spike checkpoint

Milestone: Open Design input/output for `grammar_card_v2` created.

Status: REVISE before production port.

Artifacts:

- `C:\Users\HUY\AI\opus-animus\opus-lucida\apps\slide-agent\od-briefs\grammar-card-v2-open-design-brief.md`
- `C:\Users\HUY\AI\open-design\.od\artifacts\lucida-grammar-card-v2\artifact.json`
- `C:\Users\HUY\AI\open-design\.od\artifacts\lucida-grammar-card-v2\brief.md`
- `C:\Users\HUY\AI\open-design\.od\artifacts\lucida-grammar-card-v2\mockup.html`
- `C:\Users\HUY\AI\open-design\.od\artifacts\lucida-grammar-card-v2\template.css`
- `C:\Users\HUY\AI\open-design\.od\artifacts\lucida-grammar-card-v2\slot-contract.json`
- `C:\Users\HUY\AI\open-design\.od\artifacts\lucida-grammar-card-v2\template-notes.md`
- `C:\Users\HUY\AI\open-design\.od\artifacts\lucida-grammar-card-v2\preview.png`

Verification:

- Corrected mojibake in Lucida OD brief and OD artifact brief.
- Rendered `mockup.html` to `preview.png` with Edge headless at 1920x1080.
- Fixed first preview overflow where the optional `Ghi nhớ` band fell below the frame.
- Current preview fits realistic content in-frame with no obvious overlap.

Next:

- Run worst-case and no-bonus variants before accepting.
- If accepted after review, port to `apps/slide-agent/templates/grammar_card_v2/`, then validate/render/export `od-template-test`.

## 2026-05-14 grammar_card_v2 runtime checkpoint

Milestone: OD template candidate ported into slide-agent runtime.

Status: PASS_WITH_NOTES.

Runtime files:

- `apps/slide-agent/templates/grammar_card_v2/template.html`
- `apps/slide-agent/templates/grammar_card_v2/slots.json`
- `apps/slide-agent/templates/grammar_card_v2/template.css`
- `apps/slide-agent/lessons/od-template-test/slide-plan.json`
- `apps/slide-agent/lessons/od-template-test/final-deck.html`
- `apps/slide-agent/lessons/od-template-test/frames/slide-01-od-gcv2-01.png`
- `apps/slide-agent/lessons/od-template-test/frames/slide-02-od-gcv2-02.png`
- `apps/slide-agent/lessons/od-template-test/frames/slide-03-od-gcv2-03.png`
- `apps/slide-agent/lessons/od-template-test/TEMPLATE-REVIEW.md`

Verification:

- `node scripts/validateTemplate.js templates/grammar_card_v2`: PASS.
- `node scripts/validateTemplate.js`: PASS, 15 templates.
- `node scripts/render.js --lane od-template-test`: PASS.
- `node scripts/exportFrames.js --lane od-template-test --out lessons/od-template-test/frames`: PASS, 3 frames.
- `node scripts/qa-layout.js --lane od-template-test`: PASS, `[]`.
- `node scripts/qa-bannedlabel.js --lane od-template-test`: PASS, `[]`.
- `npm test`: PASS, 4/4.

Note:

- `node scripts/runAgent.js --lane od-template-test --mode qa` returns BLOCK only because `qa-mapping.js` expects `production/00-active/od-template-test/01-master-teaching-skeleton.md`. This was not created because active-lane writes are out of scope except frames.
- Worst-case content fits, but the speaker-intent row is dense. Keep PASS_WITH_NOTES until reviewed by human or tested against the full Wake grammar-card set.

## 2026-05-14 grammar_card_v2 milestone closure

Status: PASS.

Validated after OD port:

- `node scripts/validateTemplate.js templates/grammar_card_v2`
- `node scripts/render.js --lane od-template-test`
- `node scripts/exportFrames.js --lane od-template-test --out lessons/od-template-test/frames`
- `node scripts/qa-layout.js --lane od-template-test`
- `node scripts/qa-bannedlabel.js --lane od-template-test`
- `npm test`

Visual check:

- `slide-01-od-gcv2-01.png` is clean.
- `slide-03-od-gcv2-03.png` is clean in no-bonus mode.

Next:

- Reuse `grammar_card_v2` as the OD-backed candidate template for future Wake grammar-card replacements.

## 2026-05-14 Wake grammar-card v2 production check

Status: PASS.

Verified the OD-backed `grammar_card_v2` template against the four real Wake grammar-card slides:

- `わけではない`
- `わけにはいかない`
- `わけだ`
- `わけがない`

Render/export/QA passed and visual frames were clean. This is the first evidence that the OD design holds on production-like Wake content, not just the synthetic `od-template-test` lane.

## 2026-05-17 bilingual audio workflow update

Status: PATCHED.

Issue found:

- The first Wake pronunciation adapter converted long Japanese sentences into Vietnamese phonetics.
- This is wrong for production because long JP examples must be read by VOICEVOX JP, not VieNeu.

Fix:

- `automation/audio/generate_vieneu_from_script.py` now separates `wake_vi` / `wake_vi_terms` from legacy `wake_vi_all`.
- `wake_vi` is terms-only and boundary-protected: short labels like `わけ` can become `quà kê`, but Japanese sentences such as `行きたくないわけじゃないんだけど、` stay Japanese.
- `wake_vi_all` remains only as legacy/debug and must not be used for final audio.

Workflow docs updated:

- `automation/workflows/20-lesson-production-sop.md`: script generation now preserves bilingual audio lanes.
- `automation/workflows/34-runner-production.md`: TTS/Pause and Audio Generation runners now require VieNeu/VOICEVOX split.
- `automation/workflows/38-audio-generation-sop.md`: active audio contract is now script adapter -> bilingual TTS -> optional RVC -> assembly.

Next:

- Build or wire the bilingual dispatcher so each slide is segmented into `voice_vi` and `voice_ja`, generated by VieNeu and VOICEVOX respectively, then concatenated per slide.

## 2026-05-19 Wake pattern-reading audio handoff

Status: STOPPED / NEEDS ARCHITECTURE DECISION.

Context:

- The Wake `わけ` family pattern-reading work added a `json_rules` path to `automation/audio/generate_vieneu_from_script.py`.
- The adapter now supports `--audit-patterns`, writes `pattern_audit.json` / `pattern_audit.md`, and uses `automation/audio/lucida_jp_reading_patterns.json`.
- `lucida_jp_reading_patterns.json` contains classification/gloss config and `reading_overrides` for Wake grammar targets.
- Obvious override fixes were added:
  - `わけではない` -> `quà kê đê qua nai`
  - `わけにはいかない` -> `quà kê ni qua i ca nai`
  - `わけがない` -> `quà kê ga nai`
  - `わけだ` -> `quà kê đa`
  - `わけです` -> `quà kê đês`
- Review artifacts were created:
  - `production/00-active/wake-cluster/audio/pattern-rule-review.html`
  - `production/00-active/wake-cluster/audio/wake-pattern-reading-list.md`
  - `production/00-active/wake-cluster/audio/wake-pattern-reading-list-short.md`
  - `production/00-active/wake-cluster/audio/wake-pattern-reading-audio/slide-01.wav`
  - `production/00-active/wake-cluster/audio/wake-pattern-reading-audio-short/slide-01.wav`

Decision:

- User reviewed the VieNeu phonetic samples and explicitly said: "đọc dở quá".
- Stop the phonetic-tuning loop. Do not continue polishing `quà kê...` readings unless explicitly requested.
- The issue is architectural, not only JSON quality: VieNeu reading Japanese grammar targets via Vietnamese phonetic strings does not sound production-grade.

Current working assumption:

- Grammar targets should likely be read by a Japanese voice lane, not by VieNeu fake-Japanese phonetics.
- `voice_vi` should handle Vietnamese explanation/gloss.
- `voice_ja` should handle Japanese grammar target and full Japanese examples.
- Then concatenate per slide.

Next recommended milestone:

1. Design a small bilingual dispatcher prototype.
2. Input: `production/00-active/wake-cluster/02-script.md`.
3. Output per slide:
   - `segments.json`
   - `voice_vi/*.wav`
   - `voice_ja/*.wav`
   - `slide-NN.wav`
4. Test only 5 Wake targets first:
   - `わけだ`
   - `わけではない`
   - `わけがない`
   - `わけにはいかない`
   - `Vないわけにはいかない`
5. Try segment pattern:
   - `voice_vi`: "mẫu"
   - `voice_ja`: `わけではない`
   - `voice_vi`: "nghĩa là không phải là..."

Operational notes:

- VieNeu venv: `C:\Users\HUY\AI\VieNeu-TTS\.venv\Scripts\python.exe`
- Use `$env:HF_HUB_OFFLINE='1'` when model is cached to avoid Hugging Face/proxy stalls.
- Use `$env:PYTHONIOENCODING='utf-8'` for Unicode console output.
- `pykakasi` was installed into the VieNeu venv.
- VieNeu selected voice during tests: `Bích Ngọc (Nữ - Miền Bắc)`.
