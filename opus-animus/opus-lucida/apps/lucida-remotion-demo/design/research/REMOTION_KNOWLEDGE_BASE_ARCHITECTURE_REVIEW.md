# Review kiến trúc Knowledge Base Remotion cho Lucida

> Phạm vi: `opus-animus/opus-lucida/apps/lucida-remotion-demo`
>
> Ngày review: 2026-07-12
>
> Loại tài liệu: current-state review + target knowledge model + immediate next action

---

## 1. Kết luận điều hành

Kiến trúc knowledge hiện tại của Lucida tốt ở cấp độ một nền tảng multimodal dài hạn: có observation, candidate, canonical entity, provenance, rights, versioning, hybrid retrieval và deterministic renderer boundary.

Tuy nhiên, kiến trúc đang nghiêng về một nền tảng Style–Motion–Asset–Embedding tổng quát, trong khi nhu cầu gần nhất của Lucida là xây một knowledge base giúp hệ thống:

1. biết component Remotion nào thực sự tồn tại;
2. biết adapter nào có thể render component đó;
3. biết preset nào tạo ra visual grammar khác biệt;
4. biết scene nào phù hợp với component;
5. biết component cần content và asset slot nào;
6. biết implementation đã qua validation hay mới chỉ nằm trong catalog.

Vì vậy, kiến trúc cần bổ sung một Remotion Component Domain làm cầu nối giữa:

```text
knowledge/
visual-library/
motion-library/
apps/remotion-templates/
src/templateRegistry.tsx
```

Kết luận chính:

> Lucida không thiếu catalog. Lucida thiếu một canonical knowledge model cho component renderable, adapter, preset, slot, compatibility và validation artifact.

---

## 2. Đánh giá tổng thể

| Khía cạnh | Đánh giá |
|---|---:|
| Observation → Candidate → Canonical lifecycle | 9/10 |
| Provenance, rights và versioning | 9/10 |
| Reference-video ingestion | 8.5/10 |
| Retrieval architecture dài hạn | 8/10 |
| Mô hình Style và Motion | 7.5/10 |
| Mô hình Remotion component | 5/10 |
| Khớp với runtime hiện tại | 4.5/10 |
| Mức phù hợp MVP | 5.5/10 |
| Tổng thể | 7/10 |

Kiến trúc không sai, nhưng thứ tự ưu tiên cần điều chỉnh.

---

## 3. Những phần nên giữ nguyên

### 3.1 Observation không được trở thành production knowledge trực tiếp

Luồng đúng:

```text
Raw observation
→ Candidate
→ Review
→ Validation render
→ Canonical entity
```

Điều này áp dụng cho cả media reference và source code từ repository bên ngoài.

Ví dụ với Remocn:

```text
Remocn source component
→ imported component candidate
→ Lucida adaptation
→ deterministic render test
→ visual QA
→ production component package
```

### 3.2 Structured specification là source of truth

LLM có thể:

- phân loại scene intent;
- đề xuất family, template và motion;
- giải thích lựa chọn;
- rerank các candidate gần nhau.

LLM không được:

- tự tạo arbitrary CSS trong production path;
- tự khai báo component không tồn tại;
- bỏ qua slot schema;
- sửa animation implementation trong lúc render;
- quyết định quyền sử dụng asset.

Production phải dựa trên ID đã đăng ký, schema được validate và implementation deterministic.

### 3.3 Evidence, license và provenance

Mỗi component hoặc preset nhập từ nguồn ngoài phải ghi:

```text
canonical repository
source commit
source files
license
copied or adapted code
Lucida modifications
review decision
validation artifact
```

Reference media chỉ là evidence; nó không tự động trở thành production asset.

### 3.4 Hybrid retrieval

Retrieval đúng nên là:

```text
hard filters
→ metadata / lexical retrieval
→ optional vector retrieval
→ compatibility scoring
→ contextual reranking
→ continuity optimization
```

Vector similarity chỉ tạo candidate, không phải decision engine.

---

## 4. Gap lớn nhất: chưa có Remotion Component Domain

Knowledge Architecture hiện có các domain chính:

```text
Style
Motion
Asset
Evidence
Brand
Scene Intent
Taxonomy
Prompt
Compatibility
```

Nhưng còn thiếu các entity trực tiếp điều khiển renderer:

