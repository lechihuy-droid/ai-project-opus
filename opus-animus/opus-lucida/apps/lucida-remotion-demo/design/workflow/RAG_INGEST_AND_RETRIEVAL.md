# Lucida Remotion RAG Ingest and Retrieval

- **Status:** active
- **Date:** 2026-07-16
- **Scope:** visual evidence ingest, human approval, canonical promotion, local SQLite projection, build-time retrieval cho Remotion mapping
- **Owner stages:** S1 Ingest và S3 Mapping

## 1. Boundary đã chốt

RAG chạy ở build-time, trước khi sinh `video-map.json`. Remotion renderer không mở SQLite và không import knowledge repository.

```text
collector -> sanitize -> human approval -> canonical reference library
          -> compile indexes -> SQLite FTS5 projection
          -> retrieve approved evidence -> scene mapper -> video-map.json
          -> Remotion renderer
```

DB là projection có thể rebuild. Canonical truth nằm trong:

- `design/knowledge/reference-approvals/`
- `design/knowledge/reference-library/`
- `design/template-library/`
- `design/visual-library/`

## 2. S1: ingest evidence vào knowledge corpus

### 2.1 Collect và sanitize

```powershell
npm run collect:visual -- --config pipeline/fixtures/visual-reference-flow.json --out pipeline/runs/<run-id>
npm run process:visual -- --input pipeline/runs/<run-id>/01-raw-input.json --config pipeline/fixtures/visual-reference-flow.json
```

Output review: `pipeline/runs/<run-id>/02-sanitized-input.json`.

### 2.2 Human approval bắt buộc

Mỗi source được duyệt riêng. Operator phải cung cấp immutable revision và bằng chứng quyền sử dụng.

```powershell
npm run knowledge:approve -- `
  --input pipeline/runs/<run-id>/02-sanitized-input.json `
  --source <source-id> `
  --revision <commit-sha-or-snapshot-id> `
  --rights-policy <policy> `
  --rights-evidence <review-note-or-license-ref> `
  --approved-by <reviewer> `
  --out pipeline/runs/<run-id>/<source-id>.approved.json
```

Không tự động approval. Source thiếu `sourceRevision`, rights evidence hoặc reviewer không được promotion.

### 2.3 Promote, compile, build

```powershell
npm run knowledge:promote -- `
  --input pipeline/runs/<run-id>/<source-id>.approved.json `
  --source <source-id> `
  --package <canonical-package-id>

npm run knowledge:compile
npm run knowledge:build
```

Promotion tạo immutable approval artifact và canonical reference package. Không sửa package đã promote; source đổi revision phải dùng package/version mới theo governance.

## 3. S3: retrieval trước scene mapping

Flow config bật RAG:

```json
{
  "knowledge": {
    "enabled": true,
    "repository": "sqlite",
    "refreshProjection": true,
    "limit": 3,
    "maxQueryCharacters": 600
  }
}
```

`npm run visual-flow` thực hiện:

1. Collect và sanitize visual input.
2. Compile canonical indexes.
3. Build SQLite khi repository là `sqlite`.
4. Query approved evidence cho từng normalized event.
5. Ghi `03-knowledge-selection.json`.
6. Map scene và compile `05-video-map.json`.
7. Preview/render bằng JSON props; renderer không đọc DB.

Mapper ưu tiên theo thứ tự:

1. Family được source chỉ định và nằm trong allowlist.
2. Family từ approved RAG result.
3. Deterministic mapping rule hiện có.
4. Config default.

Không có lexical match thì RAG không ép family. Fallback phải deterministic.

## 4. Audit artifacts

Mỗi run có các artifact liên quan:

| Artifact | Vai trò |
|---|---|
| `02-sanitized-input.json` | Input đã scrub secret, chưa được coi là approved |
| `<source-id>.approved.json` | Quyết định human approval có revision và rights evidence |
| `03-knowledge-selection.json` | Query, result IDs, scores, provenance, manifest hash |
| `04-visual-scenes.json` | Scene family/preset và evidence IDs đã dùng |
| `05-video-map.json` | Contract đưa sang Remotion renderer |
| `.generated/knowledge/manifest.json` | Hash của generated corpus |
| `.generated/knowledge/lucida-knowledge.db` | SQLite FTS5 projection local, không commit |

## 5. Failure policy

- SQLite absent: fail và yêu cầu `npm run knowledge:build`.
- SQLite manifest khác generated manifest: fail stale projection; không query DB cũ.
- Evidence chưa approved hoặc rights chưa approved: không vào retrieval corpus.
- RAG disabled: mapper giữ behavior deterministic cũ.
- `--no-knowledge-refresh`: chỉ dùng khi projection đã build và manifest còn khớp.
- Renderer vẫn chạy từ `video-map.json` khi DB bị xóa sau mapping.

## 6. Verification

```powershell
node --test tests/knowledge/visual-rag-integration.test.mjs
npm run test:visual-mapper
npm run validate:visual-contracts
npm run knowledge:qa
```

Acceptance tối thiểu:

- approval -> promotion thành công cho source hợp lệ;
- retrieval chỉ trả approved evidence;
- RAG result có thể thay family trước mapping;
- stale SQLite bị reject;
- Remotion source không import SQLite/repository.

## 7. Current limitation

Corpus hiện còn nhỏ. Flow đã nối end-to-end, nhưng chất lượng recommendation phụ thuộc số source được human-review và promote. Không dùng collector raw trực tiếp để bù thiếu corpus.

## 8. Pilot reports

- [`../reports/AI_WEEKLY_GPT_5_6_RAG_FLOW_REPORT_2026-07-16.md`](../reports/AI_WEEKLY_GPT_5_6_RAG_FLOW_REPORT_2026-07-16.md) - pilot 20 giây, SQLite RAG 5/5 match, render PASS, publish NO-GO do audio silence và thiếu visual diversity.

## 9. Lane and style contract (W1)

For `visual-flow/v2`, retrieval supplies evidence but does not silently choose a family:

- `styleMode: locked` uses only `run.lockedStyle.family`; `lockedBy` and `reason` make the decision auditable.
- `styleMode: auto` leaves selection to the Director. Source `family` and `mapping.defaultFamily` are invalid, so RAG evidence cannot override the Director implicitly.
- During the v1 rollout, the compatibility adapter preserves one legacy source family as locked style, falling back to `mapping.defaultFamily`, and emits a deprecation warning.

## 10. Evidence domains (W6)

Every canonical source, document, compiled chunk, search record, query, and selected evidence item declares `factual` or `visual-style`. Visual ingestion/retrieval always uses `visual-style`; factual retrieval always uses `factual`. Domain filtering happens before ranking, and a domain mismatch is traceable without exposing unsafe evidence. The renderer continues to consume only compiled artifacts. See `../../docs/W6-evidence-domains.md` for ingest, migration and query ownership.

## 11. Dual-domain selection binding (W9)

`map-and-compile-visual-scenes.mjs` performs two isolated queries before mapping:

1. `selectVisualKnowledge()` queries `visual-style` and supplies package evidence to the Director.
2. `selectFactualKnowledge()` queries `factual`, then resolves each `ContentBrief.beats[].factRefs` against canonical `provenance.sourceId` values.
3. `mergeKnowledgeSelections()` writes `lucida-knowledge-selection/v2` with both domains in one event-indexed artifact while preserving the domain on every evidence item.

The Director receives only `visual-style` evidence. The mapper rejects every unresolved `factRef` and every reference bound to non-factual evidence. Chunk IDs remain in the trace as retrieval evidence, while the canonical source ID is the stable fact reference used by ContentBrief. Remotion still receives only compiled `video-map.json` and never queries either repository.
