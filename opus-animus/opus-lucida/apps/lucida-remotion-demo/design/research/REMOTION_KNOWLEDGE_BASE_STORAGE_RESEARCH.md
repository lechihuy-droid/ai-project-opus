# Nghiên cứu kiến trúc storage cho Remotion Knowledge Base

> Phạm vi: `opus-animus/opus-lucida/apps/lucida-remotion-demo`
>
> Ngày cập nhật: 2026-07-13
>
> Loại tài liệu: knowledge-base research + storage decision + SQLite implementation plan
>
> Liên quan:
>
> - `REMOTION_KNOWLEDGE_BASE_ARCHITECTURE_REVIEW.md`
> - `REMOTION_COMPONENT_LIBRARY_LUCIDA_INTEGRATION_ASSESSMENT.md`
> - `ASSET_COMPONENT_RENDER_ARCHITECTURE_REVIEW.md`

---

## 1. Mục tiêu nghiên cứu

Tài liệu này xác định cách Lucida lưu trữ, lập chỉ mục và truy xuất knowledge phục vụ việc lựa chọn và render component Remotion.

Phạm vi knowledge gồm:

```text
ComponentPrimitive
SceneAdapter
TemplateDefinition
TemplatePreset
VisualFamily
MotionPreset
TransitionDefinition
AssetSlotSchema
CompatibilityRule
ProvenanceRecord
ValidationArtifact
```

Tài liệu không coi database là source of truth. Mục tiêu là thiết kế một storage architecture bảo đảm:

1. knowledge có thể review và version;
2. runtime Remotion deterministic và có thể chạy offline;
3. director tìm được component phù hợp;
4. provenance và QA có thể truy vết;
5. storage có thể phát triển từ local-first sang server platform mà không viết lại domain model.

---

## 2. Kết luận kiến trúc

Lucida chưa cần PostgreSQL trong giai đoạn Remotion Component Knowledge Base MVP.

Kiến trúc được chọn:

```text
Git repository
= canonical source of truth

Local filesystem hoặc object folder
= preview, evidence media, validation render và binary asset

Generated JSON
= runtime registry và director indexes

SQLite
= derived metadata, full-text search và operational projection có thể rebuild

PostgreSQL
= migration target khi Lucida trở thành shared multi-user hoặc distributed platform
```

Quy tắc quan trọng nhất:

> Canonical knowledge được author và review trong Git. SQLite chỉ là projection được compiler sinh ra từ canonical packages.

Không đưa PostgreSQL, pgvector, LanceDB hoặc một database service riêng vào Component Knowledge Model v0.1.

---

## 3. Bối cảnh workload hiện tại

Lucida hiện gần với một local build system hơn là một SaaS data platform:

```text
8 visual families
7 motion presets
28 registered template IDs
khoảng 10 runtime adapters thật
một repository chính
một local Remotion application
write volume thấp
read-heavy trong planning, validation và build
```

Workload knowledge hiện tại chủ yếu là:

1. đọc metadata của template và component;
2. lọc theo scene intent, capability và status;
3. kiểm tra compatibility;
4. tra provenance và license;
5. ghi kết quả ingestion hoặc validation theo batch nhỏ;
6. sinh runtime indexes;
7. query từ CLI hoặc local review UI;
8. render bằng một process hoặc một worker đơn.

Đây là workload phù hợp với SQLite.

---

## 4. Vai trò của từng storage layer

## 4.1 Git — canonical knowledge

Git lưu những artifact cần code review, diff, version và rollback:

```text
design/template-library/<template-id>/template.json
design/template-library/<template-id>/content.schema.json
design/template-library/<template-id>/slots.schema.json
design/template-library/<template-id>/provenance.json

design/component-library/<component-id>/component.json
design/visual-library/
design/motion-library/
design/directors/
design/schemas/
```

Git chịu trách nhiệm:

- stable canonical ID;
- semantic versioning;
- schema evolution;
- ownership;
- provenance;
- source commit pin;
- implementation và metadata synchronization;
- review gate;
- rollback.