```text
ComponentPrimitive
SceneAdapter
TemplateDefinition
TemplatePreset
ContentSchema
AssetSlotSchema
TransitionDefinition
RendererCapability
ValidationArtifact
```

### 4.1 Phân biệt các khái niệm

```text
Visual Style
≠ Component
≠ Scene Template
≠ Motion Preset
```

Ví dụ:

```text
VisualFamily:
cinematic-hook

ComponentPrimitive:
rgb-glitch-text

SceneAdapter:
GlitchTextAdapter

TemplateDefinition:
cyber-glitch-hook

TemplatePreset:
rgb-tear-medium

MotionPreset:
glitch-impact-reveal
```

Nếu không tách các khái niệm này, catalog sẽ tiếp tục phình to nhưng runtime behavior không thay đổi.

---

## 5. Current source-of-truth đang bị phân mảnh

Knowledge liên quan template hiện nằm ở nhiều nơi:

```text
design/visual-library/index.json
design/motion-library/index.json
design/directors/selection-rules.json
apps/remotion-templates/template-catalog.json
src/template-registry-map.json
src/templateRegistry.tsx
```

### 5.1 Visual library

Visual library mô tả:

- family;
- bestFor;
- preferredTemplates;
- background effects;
- density;
- usage notes.

Đây là dữ liệu tốt cho director nhưng chưa đủ cho renderer.

### 5.2 Motion library

Motion library hiện có tên preset, token và mô tả, nhưng phần lớn chưa có:

- parameter schema;
- implementation reference;
- duration range;
- reduced-motion implementation;
- deterministic test;
- render-cost measurement.

### 5.3 Template catalog

Template catalog biết:

- template ID;
- source file;
- role;
- bestFor;
- required content;
- density;
- supportsAssets.

Nhưng chưa biết:

- adapter nào render template;
- preset nào được dùng;
- implementation status;
- asset slots;
- aspect-ratio support;
- safe-area support;
- QA status;
- provenance;
- render cost.

### 5.4 Runtime registry

Runtime registry hiện chỉ mô tả:

```text
templateId → adapterName
```

Ví dụ nhiều template khác nhau vẫn trỏ về `HeroTitleAdapter` hoặc `AnimatedListAdapter`. Vì vậy knowledge layer có thể mô tả visual behavior phong phú nhưng runtime lại render cùng một grammar.

---

## 6. Kiến trúc canonical registry đề xuất

Không nên duy trì thủ công nhiều index song song.

Mỗi production template nên có một canonical package:

```text
design/
└── template-library/
    └── <template-id>/
        ├── template.json
        ├── content.schema.json
        ├── slots.schema.json
        ├── provenance.json
        ├── fixtures/
        └── previews/
```

Ví dụ:

```json
{
  "id": "cyber-glitch-hook",
  "version": "1.0.0",
  "status": "stable",
  "familyId": "cinematic-hook",
  "adapterId": "GlitchTextAdapter",
  "presetId": "rgb-tear-medium",
  "intents": ["hook", "problem", "code_explanation"],
  "capabilities": {
    "density": ["low"],
    "safeAreas": ["tiktok", "reels", "youtube_shorts"],
    "aspectRatios": ["9:16"],
    "supportsAssets": false
  },
  "contentSchema": "./content.schema.json",
  "slotSchema": "./slots.schema.json",
  "render": {
    "implementation": "src/templates/adapters/GlitchTextAdapter.tsx",
    "cost": "low",
    "deterministic": true
  },
  "qa": {
    "vietnameseOverflow": "passed",
    "safeArea": "passed",
    "determinism": "passed",
    "preview": "previews/9x16.mp4"
  }
}
```

Từ canonical package, build script sinh các index:

```text
generated/template-index.json
generated/adapter-index.json
generated/director-index.json
generated/compatibility-index.json
```

Director và renderer phải đọc dữ liệu sinh từ cùng một nguồn.

---

## 7. Bốn loại dữ liệu cần tách rõ

### 7.1 Canonical design knowledge

Dữ liệu versioned, review bằng Git:

- Brand;
- Taxonomy;
- VisualFamily;
- ComponentPrimitive;
- SceneAdapter;
- TemplateDefinition;
- TemplatePreset;
- MotionPreset;
- TransitionDefinition;
- CompatibilityRule;
- SlotSchema;
- validation status.

### 7.2 Evidence knowledge

Dữ liệu chứng minh canonical knowledge đến từ đâu:

- source manifest;
- commit hoặc media frame range;
- observed/inferred values;
- confidence;
- license;
- copied/adapted files;
- reviewer decision.

### 7.3 Project runtime data

Không phải canonical KB:

- script;
- timed transcript;
- caption words;
- project assets;
- scene durations;
- `video-map.json`;
- render props;
- output report.

### 7.4 Derived search index

Dữ liệu có thể tái sinh:

- flattened JSON;
- SQLite index;
- FTS/BM25;
- embeddings;
- thumbnails;
- feature vectors.

Vector database không phải source of truth.

---

## 8. Storage strategy cho MVP

Knowledge Architecture hiện mô tả PostgreSQL, pgvector, object storage và job queue. Đây là kiến trúc hợp lý khi hệ thống đã có quy mô lớn.

Ở MVP component knowledge base, đề xuất:

```text
Git
= canonical packages, schemas, code, provenance

Local filesystem hoặc object folder
= previews, validation renders, evidence media

Generated JSON
= director và runtime indexes

SQLite
= optional local metadata/search cache

Embedding/vector store
= triển khai sau
```

Không nên đưa PostgreSQL hoặc LanceDB vào trước khi:

- component model ổn định;
- runtime thực sự consume canonical registry;
- asset slot binding hoạt động;
- số package đủ lớn để metadata search không còn hiệu quả.

---

## 9. Cần hai ingestion pipeline riêng

### 9.1 Media reference ingestion

Dùng cho video, screenshot và animation reference:

```text
media source
→ manifest
→ shots / frames
→ visual observation
→ motion observation
→ candidate
→ validation render
→ review
```

### 9.2 Component repository ingestion

Dùng cho Remocn, React Video Editor templates và transition repository:

```text
repository
→ source manifest
→ commit pin
→ license audit
→ component discovery
→ props extraction
→ dependency audit
→ timeline/local-frame audit
→ deterministic audit
→ Lucida wrapper or adapter
→ preview render
→ candidate package
→ review
→ publish
```

Ví dụ component-source manifest:

```json
{
  "sourceType": "code_repository",
  "repo": "Remocn/remocn",
  "commit": "<pinned-sha>",
  "license": "MIT",
  "component": {
    "upstreamId": "rgb-glitch-text",
    "sourceFiles": [
      "registry/remocn/rgb-glitch-text/index.tsx"
    ]
  },
  "audit": {
    "usesCurrentFrame": true,
    "expectsSequenceLocalFrame": true,
    "randomness": "seeded",
    "browserOnlyApis": [],
    "externalDependencies": []
  },
  "adaptation": {
    "lucidaPrimitiveId": "rgb-glitch-text",
    "adapterId": "GlitchTextAdapter",
    "modified": true
  }
}
```

---

## 10. Validation cần nâng từ ID validation lên capability validation

Validator hiện chủ yếu kiểm tra:

- ID tồn tại;
- source file tồn tại;
- adapter được hỗ trợ;
- required content field có mặt;
- duration hợp lệ.

Cần bổ sung validation cho:

```text
template ↔ adapter capability
template ↔ scene intent
template ↔ content schema
template ↔ motion compatibility
template ↔ transition compatibility
template ↔ asset slots
template ↔ aspect ratio
template ↔ safe area
template ↔ Vietnamese text capacity
component ↔ local-frame behavior
component ↔ deterministic rendering
```

Một template chỉ được đánh dấu `stable` khi có validation artifact cho tất cả capability mà nó khai báo.

---

## 11. Retrieval MVP không cần embedding

Thứ tự lựa chọn template nên là:

```text
1. Scene intent hard filter
2. Runtime implementation available
3. Content schema fit
4. Asset slot availability
5. Density and text-capacity fit
6. Safe-area and aspect-ratio fit
7. Brand compatibility
8. Motion compatibility
9. Transition compatibility
10. Neighboring-scene continuity
11. Rendering cost
12. Weighted ranking
```

Semantic fit ban đầu có thể dùng:

- normalized taxonomy;
- exact intent mapping;
- tags;
- lexical overlap;
- content requirements.

Embedding chỉ cần thiết khi catalog đủ lớn và metadata không còn phân biệt tốt candidate.

---

## 12. Target architecture

