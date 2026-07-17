# Remotion RAG Operating Model - Implementation Plan

- **Status:** active execution
- **Plan owner / final verifier:** Sol (`gpt-5.6-sol`)
- **Build agents:** Terra (`gpt-5.6-terra`, reasoning `high`)
- **Test agents:** Luna (`gpt-5.6-luna`, reasoning `high`)
- **Production baseline:** `../workflow/FLOW_V1.md`
- **RAG control:** `../workflow/RAG_INGEST_AND_RETRIEVAL.md`
- **Case study:** `ai-weekly-gpt-5-6-2026-07-16`

## 1. Goal

Implement two explicit, enforceable Remotion lanes end to end:

1. **Production Lane:** follows S0-S6, requires audio/timing, approval gates, factual and visual provenance, QA, and publish handoff.
2. **Rapid Visual Pilot Lane:** optimizes visual exploration, always starts `non_publishable`, and can enter Production only through an auditable promotion gate.

Style selection must support two unambiguous modes:

- `auto`: RAG supplies approved evidence and the production Director ranks compatible style packages.
- `locked`: a user explicitly supplies the family, actor, and reason; RAG supports that family but does not claim to have selected it.

## 2. Definition Of Done

- New runs declare lane, style mode, publication status, and approval references.
- Legacy `visual-flow/v1` remains readable through an adapter and emits a deprecation warning.
- `visual-flow` cannot create a publishable run or call publish handoff directly.
- `flow:run` cannot produce publish handoff without production approvals, non-silent audio, TimedScript, and passed QA.
- Production Director rules are used by the actual visual mapper, not only validation/test scripts.
- Every auto selection records candidates, scores, accepted/rejected reasons, evidence, penalties, and fallback.
- Factual evidence and visual-style evidence use separate query domains and provenance checks.
- Renderer remains independent from SQLite and knowledge source files.
- Five-scene videos use at least three effective layouts and no layout repeats more than twice consecutively.
- At least five production style packages have sufficient approved evidence breadth.
- E2E tests cover rapid auto, rapid locked, promotion, production, and blocked publish paths.
- GPT-5.6 pilot is rerun in auto, locked, and promoted-production modes; final production output has audible voice and passed handoff.

## 3. Public Contracts

### 3.1 RunEnvelope

```ts
type RunLane = "production" | "rapid-visual-pilot";
type StyleMode = "auto" | "locked";
type PublicationStatus =
  | "non_publishable"
  | "promotion_pending"
  | "publishable";

type RunEnvelope = {
  schemaVersion: "lucida-run/v1";
  runId: string;
  lane: RunLane;
  styleMode: StyleMode;
  lockedStyle?: {
    family: string;
    lockedBy: string;
    reason: string;
  };
  publicationStatus: PublicationStatus;
  approvalRefs: string[];
};
```

Rules:

- `lockedStyle` is required only for `styleMode: locked`.
- `family` metadata under v2 `auto` is invalid; it cannot silently override Director selection.
- Legacy v1 `family` is adapted to locked mode with a warning, preserving old output.
- `publicationStatus: publishable` is legal only for Production Lane after promotion/production validation.

### 3.2 ContentBrief

Required fields: title, audience, intent, beats, factual source IDs, visual constraints, and style mode. Each beat preserves separate `title`, `body`, `role`, `actors`, and `factRefs`. Normalization must not collapse line structure.

### 3.3 DirectorSelectionTrace

Required fields: run ID, event/beat ID, mode, query intent, candidates, scores, selected/rejected reasons, evidence IDs, component availability, repetition penalty, selected result, fallback, manifest hash, and approval reference.

### 3.4 Evidence Domain

Every knowledge record and query declares one domain:

- `factual`
- `visual-style`

Current canonical visual reference packages migrate to `visual-style`. Production facts must never be satisfied by visual-style evidence.

## 4. Agent Protocol