Canonical entities không được sửa trực tiếp trong SQLite.

## 4.2 Filesystem hoặc object storage — binary artifacts

Lưu ngoài database:

- preview MP4;
- still frames;
- contact sheets;
- source/reference media được phép lưu;
- audio;
- image, video và SVG asset;
- render report dung lượng lớn;
- raw model output;
- embedding files trong tương lai.

Database chỉ lưu:

```text
artifact URI
content hash
media metadata
rights status
validation relation
```

## 4.3 Generated JSON — runtime source

Remotion renderer không nên phụ thuộc vào SQLite hoặc network database trong render path.

Compiler sinh:

```text
generated/template-index.json
generated/adapter-index.json
generated/director-index.json
generated/compatibility-index.json
```

Ưu điểm:

- deterministic;
- offline;
- inspectable;
- dễ cache;
- phù hợp với Remotion bundling;
- không tạo database availability dependency khi render;
- identical input có thể tạo identical output.

## 4.4 SQLite — derived knowledge projection

SQLite dùng cho:

- structured metadata lookup;
- FTS5 lexical search;
- provenance query;
- compatibility lookup;
- candidate deduplication;
- validation-result index;
- ingestion status;
- usage history;
- local retrieval cache;
- local review UI.

SQLite database phải có thể xóa hoàn toàn và rebuild từ canonical packages cùng artifact manifests.

---

## 5. Vì sao SQLite đủ

## 5.1 Structured query

SQLite đủ để index và filter:

- template ID;
- component ID;
- adapter ID;
- family ID;
- motion preset;
- transition;
- scene intents;
- status;
- safe areas;
- aspect ratios;
- density;
- render cost;
- tags;
- license;
- source repository;
- source commit;
- QA status.

## 5.2 Flexible metadata

Các field linh hoạt có thể lưu dưới JSON text và JSON functions:

- capabilities;
- asset slot definitions;
- parameter constraints;
- QA results;
- dependency audit;
- provenance details;
- render benchmark summary.

Các trường được filter thường xuyên phải normalize thành column hoặc relation table, không đặt toàn bộ knowledge trong một JSON blob.

## 5.3 Full-text search

FTS5 đủ cho MVP search theo:

- description;
- `bestFor`;
- tags;
- component documentation;
- scene-intent explanation;
- provenance note;
- validation issue message.

Retrieval MVP:

```text
hard filters
→ SQL metadata conditions
→ FTS5 lexical ranking
→ compatibility scoring trong application code
→ continuity scoring
```

Catalog hiện tại chưa cần embedding.

## 5.4 Local concurrency

SQLite WAL phù hợp với topology:

```text
một compiler hoặc ingestion writer
+
nhiều reader từ CLI, validation và local UI
```

SQLite chỉ có một writer tại một thời điểm, nhưng đây chưa phải giới hạn thực tế của Lucida hiện tại vì write transaction nhỏ, batch-oriented và chạy cùng host.

---

## 6. SQLite không được trở thành kiến trúc core của renderer

Không để:

```text
Remotion component
→ SQL query trong lúc render frame
```

Không để:

```text
Style Director domain logic
→ SQLite-specific SQL rải rác trong application
```

Đúng:

```text
Canonical Git packages
→ Knowledge Compiler
→ Generated JSON + SQLite projection

Director
→ KnowledgeRepository interface

Renderer
→ generated deterministic indexes
```

Runtime render phải tiếp tục hoạt động khi SQLite file không tồn tại, miễn generated indexes hợp lệ đã được build.

---

## 7. Logical schema SQLite v0.1

