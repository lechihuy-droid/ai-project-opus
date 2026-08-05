# Remotion RAG Operating Model - Technical Appendix

- **Date:** 2026-07-16 JST
- **Case study:** `ai-weekly-gpt-5-6-2026-07-16`
- **Decision:** Keep two official lanes: Production and Rapid Visual Pilot
- **Production baseline:** `design/workflow/FLOW_V1.md`
- **Pilot status:** technical PASS; publish readiness NO-GO

## A. Executive decision

The pilot proves the local evidence pipeline can collect, sanitize, compile, build SQLite, retrieve approved references, map scenes, validate a `VideoMap`, render MP4, and retain an auditable trace. It does not prove production readiness.

Three facts drive the decision:

1. RAG matched `5/5` events, but all five scenes resolved to terminal.
2. Fifteen evidence links reduced to only three unique, generic terminal chunks.
3. The rendered AAC stream measured approximately `-91 dB`, effectively silence.

The operating model therefore keeps two explicit lanes. Production retains the S0-S6 contract and publish gates. Rapid Visual Pilot optimizes style exploration, but cannot be labeled publish-ready until promoted through the production gates.

## B. Source-of-truth hierarchy

| Level | Source | Role | Comparison use |
|---|---|---|---|
| North star | `../../../../10-project-architecture-map.md` | Project-wide lesson and publishing architecture | Governing principles only |
| Project governance | `../../../../11-current-operating-flow.md` | Current Lucida flow summary and downward links | Context and ownership |
| Production baseline | `../workflow/FLOW_V1.md` | Approved Remotion S0-S6 operating flow | Primary baseline |
| RAG control | `../workflow/RAG_INGEST_AND_RETRIEVAL.md` | S1 ingest, approval, projection and S3 retrieval | RAG-specific control |
| Pilot evidence | `AI_WEEKLY_GPT_5_6_RAG_FLOW_REPORT_2026-07-16.md` | Actual commands, artifacts, metrics and defects | As-is evidence |
| Roadmap | `../workflow/create/G00-G12` | North-star gate specifications | Not an operating baseline |

Interpretation rule: compare the pilot against `FLOW_V1`; use the architecture map to check principles; use the RAG document to audit evidence handling. Do not score current execution against G00-G12 as though all gates were implemented.

## C. Baseline and actual flow

### C1. Production baseline

```text
S0 Topic, research, script, approval
S0.5 Visual treatment, actors, beats, component check, approval
S1 Ingest approved script, factual sources and visual evidence
S2 TTS, voice, alignment and TimedScript
S3 Build-time RAG, mapping, validation and map approval
S4 Build and render with audio and timed captions
S5 Automated and human QA, final approval
S6 Publish handoff; external upload remains manual
```

### C2. Pilot flow actually run

```text
Local news script
  -> collect and normalize
  -> sanitize
  -> compile canonical knowledge
  -> build SQLite FTS5 projection
  -> retrieve style evidence
  -> map five terminal scenes
  -> validate generated VideoMap
  -> still QA and fixes
  -> generated render
  -> MP4 frame, stream, loudness and checksum QA
```

This is a visual-flow utility path. It bypasses or only partially represents several production stages.

## D. Stage-by-stage comparison

| Stage | Baseline requirement | Pilot evidence | Status | Consequence |
|---|---|---|---|---|
| S0 | Research, script, user approval, freeze | Local script; official source used in report; no recorded approval artifact | Partial | Content decision not auditable |
| S0.5 | Treatment, actors, beats, component check, user approval | No treatment artifact | Missing | No explicit visual intent before retrieval |
| S1 | Approved script plus factual and visual sources; visual sources promoted | Script normalized; approved visual corpus queried; factual source not part of ingest trace | Partial | Style provenance exists; factual provenance remains outside lane |
| S2 | TTS, voice and TimedScript as locked timeline | No TTS or TimedScript | Missing | Silent audio and estimated scene timing |
| S3 | RAG before mapper; map validation; user approval | Retrieval and validation pass; `family: terminal` preselected; no approval artifact | Partial | Retrieval confirms a prior choice |
| S4 | Approved map, voice and TimedScript; render audio and word captions | Generated renderer produced MP4; audio is silent | Partial | Technical render is not a usable video |
| S5 | Automated QA, routing and user final approval | Still and MP4 frame QA performed; no formal final gate | Partial | Publish decision lacks acceptance record |
| S6 | Publish bundle and manual upload checklist | Not run | Missing | No distributable handoff |