```text
                    SOURCES
          code repositories / media / docs
                         │
          ┌──────────────┴──────────────┐
          │                             │
 Code Repository Ingestion    Media Reference Ingestion
          │                             │
          └──────────────┬──────────────┘
                         ▼
              EVIDENCE & CANDIDATES
          observations / rights / review
                         │
                         ▼
               CANONICAL KNOWLEDGE
          Brand / Taxonomy / VisualFamily
          ComponentPrimitive / SceneAdapter
          TemplateDefinition / MotionPreset
          TransitionDefinition / SlotSchema
          CompatibilityRule
                         │
                         ▼
                 KNOWLEDGE COMPILER
          schema validation / relationship checks
                         │
                         ▼
                  GENERATED INDEXES
          director / renderer / compatibility
                         │
                         ▼
                    STYLE DIRECTOR
          filter / score / continuity / reason
                         │
                         ▼
                SceneSpec / video-map
                         │
                         ▼
                 REMOTION RENDERER
          adapter + preset + resolved slots
```

---

## 13. Kiến trúc quyết định cuối cùng

| Nội dung | Quyết định |
|---|---|
| Unified knowledge platform | Giữ |
| Observation → Candidate → Canonical | Giữ |
| Provenance, rights và versioning | Giữ |
| Deterministic renderer boundary | Giữ |
| Hybrid retrieval | Giữ, triển khai sau |
| PostgreSQL + pgvector cho component MVP | Hoãn |
| Remotion Component Domain | Bổ sung ngay |
| Canonical package + generated index | Bổ sung ngay |
| Template slot schema | Bổ sung ngay |
| Component repository ingestion | Bổ sung ngay |
| Media reference ingestion | Giữ, triển khai sau component pilot |
| Asset embedding/vector retrieval | Ưu tiên thấp |

---

# 14. Next action cụ thể

## Action: tạo `Remotion Component Knowledge Model v0.1` và migrate một template pilot

### Mục tiêu

Tạo source of truth đầu tiên cho một template renderable và chứng minh rằng knowledge package có thể sinh runtime registry entry mà không phải duy trì mapping thủ công.

### Pilot template

```text
glitch-text
```

Lý do chọn:

- hiện đang map sai về `HeroTitleAdapter`;
- có implementation upstream rõ ràng;
- không phụ thuộc asset;
- dễ kiểm tra khác biệt visual;
- phù hợp với video AI/coding;
- có thể kiểm tra local-frame và deterministic behavior.

### Files cần tạo

```text
design/schemas/component-primitive.schema.json
design/schemas/template-definition.schema.json
design/schemas/template-slot.schema.json

design/template-library/glitch-text/template.json
design/template-library/glitch-text/content.schema.json
design/template-library/glitch-text/slots.schema.json
design/template-library/glitch-text/provenance.json
design/template-library/glitch-text/fixtures/valid.json
design/template-library/glitch-text/fixtures/invalid.json

src/templates/adapters/GlitchTextAdapter.tsx
scripts/compile-template-knowledge.mjs
scripts/validate-template-knowledge.mjs
```

### Thay đổi runtime

Thay mapping hiện tại:

```json
{
  "glitch-text": "HeroTitleAdapter"
}
```

bằng generated definition:

```json
{
  "glitch-text": {
    "adapterId": "GlitchTextAdapter",
    "presetId": "rgb-tear-medium",
    "familyId": "cinematic-hook",
    "status": "experimental"
  }
}
```

### Acceptance criteria

1. `glitch-text` không còn dùng `HeroTitleAdapter`.
2. Template package pass JSON Schema validation.
3. Knowledge compiler tạo được runtime registry entry.
4. Adapter dùng local scene frame hoặc chạy trong scene-local Sequence.
5. Hai render với cùng input tạo cùng frame output.
6. Có preview 9:16 với text tiếng Việt có dấu.
7. Safe area không bị vi phạm.
8. Provenance ghi rõ repository, commit, license và file nguồn.
9. Template status chỉ là `experimental` cho đến khi QA hoàn tất.
10. Không thêm PostgreSQL, embedding hoặc vector store trong action này.

### Definition of done

```text
canonical template package
→ schema validation passes
→ generated runtime index
→ GlitchTextAdapter resolved
→ 9:16 preview rendered
→ deterministic and Vietnamese text QA passes
```

Sau pilot này, cùng pattern có thể áp dụng lần lượt cho:

```text
Glass Code Block
Terminal Simulator
Code Diff Wipe
Per Character Rise
```