```sql
CREATE TABLE schema_versions (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE components (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  adapter_id TEXT,
  implementation_path TEXT,
  source_repo TEXT,
  source_commit TEXT,
  license TEXT,
  deterministic INTEGER NOT NULL DEFAULT 0,
  capabilities_json TEXT NOT NULL,
  package_path TEXT NOT NULL,
  content_hash TEXT NOT NULL
);

CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  family_id TEXT NOT NULL,
  component_id TEXT,
  adapter_id TEXT NOT NULL,
  preset_id TEXT,
  density TEXT,
  render_cost TEXT,
  package_path TEXT NOT NULL,
  definition_json TEXT NOT NULL,
  content_hash TEXT NOT NULL
);

CREATE TABLE template_intents (
  template_id TEXT NOT NULL,
  intent TEXT NOT NULL,
  PRIMARY KEY (template_id, intent)
);

CREATE TABLE template_capabilities (
  template_id TEXT NOT NULL,
  capability_type TEXT NOT NULL,
  capability_value TEXT NOT NULL,
  PRIMARY KEY (template_id, capability_type, capability_value)
);

CREATE TABLE motion_presets (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  implementation_path TEXT,
  package_path TEXT NOT NULL,
  definition_json TEXT NOT NULL,
  content_hash TEXT NOT NULL
);

CREATE TABLE transitions (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  implementation_path TEXT,
  definition_json TEXT NOT NULL,
  content_hash TEXT NOT NULL
);

CREATE TABLE compatibility_rules (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  score REAL,
  rule_json TEXT
);

CREATE TABLE provenance_records (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  source_repo TEXT,
  source_commit TEXT,
  source_path TEXT,
  license TEXT,
  review_status TEXT,
  record_json TEXT NOT NULL
);

CREATE TABLE validation_artifacts (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  check_type TEXT NOT NULL,
  status TEXT NOT NULL,
  artifact_uri TEXT,
  content_hash TEXT,
  result_json TEXT NOT NULL,
  validated_at TEXT NOT NULL
);

CREATE TABLE index_builds (
  id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  source_commit TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL,
  manifest_hash TEXT
);

CREATE VIRTUAL TABLE knowledge_fts USING fts5(
  entity_type,
  entity_id UNINDEXED,
  title,
  description,
  tags,
  provenance_text
);
```

Schema trên là logical proposal. Driver và migration tool có thể thay đổi, nhưng stable IDs, package path, source commit và content hash là bắt buộc.

---

## 8. Knowledge Repository abstraction

Director và tooling không gọi SQLite trực tiếp.

```ts
interface KnowledgeRepository {
  getTemplate(id: string): Promise<TemplateDefinition | null>;
  listTemplates(filter: TemplateFilter): Promise<TemplateDefinition[]>;
  searchTemplates(query: KnowledgeQuery): Promise<RankedTemplate[]>;
  getCompatibility(
    query: CompatibilityQuery,
  ): Promise<CompatibilityResult[]>;
  getProvenance(
    entityType: string,
    entityId: string,
  ): Promise<ProvenanceRecord[]>;
  getValidationStatus(
    entityType: string,
    entityId: string,
  ): Promise<ValidationSummary>;
}
```

Implementations:

```text
JsonKnowledgeRepository
SQLiteKnowledgeRepository
PostgresKnowledgeRepository    # future
```

Compatibility scoring, continuity và ranking vẫn nằm trong domain/application layer.

---

# 9. SQLite implementation plan

## 9.1 Có cần implementation plan không?

**Có.**

Implementation plan cần thiết vì không có plan sẽ tạo ba rủi ro:

1. SQLite trở thành source of truth thứ hai song song với Git;
2. schema database được thiết kế trước domain model và nhanh chóng drift;
3. renderer hoặc director bị coupling trực tiếp với database implementation.

Tuy nhiên:

> Cần viết và chốt plan ngay, nhưng chưa nên bắt đầu code SQLite trước khi canonical component package đầu tiên hoạt động.

Dependency bắt buộc:

```text
Canonical knowledge model
→ template pilot
→ knowledge compiler
→ generated JSON
→ SQLite projection
```

Không đảo thứ tự thành:

```text
SQLite schema
→ cố nhét catalog hiện tại vào database
→ tiếp tục giữ runtime registry thủ công
```

---

## 9.2 Phase 0 — Gate trước implementation

Chỉ bắt đầu SQLite khi pilot `glitch-text` đạt:

1. có canonical `template.json`;
2. có component/provenance package;
3. có schema validation;
4. có dedicated `GlitchTextAdapter`;
5. generated template index resolve đúng adapter;
6. có deterministic preview;
7. runtime không còn dùng mapping thủ công cho template này.

Output gate:

```text
design/template-library/glitch-text/
generated/template-index.json
```

Nếu Phase 0 chưa đạt, SQLite không giải quyết được vấn đề kiến trúc cốt lõi.

---

## 9.3 Phase 1 — Storage scaffold

Files:

```text
design/storage/README.md
design/storage/sqlite-schema.sql
design/storage/migrations/001-initial.sql
scripts/knowledge/sqlite-client.mjs
.generated/.gitkeep
```

Tasks:

1. chọn SQLite driver tương thích Node/Bun environment hiện tại;
2. bật foreign keys;
3. bật WAL cho local operational use;
4. cấu hình busy timeout;
5. tạo migration runner tối giản;
6. thêm `.generated/*.db` vào `.gitignore`;
7. thêm schema version table;
8. xác định transaction boundary cho một index build.

Acceptance criteria:

- tạo database rỗng từ migration;
- chạy migration lặp lại không phá dữ liệu;
- database nằm ngoài tracked Git artifacts;
- schema version truy vấn được.

---

## 9.4 Phase 2 — Knowledge compiler projection

Files:

```text
scripts/compile-template-knowledge.mjs
scripts/build-knowledge-index.mjs
scripts/validate-knowledge-index.mjs
```

Compiler thực hiện:

```text
canonical packages
→ JSON Schema validation
→ relationship validation
→ stable normalization
→ content hashing
→ generated JSON
→ SQLite transaction
```

Rules:

1. một build dùng một transaction;
2. build thất bại phải rollback;
3. không để partial index;
4. mỗi row giữ package path, version, source commit và content hash;
5. SQLite và generated JSON ghi cùng `sourceCommit` và `schemaVersion`;
6. rebuild có thể dùng clean rebuild trước, incremental upsert sau;
7. deleted canonical packages phải biến mất khỏi projection.

Acceptance criteria:

- xóa DB và build lại tạo cùng logical records;
- build hai lần không tạo duplicate;
- generated JSON và SQLite có cùng template count;
- `glitch-text` resolve cùng adapter/preset ở cả hai output.

---

## 9.5 Phase 3 — Query layer

Files:

```text
src/knowledge/KnowledgeRepository.ts
src/knowledge/JsonKnowledgeRepository.ts
src/knowledge/SQLiteKnowledgeRepository.ts
scripts/query-knowledge-index.mjs
```

Minimum queries:

```text
get template by ID
list production-supported templates
filter by scene intent
filter by family
filter by safe area
filter by aspect ratio
filter by content requirement
search FTS text
get compatibility rules
get provenance
get validation status
```

CLI examples:

```bash
npm run knowledge:query -- --intent hook --density low
npm run knowledge:query -- --text "AI coding glitch"
npm run knowledge:query -- --template glitch-text --provenance
```

Acceptance criteria:

- query `hook + code_explanation + low density` trả `glitch-text`;
- catalog-only hoặc unsupported template bị loại khi yêu cầu renderable;
- provenance trả source repository, commit và license;
- FTS tìm được bằng `cyber`, `glitch`, `AI coding`.

---

## 9.6 Phase 4 — Validation và parity tests

Files:

```text
tests/knowledge/compiler.test.mjs
tests/knowledge/sqlite-projection.test.mjs
tests/knowledge/repository-parity.test.mjs
tests/knowledge/fixtures/
```

Tests:

1. schema migration test;
2. clean rebuild test;
3. idempotent build test;
4. deleted-package cleanup test;
5. duplicate stable-ID failure;
6. broken relation failure;
7. SQLite and JSON repository parity;
8. provenance completeness;
9. validation status filter;
10. runtime-independent-of-database test.

Parity invariant:

```text
JsonKnowledgeRepository(query)
=
SQLiteKnowledgeRepository(query)
```

với cùng canonical source commit và query semantics.

---

## 9.7 Phase 5 — Local review integration

