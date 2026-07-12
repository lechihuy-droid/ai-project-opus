# Quyết định storage cho Remotion Knowledge Base: SQLite hay PostgreSQL

> Phạm vi: `opus-animus/opus-lucida/apps/lucida-remotion-demo`
>
> Ngày đánh giá: 2026-07-12
>
> Loại tài liệu: architecture decision record + implementation guidance
>
> Liên quan: `REMOTION_KNOWLEDGE_BASE_ARCHITECTURE_REVIEW.md`

---

## 1. Quyết định

**Lucida chưa cần PostgreSQL ở giai đoạn Remotion Component Knowledge Base MVP. SQLite là đủ.**

Kiến trúc được chọn:

```text
Git repository
= canonical source of truth

Local filesystem
= preview, evidence media, validation render và binary asset

Generated JSON
= runtime registry và director indexes

SQLite
= derived metadata/search/operational index có thể rebuild

PostgreSQL
= migration target khi xuất hiện nhu cầu multi-user, distributed workers hoặc server platform
```

Điểm quan trọng:

> SQLite không thay thế Git làm nguồn tri thức chuẩn. SQLite chỉ là projection được compile từ canonical knowledge packages.

Không đưa PostgreSQL, pgvector, LanceDB hoặc một service database riêng vào Component Knowledge Model v0.1.

---

## 2. Vì sao SQLite phù hợp với Lucida hiện tại

Lucida hiện có quy mô và workload gần với một local build system hơn là một SaaS data platform:

```text
8 visual families
7 motion presets
28 registered template IDs
khoảng 10 runtime adapters thật
một repository chính
một local Remotion render application
write volume thấp
read volume chủ yếu trong lúc planning, validation và build
```

Workload chính:

1. đọc package metadata;
2. lọc component theo intent, capability và status;
3. kiểm tra compatibility;
4. tìm provenance;
5. ghi kết quả ingestion hoặc validation theo batch nhỏ;
6. sinh runtime indexes;
7. render video ở local hoặc trong một worker đơn.

SQLite đáp ứng tốt các yêu cầu này mà không cần:

- database server;
- network configuration;
- connection pool;
- credentials và secret management;
- backup service riêng;
- migration infrastructure phức tạp;
- deployment và monitoring của PostgreSQL.

---

## 3. Vai trò chính xác của từng storage layer

## 3.1 Git — canonical knowledge

Git lưu những dữ liệu cần review, version và audit:

```text
design/template-library/<template-id>/template.json
design/template-library/<template-id>/content.schema.json
design/template-library/<template-id>/slots.schema.json
design/template-library/<template-id>/provenance.json

design/component-library/<component-id>/component.json
design/motion-library/
design/visual-library/
design/directors/
design/schemas/
```

Git chịu trách nhiệm:

- source review qua diff;
- semantic versioning;
- ownership;
- provenance;
- schema evolution;
- rollback;
- branch/PR workflow;
- giữ implementation và metadata đồng bộ.

Canonical entities không được sửa trực tiếp trong SQLite.

## 3.2 Filesystem hoặc object folder — binary artifacts

Lưu ngoài database:

- preview MP4;
- still frame;
- contact sheet;
- source/reference media được phép lưu;
- audio;
- SVG, image và video asset;
- render report dung lượng lớn;
- raw model output;
- embedding file, nếu có trong tương lai.

SQLite chỉ lưu URI, checksum và metadata của binary artifact.

## 3.3 Generated JSON — runtime lookup

Dùng cho Remotion renderer và các validation script:

```text
generated/template-index.json
generated/adapter-index.json
generated/director-index.json
generated/compatibility-index.json
```

Ưu điểm:

- deterministic;
- không cần database connection khi render;
- dễ cache trong build;
- có thể chạy offline;
- dễ inspect khi debug;
- phù hợp với Remotion bundling.

## 3.4 SQLite — derived knowledge index

SQLite được dùng cho:

- metadata lookup;
- local full-text search;
- provenance query;
- candidate deduplication theo key và checksum;
- compatibility query;
- ingestion status;
- validation-result index;
- project-local usage history;
- optional retrieval cache.

SQLite database phải có thể xóa và rebuild từ Git packages cùng artifact manifests.

---

## 4. SQLite đủ cho những chức năng nào

## 4.1 Structured metadata

SQLite phù hợp để index:

- template ID;
- component ID;
- adapter ID;
- family ID;
- motion preset;
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

## 4.2 JSON metadata

Những field linh hoạt có thể lưu dưới JSON text/JSON functions:

- capabilities;
- asset slot definitions;
- parameter constraints;
- QA results;
- provenance detail;
- imported dependency audit;
- render benchmark summary.

Các trường thường xuyên filter vẫn nên được normalize thành column hoặc relation table, không nhét toàn bộ vào một JSON blob.

## 4.3 Full-text search

SQLite FTS5 đủ để tìm theo:

- description;
- `bestFor`;
- tags;
- provenance note;
- component documentation;
- scene intent explanation;
- validation issue message.

MVP retrieval có thể dùng:

```text
hard filters
→ SQL metadata conditions
→ FTS5 lexical ranking
→ compatibility scoring trong application code
```

Chưa cần embedding cho catalog hiện tại.

## 4.4 Local concurrency

SQLite WAL cho phép reader và writer hoạt động đồng thời, phù hợp với mô hình:

```text
một compiler hoặc ingestion writer
+
nhiều read query từ CLI, validation hoặc local UI
```

Tuy nhiên SQLite vẫn chỉ có một writer tại một thời điểm. Vì vậy nó phù hợp khi mọi process ở cùng host và write transaction ngắn.

---

## 5. Đề xuất logical schema SQLite v0.1

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
  definition_json TEXT NOT NULL,
  content_hash TEXT NOT NULL
);

CREATE TABLE template_intents (
  template_id TEXT NOT NULL,
  intent TEXT NOT NULL,
  PRIMARY KEY (template_id, intent)
);

CREATE TABLE motion_presets (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  implementation_path TEXT,
  definition_json TEXT NOT NULL,
  content_hash TEXT NOT NULL
);