## E. Pilot artifact inventory

Run root: `pipeline/runs/ai-weekly-gpt-5-6-2026-07-16/`

| Artifact | Purpose | Audit interpretation |
|---|---|---|
| `01-raw-input.json` | Collector output | Untrusted input |
| `02-sanitized-input.json` | Normalized, scrubbed events | Safe to review; not canonical approval |
| `03-knowledge-selection.json` | Queries, result IDs, scores, provenance and manifest hash | Primary retrieval trace |
| `04-visual-scenes.json` | Selected family, preset and evidence IDs | Director/mapping decision |
| `05-video-map.json` | Renderer contract | Runtime input; DB-independent |
| `qa/frame-*-v2.png` | Sampled visual evidence | Final still inspection set |
| `output/video.mp4` | H.264/AAC output | Technical PASS; publish NO-GO |

Measured output:

- Duration: `20.053333s`
- Video: H.264, `1080x1920`, `30 fps`
- Audio: AAC, mean/max approximately `-91 dB`
- Size: `6,609,745 bytes`
- SHA-256: `7b4a866ff8bf27dc0e4883e177bb32cb197f4d3b8a58ae0f9c90a5f34c08da82`
- Render mode: `concurrency=1`
- Wall time: approximately `11m 27s`

## F. Command trace

Primary commands represented by the pilot and current package contracts:

```powershell
npm run collect:visual
npm run process:visual
npm run knowledge:compile
npm run knowledge:build
npm run map:visual
npm run validate:generated-map
npm run qa:stills
npm run render:generated
```

Production commands that were not completed as one controlled path:

```powershell
npm run flow:run
npm run voice:generate
npm run voice:align
npm run map:apply-timing
npm run validate:brand
npm run validate:semantic
npm run publish:handoff
```

## G. RAG evidence quality audit

| Control | Result | Assessment |
|---|---|---|
| Approved-only retrieval | Pass | Retrieval trace references canonical approved evidence |
| Projection integrity | Pass | SQLite integrity, foreign keys and FTS5 passed |
| Query coverage | Pass | Five queries; five matched events |
| Provenance | Pass | Fifteen evidence links and manifest hash recorded |
| Source diversity | Fail | Only three unique evidence chunks |
| Family diversity | Fail | Terminal selected for all five scenes |
| Selection independence | Fail | Input metadata requested terminal before retrieval |
| Semantic fit | Partial | Query includes text, family and tags; no explicit intent/beat/audience model |

RAG functioned as a provenance-backed lookup. It did not function as a broad style recommender in this pilot.

## H. Root-cause tree

### H1. Governance

- Multiple documents describe current state at different dates.
- `11-current-operating-flow.md` still says Remotion has no audio while `FLOW_V1` milestones record audio E2E complete.
- `FLOW_V1` stage headings retain older “not built” labels while milestone rows record completion.
- Production and visual pilot owners are not separately declared.

### H2. Orchestration

- `flow:run` and `visual-flow` are independent entrypoints.
- Pilot artifacts do not carry a formal lane or promotion state.
- User gates are described in documents but absent from pilot run records.

### H3. Data contract

- Collector normalization collapses line structure.
- Input lacks explicit `intent`, `beatRole`, `actors`, `audience` and `visualConstraints`.
- Family metadata can predetermine the retrieval result.

### H4. Knowledge and selection

- Approved corpus is MVP-sized and terminal-heavy.
- Retrieval is primarily lexical and metadata-assisted.
- No candidate diversification or repeated-layout penalty exists in the pilot trace.

### H5. QA

- Overflow was found after still generation rather than at contract validation.
- Audio presence was insufficient; loudness exposed effective silence later.
- No one-active-render workspace lock was recorded.
- Final human approval was not captured as an immutable artifact.

## I. Target operating model

### I1. Production Lane

Purpose: publishable output.

Required stages: S0-S6 without omission. Required gates:

1. Script and treatment approved.
2. `VideoMap` and selection trace approved.
3. Final video approved after automated QA.

Required artifacts: approved script, treatment, factual-source manifest, clean brief, voice file, TimedScript, knowledge selection, VideoMap, QA report and publish handoff.

### I2. Rapid Visual Pilot Lane

