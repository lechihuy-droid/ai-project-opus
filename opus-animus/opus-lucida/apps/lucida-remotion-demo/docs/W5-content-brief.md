# W5 ContentBrief

`lucida-content-brief/v1` is the canonical semantic input for visual selection. It is local JSON only and is collected through a `content_brief` source; do not derive it by splitting markdown or script text.

Required root fields are `title`, `audience`, `intent`, `beats`, `factualSourceIds`, `visualConstraints`, and `styleMode`. Every beat has a stable `id`, separate `title` and `body`, finite `role`, `actors`, and `factRefs`. `factRefs` must exist in `factualSourceIds`.

Example sources are in `pipeline/fixtures/content-brief/`. A production `visual-flow/v2` definition must declare exactly one local `content_brief` source. `styleMode` must equal `run.styleMode`; auto briefs may forbid styles, but cannot require a package or family because that is an implicit style lock. Locked runs retain actor/reason exclusively in `run.lockedStyle`.

The collector validates the JSON under the project root and emits deterministic `beat-<id>` events. Sanitized and normalized artifacts preserve the original title/body (including Vietnamese and line breaks), role, intent, actors, facts, top-level constraints, and style mode. The mapper creates one narrative scene per ContentBrief beat and writes the semantic inputs plus beat/event IDs to `03-director-selection.json`.

Production `flow:run` requires `--content-brief <file>` and a normalized input with the identical valid `contentBrief`; it fails before render otherwise. Rapid legacy script sources remain supported with `inputMode: "legacy-compatibility"`, a `compatibility.deprecated` marker, and a deprecation warning.

The collector hashes the exact ContentBrief file bytes and rejects realpath/symlink escapes. `assertNormalizedContentBriefBinding` verifies the one-to-one beat event/provenance binding before normalization completes, in the mapper, and in production. Production QA also hashes the copied `content-brief.json`; finalization and publish reject checksum drift.

Focused verification:

```powershell
npm run test:content-brief
npm run validate:visual-contracts
```