- Sol creates wave scope and owns integration decisions.
- One Terra agent owns each production write scope; parallel Terra agents receive disjoint files.
- One Luna agent independently tests each wave and prioritizes failure paths and backward compatibility.
- Subagent model audit is configuration-backed: the spawn API records the requested model override in this ledger but does not expose independent backend model telemetry after launch. A completed agent ID therefore proves task lineage, while the model column proves requested routing rather than runtime attestation.
- Every spawn records requested model explicitly; inherited model is forbidden.
- Agent final output must list changed files, commands, failures, and unresolved risks.
- No next wave starts until Sol verifies the prior gate.
- Subagents must not revert unrelated user changes and must work with concurrent edits.

Execution log format:

```text
wave | agent_id | nickname | role | requested_model | reasoning
write_scope | changed_files | tests | status | sol_decision
```

## 5. Implementation Waves

### W0 - Baseline Lock

- **Goal:** establish authoritative current behavior before edits.
- **Method:** run contract, Director, mapper, knowledge, audio, and preflight tests; record existing failures separately.
- **Agent:** Luna-W0; Sol audits coverage.
- **Output:** baseline test ledger in this document.
- **Gate:** all passing tests reproducible; every existing failure classified.

### W1 - Lane And Approval Contracts

- **Goal:** make lane and publication state machine explicit.
- **Method:** add RunEnvelope and ApprovalRecord schemas, visual-flow v2 schema, v1 adapter, and validators; update canonical workflow docs.
- **Terra scope:** `pipeline/schemas/`, contract adapters/validators, workflow docs.
- **Luna scope:** schema fixtures and compatibility tests.
- **Gate:** invalid lane/style/approval combinations fail deterministically; valid v1 fixtures retain behavior.

### W2 - Orchestration Enforcement And Promotion

- **Goal:** prevent rapid runs from bypassing production controls.
- **Method:** rapid runner writes `non_publishable`; production runner requires Production envelope; add `flow:promote`; publish handoff validates publishability and approval hashes.
- **Terra scope:** `scripts/run-visual-flow.mjs`, `scripts/run-flow.mjs`, promotion/publish scripts, package commands.
- **Luna scope:** orchestration and promotion failure-path tests.
- **Gate:** rapid direct publish fails; approved promotion creates a new Production run; changed hashes invalidate approval.

### W3 - Production Director Integration

- **Goal:** replace simple family precedence with package-backed Director selection.
- **Method:** extract candidate evaluator from test-only logic; combine RAG evidence with existing intent/content/continuity rules; emit `03-director-selection.json`; preserve existing numbered runtime artifacts.
- **Terra scope:** `pipeline/director/`, retrieval/mapper integration.
- **Luna scope:** auto, locked, no-match, component-blocked, numeric, asset, chronology, and continuity tests.
- **Gate:** auto is independent from implicit family; locked records actor/reason; every candidate has reasons.

### W4 - Hard QA Gates

- **Goal:** block technically rendered but unusable output.
- **Method:** add pre-render content-capacity/provenance checks, post-render loudness/caption/frame checks, and cross-platform one-render lock with stale-PID recovery.
- **Terra scope:** QA scripts, render wrappers, flow/publish integration.
- **Luna scope:** silence, clipping, overflow, stale lock, active lock, missing QA, and checksum invalidation tests.
- **Gate:** silent AAC, overflow, missing provenance, or active competing render blocks production handoff.

### W5 - ContentBrief And Structured Normalization

- **Goal:** give selection enough semantic input and stop flattening scripts.
- **Method:** add ContentBrief schema; preserve title/body/intent/beat role/actors/facts/constraints through collect, normalize, map, and trace.
- **Terra scope:** content schemas, collectors/processors, normalized-event contract.
- **Luna scope:** multiline, Vietnamese, long title/body, actor, fact-reference, and compatibility fixtures.
- **Gate:** mapper receives structured beats; no title/body collapse.

### W6 - Factual And Visual RAG Domains

- **Goal:** prevent visual evidence from being interpreted as factual evidence.
- **Method:** add evidence domain to canonical records, compiled indexes, SQLite rows, query API, selection trace, and manifests; migrate visual records deterministically.
- **Terra scope:** knowledge compiler, repository/query layers, migration.
- **Luna scope:** JSON/SQLite parity, cross-domain exclusion, stale projection, renderer independence.
- **Gate:** factual query returns only factual evidence; visual query returns only visual-style evidence.