Purpose: test content-to-style mapping, components and visual direction quickly.

```text
ContentBrief
  -> approved visual RAG
  -> candidate ranking and SelectionTrace
  -> VideoMap
  -> contract validation
  -> still QA
  -> optional preview render
```

Default status: `non_publishable`. TTS, final captions and publish handoff may be omitted only while this status is present.

### I3. Promotion gate

A pilot may enter Production Lane only when all conditions pass:

- script approval exists;
- factual sources are recorded and reviewed;
- visual treatment or accepted pilot selection exists;
- selected components exist in registry;
- voice and TimedScript exist;
- selection and mapping trace is reproducible;
- semantic, layout, audio and provenance QA pass;
- responsible user approves promotion.

Promotion does not copy generated runtime state blindly. Production rebuilds from approved artifacts and records the new run ID.

## J. Proposed contracts

### J1. `ContentBrief`

```json
{
  "schemaVersion": "1.0",
  "lane": "rapid-visual-pilot",
  "runId": "ai-weekly-gpt-5-6-2026-07-16",
  "title": "GPT-5.6 weekly update",
  "audience": ["AI builders", "technical leaders"],
  "intent": "explain-release-significance",
  "beats": [
    {
      "id": "beat-01",
      "role": "hook",
      "title": "A new model family",
      "body": "Sol, Terra and Luna target different workloads.",
      "actors": ["GPT-5.6 tiers"],
      "facts": ["fact-01"],
      "visualConstraints": ["vertical", "mobile-readable"]
    }
  ],
  "factualSources": ["source-openai-gpt-5-6"],
  "styleMode": "auto"
}
```

Validation rules:

- `lane` is `production` or `rapid-visual-pilot`.
- `styleMode` is `auto` or `locked`.
- `locked` requires `lockedBy`, `lockReason` and an allowlisted family.
- Every factual statement references at least one source ID.
- Beat title and body remain separate; normalization must not collapse line structure.

### J2. `StyleCandidate`

```json
{
  "family": "editorial",
  "preset": "news-analysis",
  "score": 0.84,
  "evidenceIds": ["ref-editorial-01", "ref-dashboard-02"],
  "componentAvailability": 1,
  "penalties": {"recentLayoutRepeat": 0.12},
  "reasons": ["news beat", "comparison structure", "mobile legibility"]
}
```

### J3. `SelectionTrace`

```json
{
  "schemaVersion": "1.0",
  "styleMode": "auto",
  "query": {"intent": "explain-release-significance", "beatRole": "hook"},
  "candidates": [],
  "selected": {"family": "editorial", "preset": "news-analysis"},
  "fallbackUsed": false,
  "manifestHash": "sha256:...",
  "approvedBy": null
}
```

Selection order in `auto` mode:

1. Retrieve approved candidates from intent, beat role, audience and constraints.
2. Reject unavailable components and rights-ineligible evidence.
3. Apply semantic fit, evidence quality and legibility scores.
4. Apply repetition and family-concentration penalties.
5. Select best candidate or deterministic fallback.

Selection order in `locked` mode: validate lock, record who and why, then retrieve evidence inside the locked family. The report must label this as evidence support, not independent style selection.

## K. QA and promotion checklist

### K1. Automated pre-render

- JSON schemas valid.
- Source manifest complete; approved evidence only.
- SQLite projection manifest matches canonical manifest.
- Every scene references available family, preset and components.
- No unsupported text length or bounding-box overflow.
- No more than two consecutive scenes share the same layout.
- Production Lane has voice, TimedScript and non-zero audio duration.
- Render lock confirms one active Remotion render per workspace.

### K2. Automated post-render

- Expected resolution, fps, duration and codecs.
- Audio loudness exceeds silence threshold and has no clipping.
- Caption timing remains inside scene and audio bounds.
- Sampled frames contain no overflow, duplicate headline or subtitle collision.
- Output checksum and render report recorded.

### K3. Human gates

- Gate 1: script and treatment approved.
- Gate 2: map, style evidence and visible promise accepted.
- Gate 3: final video accepted for handoff.

## L. Acceptance tests

