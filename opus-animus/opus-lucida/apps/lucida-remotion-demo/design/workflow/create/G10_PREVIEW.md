# G10 — Preview and Validation

**Verb:** Validate

## Input
- validated `VideoSpec`
- renderer and quality policies

## Worker
Remotion proxy renderer, deterministic validators, optional GPT quality critic after hard checks pass. Codex may repair implementation defects in a separate scoped task.

## Transform
- render static contact sheet and low-resolution motion proxy
- run layout, timeline, caption, audio, motion, accessibility, and determinism checks
- produce actionable issue records linked to owning artifacts/gates

## Output
- `PreviewBundle`
- `IssueReport`
- optional `ApprovalRecord`

## Verify
- no overflow/safe-area violations
- caption reading and sync tolerances pass
- visual beats fire on valid cues
- audio, scene, and total duration agree
- motion intensity and reduced-motion policies pass
- repeated render samples are deterministic

## Failure routing
Issues return to the smallest owning gate. Human approval is required before G11 unless unattended rendering is explicitly authorized.