Chỉ triển khai khi CLI query ổn định.

Use cases:

- browse template packages;
- search component;
- xem preview;
- xem provenance;
- xem validation failures;
- so sánh candidate;
- lọc production-ready template.

Review UI không sửa canonical entity trực tiếp trong SQLite. Mọi approved change phải tạo hoặc sửa canonical package trong Git workflow.

---

## 9.8 Package scripts đề xuất

```json
{
  "scripts": {
    "knowledge:validate": "node scripts/validate-template-knowledge.mjs",
    "knowledge:compile": "node scripts/compile-template-knowledge.mjs",
    "knowledge:build-index": "node scripts/build-knowledge-index.mjs",
    "knowledge:validate-index": "node scripts/validate-knowledge-index.mjs",
    "knowledge:query": "node scripts/query-knowledge-index.mjs",
    "knowledge:test": "node --test tests/knowledge/*.test.mjs"
  }
}
```

Command names có thể điều chỉnh để phù hợp convention của package hiện tại.

---

## 10. Có nên triển khai SQLite ngay không?

Quyết định:

```text
Viết và chốt implementation plan
→ làm ngay

Tạo database code trước canonical pilot
→ không

Triển khai SQLite projection sau glitch-text pilot
→ có
```

Lý do:

- SQLite sẽ có giá trị ngay khi có canonical package để compile;
- trước thời điểm đó database chỉ mirror catalog chưa chuẩn hóa;
- bottleneck hiện tại là component knowledge model và runtime adapter, không phải query speed;
- implementation plan giúp compiler và package schema được thiết kế portable từ đầu;
- delay code SQLite giúp tránh xây infrastructure quanh model chưa ổn định.

Priority:

```text
P0  Canonical Component Knowledge Model
P1  glitch-text pilot + generated JSON
P2  SQLite Knowledge Projection
P3  local retrieval/query tooling
P4  embeddings hoặc PostgreSQL khi có trigger thực tế
```

---

## 11. Khi nào PostgreSQL trở nên cần thiết

Chuyển sang PostgreSQL khi xuất hiện ít nhất một trigger kiến trúc:

## 11.1 Multi-user review

- nhiều designer cùng approve candidate;
- nhiều agent ghi ingestion result;
- web review UI cho nhiều user;
- cần permission theo team/project;
- cần audit theo user và optimistic locking.

## 11.2 Distributed workers

```text
API server
+ ingestion workers
+ embedding workers
+ render workers
+ review service
```

Nếu các process chạy trên nhiều host hoặc container, không chia sẻ SQLite file qua network volume.

## 11.3 Concurrent writes

- xuất hiện `SQLITE_BUSY` thường xuyên;
- phải serialize nhiều writer bằng application queue;
- nhiều ingestion batch chạy đồng thời;
- transaction kéo dài;
- WAL checkpoint ảnh hưởng latency.

## 11.4 Knowledge platform trở thành service

- remote API;
- managed backup;
- high availability;
- connection pooling;
- centralized audit;
- cross-project queries;
- multi-tenant isolation;
- long-running transactional workflow.

## 11.5 Vector retrieval là production path

PostgreSQL + pgvector đáng cân nhắc khi:

- searchable asset/evidence/component corpus đủ lớn;
- semantic search được gọi online thường xuyên;
- vector query phải kết hợp metadata filters;
- nhiều client truy cập cùng index;
- embedding index cần HNSW/IVFFlat và operational monitoring.

Không migrate chỉ để thử embedding trên vài trăm record.

---

## 12. Practical migration thresholds

| Tín hiệu | SQLite phù hợp | Cân nhắc PostgreSQL |
|---|---|---|
| Writer | Một compiler/worker | Nhiều service ghi đồng thời |
| Deployment | Một host/container | Nhiều host/container dùng chung data |
| Workload | Read-heavy, batch writes | Continuous concurrent writes |
| Scope | Một repo/workspace | Nhiều project/team/tenant |
| Search | Metadata + FTS5 | Online vector + metadata search |
| Governance | Git/PR review gate | DB workflow và role-based audit |
| Availability | Có thể rebuild | Shared production service |
| Failure tolerance | Rebuild DB chấp nhận được | Không chấp nhận service interruption |