CREATE TABLE transitions (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
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

CREATE VIRTUAL TABLE knowledge_fts USING fts5(
  entity_type,
  entity_id UNINDEXED,
  title,
  description,
  tags,
  provenance_text
);
```

Schema trên là logical proposal. Implementation có thể điều chỉnh theo driver và migration tool được chọn.

---

## 6. Build và synchronization model

Luồng chuẩn:

```text
Canonical packages trong Git
        │
        ▼
validate-template-knowledge
        │
        ▼
compile-template-knowledge
        │
        ├── generated JSON indexes
        │
        └── SQLite projection
```

Nguyên tắc:

1. Git package là input duy nhất cho canonical entities.
2. Compiler dùng stable ID và content hash.
3. SQLite được upsert hoặc rebuild.
4. Generated JSON và SQLite phải cùng ghi `sourceCommit` và `schemaVersion`.
5. Nếu build lỗi, runtime không được sử dụng partial index.
6. SQLite file không nên commit nếu nó có thể tái sinh hoàn toàn.
7. Fixtures và migration SQL được commit.
8. Preview và validation artifact được liên kết bằng URI + checksum.

Đề xuất path:

```text
design/storage/
├── sqlite-schema.sql
├── migrations/
└── README.md

scripts/
├── build-knowledge-index.mjs
├── validate-knowledge-index.mjs
└── query-knowledge-index.mjs

.generated/
└── lucida-knowledge.db
```

`.generated/lucida-knowledge.db` nên nằm trong `.gitignore`.

---

## 7. Những giới hạn của SQLite cần chấp nhận

SQLite không phải lựa chọn phù hợp khi Lucida chuyển thành một shared server platform có nhiều writer.

Các giới hạn liên quan trực tiếp:

1. Chỉ một writer hoạt động tại một thời điểm trên một database file.
2. WAL yêu cầu các process truy cập cùng host; không phù hợp với network filesystem hoặc nhiều node dùng chung file.
3. Không có server process trung tâm để quản lý connection, authentication và workload.
4. Permission và tenant isolation phải làm ở application layer.
5. Distributed worker coordination khó hơn PostgreSQL.
6. Backup live database và operational monitoring ít chuẩn hóa hơn một managed PostgreSQL service.
7. Vector-search extension ecosystem không chuẩn và trưởng thành bằng PostgreSQL + pgvector cho server use case.

Các giới hạn này chưa phải vấn đề của `lucida-remotion-demo` hiện tại.

---

## 8. Khi nào phải chuyển sang PostgreSQL

Chuyển sang PostgreSQL khi xuất hiện ít nhất một trong các điều kiện kiến trúc sau.

## 8.1 Multi-user review và editing

Ví dụ:

- nhiều designer cùng approve candidate;
- nhiều agent cùng ghi ingestion result;
- web review UI chạy cho nhiều người;
- cần optimistic locking hoặc audit theo user;
- cần permission theo team/project.

## 8.2 Distributed workers

Ví dụ:

```text
API server
+ ingestion workers
+ embedding workers
+ render workers
+ review service
```

Nếu các process chạy trên nhiều host/container, không nên chia sẻ SQLite file qua network volume.

## 8.3 High write concurrency

Các dấu hiệu:

- thường xuyên nhận `SQLITE_BUSY`;
- phải serialize nhiều job writer bằng application queue;
- write transaction kéo dài;
- checkpoint ảnh hưởng latency;
- nhiều batch ingestion chạy đồng thời.

## 8.4 Knowledge platform trở thành service

PostgreSQL phù hợp hơn khi cần:

- remote API;
- managed backup;
- high availability;
- connection pooling;
- role và permission;
- centralized audit;
- cross-project queries;
- multi-tenant isolation;
- long-running transactional workflow.

## 8.5 Vector retrieval trở thành production requirement

PostgreSQL + pgvector đáng cân nhắc khi:

- số asset/component/evidence đủ lớn;
- semantic retrieval được gọi thường xuyên;
- cần kết hợp vector search với metadata filter trong cùng query;
- cần HNSW hoặc IVFFlat index;
- embedding là một phần của online serving path;
- nhiều client cần truy cập cùng index.

Không migrate chỉ vì muốn thử embedding trên vài trăm record.

---

## 9. Practical migration thresholds

Không nên dùng một con số duy nhất làm điều kiện tuyệt đối. Tuy nhiên các ngưỡng sau là tín hiệu thực dụng:

| Tín hiệu | SQLite vẫn phù hợp | Cân nhắc PostgreSQL |
|---|---|---|
| Người ghi dữ liệu | Một compiler/worker | Nhiều service hoặc nhiều reviewer ghi đồng thời |
| Deployment | Một máy hoặc một container | Nhiều host/container cần dùng chung database |
| Workload | Read-heavy, batch write ngắn | Continuous ingestion và concurrent write |
| Data scope | Một repository hoặc một workspace | Nhiều project, team hoặc tenant |
| Search | Metadata + FTS5 | Online hybrid vector + metadata search |
| Governance | Git/PR là review gate | Database workflow, role và row-level audit |
| Availability | Có thể rebuild index | Database là shared production service |
| Failure tolerance | Rebuild local DB chấp nhận được | Không được mất service hoặc gián đoạn ingestion |

Một ngưỡng quy mô tham khảo:

```text
Dưới khoảng 10.000–50.000 canonical/searchable records
+ single-host
+ read-heavy
+ một writer
→ SQLite thường vẫn đủ.
```

Con số record không phải yếu tố quyết định chính. Concurrency, deployment topology và operational requirements quan trọng hơn kích thước file.

---

## 10. PostgreSQL không thay thế Git source of truth

Ngay cả sau migration, đề xuất vẫn giữ:

```text
Git
= canonical package definitions, schemas, implementation, provenance source

PostgreSQL
= published projection, operational state, search index và collaborative workflow
```

Không nên cho phép database production trở thành nơi duy nhất chứa component definition mà repository không thể tái dựng.

Mô hình publish tương lai:

```text
Git merge
→ CI validation
→ package compiler
→ publish canonical version vào PostgreSQL
→ update search/vector indexes
→ notify director/runtime services
```

---

## 11. Làm sao tránh lock-in khi bắt đầu bằng SQLite

## 11.1 Repository interface

Không để director hoặc renderer gọi SQLite trực tiếp.

```ts
interface KnowledgeRepository {
  getTemplate(id: string): Promise<TemplateDefinition | null>;
  listTemplates(filter: TemplateFilter): Promise<TemplateDefinition[]>;
  searchTemplates(query: KnowledgeQuery): Promise<RankedTemplate[]>;
  getCompatibility(input: CompatibilityQuery): Promise<CompatibilityResult[]>;
  getProvenance(entityType: string, entityId: string): Promise<ProvenanceRecord[]>;
}
```

Implementations:

```text
JsonKnowledgeRepository
SQLiteKnowledgeRepository
PostgresKnowledgeRepository   // future
```

## 11.2 Stable IDs

Không dùng database auto-increment ID làm canonical identity.

Dùng:

```text
glitch-text
rgb-glitch-text
GlitchTextAdapter
rgb-tear-medium
```

## 11.3 Portable migrations

- giữ schema SQL đơn giản;
- tách JSON payload và frequently queried columns;
- tránh đặt business logic trong SQLite trigger;
- compatibility scoring nằm trong domain/application layer;
- vector retrieval nằm sau repository interface;
- giữ fixtures để chạy cùng test trên SQLite và PostgreSQL.

## 11.4 Rebuildability

Mọi row canonical trong database phải truy ngược được về:

- package path;
- package version;
- Git commit;
- content hash.

---

## 12. Đánh giá cuối cùng

| Tiêu chí | SQLite | PostgreSQL |
|---|---:|---:|
| Setup MVP | 9.5/10 | 5/10 |
| Local-first | 10/10 | 5.5/10 |
| Offline render/build | 10/10 | 6/10 |
| Metadata và FTS | 8.5/10 | 9/10 |
| Một writer, read-heavy | 9.5/10 | 8/10 |
| Concurrent writers | 5/10 | 9.5/10 |
| Multi-host deployment | 2/10 | 9.5/10 |
| Multi-user governance | 4/10 | 9/10 |
| Vector retrieval at scale | 5/10 | 9/10 với pgvector |
| Operational overhead | 9.5/10 | 5/10 |
| Phù hợp Lucida hiện tại | **9/10** | **5/10** |

Quyết định:

```text
MVP và component-library phase
→ SQLite

Collaborative/distributed knowledge platform phase
→ PostgreSQL
```

PostgreSQL là target hợp lý cho kiến trúc dài hạn, nhưng không phải prerequisite để xây component knowledge base có giá trị.

---

# 13. Next action cụ thể

## Action: xây `SQLite Knowledge Projection v0.1` sau pilot `glitch-text`

Thứ tự:

```text
1. Hoàn thành canonical package cho glitch-text
2. Compiler sinh generated/template-index.json
3. Thêm SQLite schema
4. Compiler ghi projection vào lucida-knowledge.db
5. Viết CLI query thử nghiệm
6. So sánh output JSON và SQLite
```

Files đề xuất:

```text
design/storage/sqlite-schema.sql
design/storage/README.md
scripts/build-knowledge-index.mjs
scripts/query-knowledge-index.mjs
scripts/validate-knowledge-index.mjs
tests/knowledge-index.test.mjs
.generated/lucida-knowledge.db
```

Acceptance criteria:

1. SQLite DB được tạo từ canonical Git packages, không nhập tay.
2. Xóa DB rồi build lại tạo cùng logical records.
3. Query `hook + code_explanation + low density` trả về `glitch-text`.
4. Query chỉ trả template có runtime implementation.
5. Provenance của `glitch-text` truy được source repo, commit và license.
6. FTS tìm được template theo `cyber`, `glitch`, `AI coding`.
7. Runtime render vẫn sử dụng generated JSON và không phụ thuộc database availability.
8. SQLite file được gitignore.
9. Không thêm embedding hoặc vector extension trong v0.1.
10. Repository interface không để domain logic phụ thuộc SQLite.

Definition of done:

```text
canonical Git package
→ validation passes
→ generated JSON
→ SQLite projection
→ deterministic query results
→ runtime remains offline and DB-independent
```

---

## 14. References

- SQLite: Appropriate Uses for SQLite — `https://www.sqlite.org/whentouse.html`
- SQLite: Write-Ahead Logging — `https://www.sqlite.org/wal.html`
- SQLite: FTS5 — `https://www.sqlite.org/fts5.html`
- SQLite: JSON Functions and Operators — `https://www.sqlite.org/json1.html`
- PostgreSQL: JSON Types — `https://www.postgresql.org/docs/current/datatype-json.html`
- PostgreSQL: Full Text Search — `https://www.postgresql.org/docs/current/textsearch.html`
- PostgreSQL: Concurrency Control — `https://www.postgresql.org/docs/current/mvcc.html`
- pgvector — `https://github.com/pgvector/pgvector`
