# Lucida Slide Agent

Static slide renderer for Lucida JLPT N2 decks.

## Commands

```powershell
npm install
node scripts/render.js --lane wake-cluster
node scripts/runAgent.js --lane wake-cluster --mode qa
node scripts/exportFrames.js --lane wake-cluster
npm test
```

## Modes

- Mode 0/1: prompt-driven Claude work emits `lessons/<lane>/lesson.json` and `slide-plan.json`.
- Mode 2: `render.js` turns `slide-plan.json` plus templates into `final-deck.html`.
- Mode 3: QA scripts emit findings and `runAgent.js --mode qa` writes `qa-report.md`.
- Mode 4: fix remains slide-plan/template patching only, followed by deterministic re-render.

Lucida source content under `production/00-active/<lane>/` is read-only. The only allowed write there is `frames/` from `exportFrames.js`.