Một ngưỡng tham khảo:

```text
Dưới khoảng 10.000–50.000 searchable records
+ single-host
+ read-heavy
+ một writer
→ SQLite thường vẫn đủ
```

Số record không phải yếu tố quyết định chính. Concurrency, deployment topology và operational requirements quan trọng hơn kích thước database.

---

## 13. Tránh lock-in

1. Director dùng `KnowledgeRepository`, không dùng SQLite API trực tiếp.
2. Renderer chỉ dùng generated deterministic indexes.
3. Stable IDs không phụ thuộc auto-increment database key.
4. Domain logic không đặt trong SQLite trigger.
5. Compatibility scoring nằm trong application layer.
6. Fixtures chạy được với cả JSON và SQLite repository.
7. Canonical row truy ngược được về package path, version, Git commit và hash.
8. Sau migration, PostgreSQL vẫn là published projection; Git tiếp tục là canonical source.

Future publish flow:

```text
Git merge
→ CI validation
→ knowledge compiler
→ publish projection vào PostgreSQL
→ update search/vector indexes
→ notify director/runtime services
```

---

## 14. Definition of done cho SQLite Projection v0.1

```text
canonical glitch-text package
→ schema validation passes
→ generated JSON index
→ SQLite projection
→ deterministic query results
→ JSON/SQLite parity tests pass
→ runtime remains DB-independent
```

Acceptance criteria:

1. SQLite DB được tạo từ canonical Git packages, không nhập tay.
2. Xóa DB rồi build lại tạo cùng logical records.
3. Compiler không tạo partial index khi lỗi.
4. Query trả đúng `glitch-text` theo intent/capability.
5. Chỉ trả template có runtime implementation khi filter `renderable`.
6. Provenance truy được source repo, commit, path và license.
7. FTS5 search hoạt động.
8. SQLite file được gitignore.
9. Không có embedding/vector extension trong v0.1.
10. Renderer không kết nối SQLite.
11. JSON và SQLite repository có query parity.
12. Database row truy được canonical package và source commit.

---

## 15. Next action

Next action không phải tạo ngay toàn bộ SQLite stack.

Action đúng:

```text
1. Hoàn thành Remotion Component Knowledge Model v0.1
2. Migrate glitch-text thành canonical package
3. Sinh generated/template-index.json
4. Chốt schema SQLite dựa trên package thực tế
5. Triển khai Phase 1–4 của SQLite Knowledge Projection
```

Deliverable cần tạo ngay sau pilot:

```text
design/storage/README.md
design/storage/sqlite-schema.sql
design/storage/migrations/001-initial.sql
scripts/build-knowledge-index.mjs
scripts/query-knowledge-index.mjs
scripts/validate-knowledge-index.mjs
src/knowledge/KnowledgeRepository.ts
src/knowledge/SQLiteKnowledgeRepository.ts
tests/knowledge/repository-parity.test.mjs
```

---

## 16. Quyết định cuối cùng

| Nội dung | Quyết định |
|---|---|
| Git canonical packages | Bắt buộc |
| Generated JSON runtime index | Bắt buộc |
| SQLite local knowledge projection | Nên triển khai sau component pilot |
| SQLite làm source of truth | Không |
| Renderer query database khi render | Không |
| SQLite implementation plan | Cần, chốt ngay |
| SQLite implementation code | Bắt đầu sau `glitch-text` pilot |
| Embedding/vector search trong v0.1 | Không |
| PostgreSQL trong MVP | Không |
| PostgreSQL dài hạn | Có, khi có multi-user/distributed trigger |

Kết luận:

> SQLite là bước triển khai hợp lý cho local Remotion Knowledge Base, nhưng chỉ sau khi canonical knowledge model chứng minh được qua một component pilot. Implementation plan cần được chốt ngay để bảo đảm projection có thể rebuild, portable và không làm renderer phụ thuộc database.