### W7 - Offline Hybrid Ranking And Diversity

- **Goal:** improve relevance without cloud dependency.
- **Method:** combine FTS lexical score with intent, traits, content capacity, evidence quality, availability, continuity, and repetition penalties using existing Director weights; no embedding service in v1.
- **Terra scope:** ranking core, Director scoring, evaluation fixtures.
- **Luna scope:** gold queries for all nine styles, deterministic tie/fallback, anti-monotony tests.
- **Gate:** evaluation meets agreed precision; five-scene fixture uses >=3 layouts and <=2 consecutive repeats.

### W8 - Evidence Breadth

- **Goal:** make existing styles evidence-sufficient; do not create redundant style packages.
- **Method:** audit all nine production packages; collect/sanitize candidate sources; human approval and rights review; promote canonical packages; rebuild projection.
- **Terra scope:** collection, sanitization, review artifacts, package preparation.
- **Human scope:** immutable revision, rights evidence, and approval decision.
- **Luna scope:** knowledge QA and retrieval coverage.
- **Gate:** at least five packages each have >=3 approved sources across >=2 source types; all nine package gaps documented.

### W9 - E2E, KPI Dashboard, And Pilot Rollout

- **Goal:** prove the full operating model on real artifacts.
- **Method:** add archetype fixtures, aggregate KPI report, rerun GPT-5.6 pilot in auto and locked modes, promote accepted result, run Production audio/timing/render/QA/handoff.
- **Terra scope:** E2E runner, fixtures, KPI report, rollout docs.
- **Luna scope:** full acceptance suite and output audit.
- **Sol scope:** inspect artifacts, audio metrics, frames, provenance, approvals, handoff, and doc consistency.
- **Gate:** all Definition of Done items have direct evidence.

## 6. Required Verification Commands

```powershell
npm run validate:visual-contracts
npm run test:visual-mapper
npm run validate:director
npm run test:director
npm run knowledge:qa
npm run test:audio-e2e -- --run-id phase1-verify
npm run test:semantic
npm run preflight
npm run lint
node --test tests/operating-model/*.test.mjs
```

W9 additionally runs rapid auto, rapid locked, promotion, Production render, still QA, audio QA, and publish handoff against isolated run IDs.

## 7. Compatibility And Rollback

- Do not mutate promoted canonical reference packages; create new versions.
- Keep `visual-flow/v1` adapter through rollout; remove only after fixture migration and explicit approval.
- New orchestration enforcement is fail-closed for publishing and fail-open only for explicitly non-publishable rapid previews.
- SQLite remains a rebuildable projection; canonical files remain truth.
- Renderer accepts only compiled props/VideoMap and never imports repository code.
- Every wave remains independently revertible until its public contract is consumed by the next wave.

## 8. Execution Ledger

