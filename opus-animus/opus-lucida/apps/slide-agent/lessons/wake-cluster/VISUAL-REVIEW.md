# Visual Review - wake-cluster

**Verdict:** PASS

**Review date:** 2026-05-13

**Baseline used:** `apps/schema-html-prototype/output/wake-frames/slide-01.png` ... `slide-17.png`

**Reason:** This migration replaces `apps/schema-html-prototype/`, so the relevant pre-migration renderer baseline is the React renderer PNG output. The older files in `production/00-active/wake-cluster/frames/slide-01.png` ... `slide-17.png` are from the prior deck-stage visual system and do not match the schema-first React renderer already accepted for migration work.

## Checks

- Frame count: PASS, 17/17.
- Resolution: PASS, 1920x1080.
- Slide IDs: PASS, `slide-NN-wake-NN.png`.
- Visual review vs React renderer: PASS. Spot-checked slides 01 and 14; layout, copy, hierarchy, accent, labels, and safe-zone behavior match ordinary visual review tolerance.
- Noted tolerance: tiny browser/font rasterization and PNG compression differences are acceptable.

## Production Baseline Note

Before overwriting production frames, `scripts/exportFrames.js` preserves the existing `production/00-active/wake-cluster/frames/*.png` into `apps/slide-agent/lessons/wake-cluster/baseline-frames/` if that backup folder does not already exist.
