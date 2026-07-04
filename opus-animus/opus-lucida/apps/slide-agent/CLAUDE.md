# Slide Agent

Read first:

- `../../docs/RD-jlpt-n2-slide-agent.md`
- `../../docs/SD-jlpt-n2-slide-agent.md`
- `../../docs/BD-jlpt-n2-slide-agent.md`

## Locked Contract

- LLM/agent output is typed JSON only: `lesson.json` and `slide-plan.json`.
- Renderer owns HTML/CSS through `templates/*` and `scripts/render.js`.
- JSON does not contain raw HTML.
- No animation/reveal in v1: one logical slide equals one PNG frame and one audio segment.
- Do not write Lucida skeleton/script. Frame export may write only `production/00-active/<lane>/frames/`.

## Commands

```powershell
node scripts/render.js --lane wake-cluster
node scripts/runAgent.js --lane wake-cluster --mode qa
node scripts/exportFrames.js --lane wake-cluster
```

## Migration Status

Phase H and Phase I completed on 2026-05-14:

- Wake render PASS.
- Wake QA PASS.
- Wake frame export PASS, 17/17 frames in `production/00-active/wake-cluster/frames/`.
- Audio prefix sync PASS.
- Reproducibility PASS, byte-identical `final-deck.html`.
- React renderer archived at `../../99-archive/schema-html-prototype-pre-mcp/`.

## Exit Codes

- `1`: template slot drift
- `2`: invalid or missing slide slot
- `3`: banned label detected
- `4`: file I/O or unexpected runtime error