1. **Auto-selection independence:** input without family lock yields at least two plausible candidate families and records ranking reasons.
2. **Locked-mode audit:** locked terminal family remains terminal and records actor plus reason; trace does not claim RAG selected the family.
3. **Anti-monotony:** five heterogeneous beats cannot use one layout more than twice consecutively unless only one compatible component exists and fallback reason is recorded.
4. **Corpus breadth:** editorial, dashboard, data, product and cinematic fixtures each retrieve approved evidence.
5. **No-match behavior:** zero lexical/semantic match triggers deterministic fallback without fabricated evidence.
6. **Stale projection:** manifest mismatch fails before mapping.
7. **Renderer isolation:** deleting SQLite after mapping does not prevent render from `VideoMap`.
8. **Audio gate:** effective silence blocks Production Lane handoff.
9. **Promotion:** Rapid Visual Pilot cannot call `publish:handoff` without all promotion artifacts.
10. **Approval audit:** every user gate produces immutable approver, timestamp, artifact hash and decision.

## M. Action roadmap and ownership

| Horizon | Action | Accountable owner | Dependency | Success measure |
|---|---|---|---|---|
| 0-2 weeks | Declare Production and Rapid Visual Pilot lanes in canonical workflow docs | Lucida workflow owner | User decision | No ambiguous production entrypoint |
| 0-2 weeks | Add `lane`, `styleMode` and approval state to run metadata | Pipeline owner | Schema update | 100% new runs classified |
| 0-2 weeks | Remove implicit terminal lock; require explicit locked mode | Mapping owner | Compatibility adapter | Auto runs do not inherit terminal |
| 0-2 weeks | Add silence, overflow and render-lock gates | QA owner | ffmpeg and still QA | Silent output blocked before handoff |
| 2-6 weeks | Introduce `ContentBrief`, `StyleCandidate` and `SelectionTrace` | Mapping owner | Schema and mapper work | Every scene has auditable candidates |
| 2-6 weeks | Separate factual-source evidence from visual-style evidence | RAG corpus owner | Corpus namespaces | 100% facts and visuals trace independently |
| 2-6 weeks | Add semantic retrieval and diversity penalties | RAG/mapping owner | Evaluation set | Lower override and repetition rates |
| 6-12 weeks | Promote editorial, dashboard, data, product and cinematic references | RAG corpus owner | Human rights review | Five usable approved families |
| 6-12 weeks | Build archetype E2E suite and operating dashboard | QA owner | Stable contracts | KPI scorecard updated per release |

## N. KPI definitions

| KPI | Definition | Target |
|---|---|---|
| RAG evidence coverage | Mapped beats with at least one approved evidence record | `>=95%` |
| Provenance completeness | Production facts and visual decisions with complete source trace | `100%` |
| Auto-style override rate | Auto selections manually replaced at Gate 2 | `<20%` |
| Layout repetition | Maximum consecutive scenes using one layout | `<=2` |
| Audio/caption pass | Production renders passing loudness and timing gates | `100%` |
| First-pass still QA | Runs with no visual defects on first sampled still set | `>=90%` |
| Publish readiness | Production runs passing all gates before handoff | `>=95%` |

## O. Documentation contradiction log

| Document statement | Conflicting evidence | Required correction |
|---|---|---|
| `11-current-operating-flow.md` says Remotion output has no audio pipeline | `FLOW_V1` M3 records audio E2E PASS | Mark section as historical and point to current stage status |
| `FLOW_V1` S0 and S2 headings retain “not built” labels | M2 and M3 milestone rows record completion | Replace heading status with current implementation state |
| `FLOW_V1` describes one production flow while package exposes `visual-flow` | Pilot ran the separate utility path | Document two official lane boundaries and promotion gate |
| RAG priority allows source-specified family first | Pilot supplied terminal and all results stayed terminal | Split `auto` and `locked`; label locked retrieval correctly |

## P. Evidence register

- `../../../../10-project-architecture-map.md`: canonical architecture, file-first/sample-first principles, project production sequence.
- `../../../../11-current-operating-flow.md`: project governance and historical Remotion lane.
- `../workflow/FLOW_V1.md`: approved S0-S6 production baseline, user gates and milestone status.
- `../workflow/RAG_INGEST_AND_RETRIEVAL.md`: approved-only RAG, SQLite projection, build-time retrieval and failure policy.
- `AI_WEEKLY_GPT_5_6_RAG_FLOW_REPORT_2026-07-16.md`: pilot metrics, defects, render output and decision.
- `../../package.json`: current production and visual-flow command surfaces.