| Wave | Build agent | Test agent | State | Evidence / decision |
|---|---|---|---|---|
| W0 | none | `019f69cb-fa06-7a63-abd6-3289fa0e4aad` / Nietzsche / `gpt-5.6-luna` high | complete | Sol gate PASS: contracts, mapper, 9-style Director, 58 knowledge tests, semantic 19 tests, preflight, lint/tsc, and `phase1-verify` audio E2E all pass. Luna sandbox EPERM was rerun outside sandbox. |
| W1 | `019f69d5-b139-71d0-b6a3-cf781d19890f` / Banach / `gpt-5.6-terra` high | `019f69e0-f1ec-7633-825b-16aeef4b474f` / Faraday / `gpt-5.6-luna` high | complete | Sol gate PASS: 6 valid flows, 4 invalid fixtures, 4 operating-model tests, TypeScript discriminated unions and compile-time assertions. Luna P2 type gap fixed by Terra and reverified. |
| W2 | `019f69ee-8ced-7243-b1eb-bee870c1f9dc` / Chandrasekhar + `019f6a02-0530-7583-a455-3f5771a7e704` / Galileo / `gpt-5.6-terra` high | `019f69f8-d5f6-7e30-9b52-23c047d9b65c` / Socrates / `gpt-5.6-luna` high | complete | Sol gate PASS: 15/15 tests. Failed handoff preserves awaiting state; runDir immutable; realpath containment; n8n/client docs synced. |
| W3 | `019f6a09-d15a-7331-93c5-fc433382d766` / Einstein / `gpt-5.6-terra` high | `019f6a14-d507-7ef3-ac18-a638ded6d546` / Kuhn / `gpt-5.6-luna` high | complete | Luna found missing trace audit fields and inaccurate alternate-fallback reason; Terra fixed both. Luna re-test and Sol gate PASS: contracts, Director 10/3, mapper, operating model 25/25, generated map validation, and TypeScript. |
| W4 | `019f6a20-18c2-7212-adf2-6f6c60c87c40` / Gibbs + `019f6a2e-1f63-7463-8e26-05091207ab8b` / Linnaeus / `gpt-5.6-terra` high | `019f6a35-937e-7183-9c34-49209111ffe2` / Curie / `gpt-5.6-luna` high | complete | Initial Luna FAIL exposed 9 trust-boundary/lock defects. Terra fixed all and connected canonical QA schema to runtime Ajv validation. Final Luna PASS; Sol gate: QA 11/11, adversarial 14/14, operating model 50/50, contracts, Director, mapper, and TypeScript PASS. Full Remotion render deferred to W9 E2E. |
| W5 | `019f6a53-7c89-7801-800a-c0593ba7aa22` / Wegener + `019f6a5f-f571-7090-b651-469fb3ebc90e` / Pasteur / `gpt-5.6-terra` high | `019f6a65-95d2-7ef0-b20f-cc65b339c7d2` / Turing / `gpt-5.6-luna` high | complete | Initial Luna FAIL exposed five binding/containment/schema/checksum gaps. Final Luna PASS; Sol gate: adversarial 7/7, operating 64/64, ContentBrief, QA, contracts, collectors, processors, mapper, and TypeScript PASS. |
| W6 | `019f6a79-f871-7dd2-b59f-e2c15b4bb7b6` / Darwin + `019f6a89-4564-7c02-9d1c-ecf7be71fd08` / Bacon / `gpt-5.6-terra` high; final fixes by Sol after quota exhaustion | `019f6a93-0a9c-7b00-820c-d92d43f97f04` / Newton / `gpt-5.6-luna` high | complete | Luna FAIL exposed unresolved factRefs, nullable updates, migration safety/scope, and manifest reference verification. New Terra/Luna spawns failed with service usage-limit, so Sol implemented equivalent fixes/tests. Final gate: domain integration 10/10, knowledge QA 71/71, evaluation metrics all 1.0, operating 65/65, mapper/contracts/tsc PASS. |
| W7 | Sol takeover (subagent quota exhausted until service reset) | Sol adversarial gate | complete | Deterministic offline hybrid ranking now combines intent order, traits, lexical/evidence quality, capacity, continuity, availability, render cost, bridge, and repetition. Gate PASS: 9/9 style gold queries, 5-scene diversity, Director 10/10 + continuity 3/3, operating model 69/69, mapper, retrieval metrics all 1.0, contracts, and TypeScript. |
| W8 | Sol integration; Terra tasks used for bounded follow-up fixes | Sol gate plus human evidence approval | complete | HUY approved 12 link-only candidates on 2026-07-17. Thirteen W8/W9 sources were promoted, canonical compile/build passed with 17 approved reference sources, retrieval evaluation is 1.0 across all metrics, and breadth is 5/5. |
| W9 | Sol integration; bounded coding and documentation tasks delegated to `gpt-5.6-terra` | Sol gate plus human production approvals | awaiting final-video approval | Production retry `w9-gpt-5-6-production-20260717-r6` completed TTS-derived timing, brand, pre-render QA, semantic QA, 1080x1920 render with audio, post-render QA, and 5/5 technical sampled still checks. Style review remains deferred and visual approval is not claimed. Flow status is exactly `awaiting_final_approval`; publish handoff remains blocked until HUY approves the exact video hash. Operating model 81/81, semantic 23/23, knowledge 75/75, lint and TypeScript pass. |
