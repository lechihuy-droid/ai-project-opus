# Đánh giá Local Asset Retrieval và các khoảng trống kiến trúc của Lucida

> Phạm vi tài liệu: chỉ giữ phần đánh giá `Transformers.js`, `LanceDB`, local asset retrieval và phân tích các gap hiện tại của `lucida-remotion-demo`.
>
> Vị trí áp dụng: `opus-animus/opus-lucida/apps/lucida-remotion-demo`
>
> Trạng thái: architecture review, chưa phải implementation specification.

---

# 1. Đánh giá Transformers.js, LanceDB và Local Asset Retrieval

## 1.1 Mục tiêu kiến trúc

Mục tiêu của tầng này không phải chỉ là tìm video có từ khóa giống kịch bản. Mục tiêu đúng là xây dựng một **Visual Asset Retrieval Layer** có khả năng chọn tài nguyên phù hợp với chức năng kể chuyện của từng scene.

Pipeline đề xuất:

```text
Script / scene content
→ Visual Intent Extraction
→ Metadata and Tag Filtering
→ Semantic Embedding Search
→ Narrative and Continuity Reranking
→ Selected Local Asset
```

Asset retrieval chỉ nên là một tầng hỗ trợ cho visual planner. Nó không nên thay thế việc xác định scene intent, representation và narrative function.

---

## 1.2 Transformers.js

`@huggingface/transformers` phù hợp để chạy embedding cục bộ trong môi trường Node.js hoặc TypeScript mà không cần một inference server riêng.

### Ưu điểm

- Có thể chạy local sau khi model đã được tải.
- Không cần gọi LLM hoặc embedding API cho mỗi scene.
- Dễ tích hợp vào pipeline Node.js hiện tại của Lucida.
- Phù hợp để semantic search trên metadata, tag và mô tả asset.
- Giảm độ trễ mạng và tăng khả năng tái lập pipeline.

### Vai trò phù hợp

Embedding nên được dùng để:

- mở rộng truy vấn ngữ nghĩa;
- tìm asset khác từ nhưng gần nghĩa;
- rerank candidate sau khi đã lọc metadata;
- tìm kiếm trong thư viện asset lớn hơn khả năng exact keyword matching.

Ví dụ:

```text
programmer ↔ coding
server infrastructure ↔ data center
agent memory ↔ context storage
software dependency ↔ architecture graph
```

### Giới hạn

Embedding không nên là tầng quyết định cuối cùng.

Một asset có semantic similarity cao vẫn có thể sai về:

- scene intent;
- visual representation;
- mood;
- aspect ratio;
- narrative function;
- continuity với scene trước và sau.

Ví dụ, với câu:

> Agent bị mắc kẹt giữa quá nhiều context.

Semantic search có thể trả về:

- programmer nhìn nhiều màn hình;
- robot AI;
- server room;
- code chạy trên terminal.

Trong khi visual phù hợp hơn có thể là:

- context blocks chồng lên nhau;
- memory window bị đầy;
- diagram thể hiện bottleneck;
- nhiều luồng dữ liệu cùng đổ vào một agent.

### Lưu ý về tiếng Việt

Lucida xử lý script tiếng Việt, nên không nên mặc định dùng một embedding model tối ưu chủ yếu cho tiếng Anh làm lựa chọn production.

Nên đánh giá ba hướng:

```text
A. Multilingual embedding model
B. Vietnamese → canonical English visual concepts
C. Hybrid: metadata/tag filter + multilingual embedding rerank
```

Hướng C phù hợp nhất cho MVP vì dễ kiểm soát, giải thích được kết quả và không phụ thuộc hoàn toàn vào model.

---

## 1.3 LanceDB

LanceDB phù hợp khi thư viện asset local đã đủ lớn và cần semantic retrieval kết hợp metadata filtering.

### Dữ liệu có thể lưu

```text
embedding
local path
asset type
orientation
resolution
duration
fps
tags
visual style
quality score
reuse count
source/provenance
embedding version
```

Ví dụ asset record:

```json
{
  "id": "asset-043",
  "localPath": "assets/normalized/asset-043.mp4",
  "type": "video",
  "orientation": "vertical",
  "width": 1080,
  "height": 1920,
  "durationSec": 8.2,
  "fps": 30,
  "tags": ["source code", "dependency graph"],
  "visualStyle": ["technical", "dark"],
  "qualityScore": 0.91,
  "reuseCount": 1,
  "embeddingVersion": "multilingual-v1"
}
```

### Khi nào LanceDB có giá trị

LanceDB bắt đầu hợp lý khi:

- số asset tăng đáng kể;
- cần incremental indexing;
- cần filter theo metadata trước hoặc sau vector search;
- cần nhiều embedding version;
- cần kết hợp nhiều loại asset trong cùng một index;
- JSON hoặc in-memory search bắt đầu khó bảo trì.

### Khi nào chưa cần

Ở giai đoạn MVP, LanceDB chưa mang lại nhiều giá trị nếu:

- asset còn ít;
- metadata chưa chuẩn hóa;
- chưa có thumbnail index;
- chưa có quality score;
- chưa có visual-intent contract;
- chưa có logic tránh lặp lại asset.

Nếu thư viện dưới vài nghìn asset, JSON hoặc SQLite kết hợp cosine search trong memory có thể đơn giản và dễ bảo trì hơn.

### Kết luận

LanceDB là một implementation option tốt, nhưng không nên trở thành dependency bắt buộc của kiến trúc.

Nên abstract retrieval interface:

```ts
interface AssetIndex {
  upsert(asset: IndexedAsset): Promise<void>;
  search(query: AssetQuery): Promise<AssetCandidate[]>;
}
```

Các implementation có thể gồm:

```text
JsonAssetIndex
SqliteAssetIndex
LanceDbAssetIndex
```

---

## 1.4 Local Asset Retrieval

Tầng retrieval nên hoạt động theo nhiều bước thay vì chỉ chạy vector similarity.

```text
Hard Filter
→ Tag and Category Match
→ Semantic Search
→ Visual Intent Scoring
→ Continuity Scoring
→ Reuse Penalty
→ Final Selection
```

### Hard filter

Hard filter nên loại candidate không đạt các điều kiện bắt buộc:

- aspect ratio không phù hợp;
- resolution thấp;
- codec không hỗ trợ;
- duration quá ngắn hoặc quá dài;
- asset không tồn tại local;
- source hoặc license không hợp lệ;
- asset đã bị đánh dấu quality thấp.

### Semantic search

Embedding chỉ nên tìm top candidate gần nghĩa sau khi hard filter.

### Visual intent scoring

Mỗi scene cần mô tả rõ:

```text
subject
scene intent
visual representation
narrative function
mood
asset preference
```

Ví dụ:

```json
{
  "subject": "AI agent context",
  "sceneIntent": "problem",
  "visualFunction": "explain bottleneck",
  "representation": "diagram",
  "mood": "overloaded",
  "assetPreference": [
    "native_diagram",
    "motion_graphic",
    "local_video"
  ]
}
```

### Continuity scoring

Asset tốt riêng lẻ chưa chắc tốt trong toàn video. Hệ thống cần tính thêm:

- sự liên tục về palette;
- sự liên tục về visual family;
- mức độ thay đổi giữa hai scene;
- asset đã được dùng gần đây hay chưa;
- scene trước và scene sau sử dụng representation gì.

### Scoring đề xuất

```text
candidate score =
  0.30 semantic similarity
+ 0.20 visual-intent compatibility
+ 0.15 orientation and crop fit
+ 0.10 duration fit
+ 0.10 continuity
+ 0.05 quality
+ 0.05 source reliability
- 0.05 reuse penalty
```

Các trọng số phải được xem là cấu hình ban đầu, không phải giá trị cố định.

---

## 1.5 Thứ tự ưu tiên visual

Đối với nội dung AI, coding và system architecture, local asset retrieval không nên mặc định trả về stock footage.

Thứ tự phù hợp hơn:

```text
1. Native Remotion diagram
2. Native Lucida component
3. Code / terminal / UI simulation
4. Product screenshot hoặc technical asset thật
5. Local video asset
6. Generic abstract background
```

Local video phù hợp với:

- establishing shot;
- office context;
- human reaction;
- hardware hoặc server context;
- cinematic breathing moment;
- transition texture.

Không nên dùng generic footage thay cho:

- architecture explanation;
- system flow;
- agent interaction;
- code dependency;
- data pipeline;
- model comparison.

---

# 2. Phân tích Gap hiện tại của Lucida

Lucida đã có nền tảng render, scene contract và template registry, nhưng vẫn tồn tại các gap kiến trúc ảnh hưởng trực tiếp đến chất lượng video.

## 2.1 Audio chưa phải trung tâm của timeline

Pipeline hiện tại gần với:

```text
Script
→ video-map.json
→ Remotion render
```

Pipeline mục tiêu nên là:

```text
Script
→ Voice / TTS
→ Word timestamps
→ Narrative beats
→ Scene timing
→ Visual mapping
→ video-map.json
→ Remotion render
```

Scene duration hiện vẫn chủ yếu do planner hoặc AI ước lượng. Điều này làm scene pacing không bám chính xác narration.

### Hướng khắc phục

Bổ sung audio contract:

```json
{
  "audio": {
    "src": "audio/voice.wav",
    "durationSec": 48.72,
    "sampleRate": 48000,
    "targetLufs": -14,
    "truePeakDb": -1
  }
}
```

Scene nên có `startMs` và `endMs`, thay vì chỉ có `durationSec`.

---

## 2.2 Caption chưa đồng bộ theo timestamp

Caption hiện được phân bổ theo:

- số caption group;
- số từ trong group;
- thời lượng scene.

Đây là linear timing, không phản ánh lúc từ thực sự được phát âm.

Kết quả là subtitle có thể đúng style nhưng sai nhịp.

### Hướng khắc phục

```text
Whisper / WhisperX / alignment output
→ word timestamps
→ caption groups
→ active-word animation
```

Contract đề xuất:

```json
{
  "captions": [
    {
      "id": "caption-001",
      "startMs": 420,
      "endMs": 2380,
      "text": "Bạn muốn nhìn thấu cách AI hoạt động?",
      "words": [
        {"text": "Bạn", "startMs": 420, "endMs": 620},
        {"text": "muốn", "startMs": 630, "endMs": 840},
        {"text": "nhìn", "startMs": 850, "endMs": 1040}
      ]
    }
  ]
}
```

Caption renderer chỉ nên chuyển câu khi `endMs` của group đã kết thúc.

---

## 2.3 Template Catalog và Adapter chưa tách rõ

Hiện Lucida có nhiều `templateId`, nhưng một số template khác tên vẫn map về cùng một adapter.

Điều này tạo ra catalog lớn về tên nhưng ít visual grammar thực tế.

Cần tách rõ:

```text
Adapter
= React rendering implementation

Preset
= motion and style parameters

Template
= adapter + preset + supported intents
```

Ví dụ:

```json
{
  "templateId": "cyber-glitch-hook",
  "adapterId": "glitch-text",
  "presetId": "rgb-scanline-heavy",
  "supportedIntents": ["hook", "problem"]
}
```

Một adapter có thể dùng nhiều preset, nhưng các preset phải tạo khác biệt motion hoặc style thực sự.

---

## 2.4 Asset Retrieval chưa tồn tại như một architecture layer

Lucida hiện có `assets` trong contract, nhưng chưa có một tầng retrieval hoàn chỉnh để:

- hiểu visual intent;
- truy vấn local asset library;
- chấm điểm candidate;
- chọn asset;
- ghi lại lý do lựa chọn;
- áp dụng continuity và reuse penalty.

Pipeline mục tiêu:

```text
Scene content
→ Visual Intent Contract
→ Asset Retrieval
→ Candidate Ranking
→ Selected Asset
→ video-map.json
```

Asset selection nên ưu tiên:

```text
Native diagram
→ Native component
→ Local technical asset
→ Local video
```

Embedding chỉ là một bước trong retrieval, không phải toàn bộ retrieval engine.

---

## 2.5 Thiếu asset metadata contract

Nếu chưa có metadata chuẩn, Transformers.js hoặc LanceDB sẽ không tạo ra retrieval tốt.

Metadata tối thiểu cần có:

```json
{
  "id": "asset-043",
  "localPath": "assets/normalized/asset-043.mp4",
  "type": "video",
  "orientation": "vertical",
  "width": 1080,
  "height": 1920,
  "durationSec": 8.2,
  "fps": 30,
  "tags": ["dependency graph", "source code"],
  "representation": "technical_visual",
  "mood": "focused",
  "visualStyle": ["dark", "editorial"],
  "qualityScore": 0.91,
  "reuseCount": 1,
  "source": {
    "type": "local",
    "provenance": "internal-library"
  }
}
```

Metadata contract phải được xây trước vector database.

---

## 2.6 Thiếu import governance

Khi đưa component hoặc asset từ nguồn ngoài vào Lucida, cần lưu:

- source repository;
- source commit;
- license;
- import date;
- file đã sửa;
- adapter tương ứng;
- benchmark render;
- visual QA status.

Ví dụ:

```json
{
  "componentId": "rgb-glitch-text",
  "source": {
    "repository": "example/remotion-library",
    "commit": "abc123",
    "license": "MIT"
  },
  "lucida": {
    "adapter": "GlitchTextAdapter",
    "importedAt": "2026-07-12",
    "modified": true,
    "qaStatus": "passed"
  }
}
```

Điều này giúp tránh source drift, license ambiguity và component không được kiểm soát.

---

## 2.7 Thiếu retrieval observability

Hệ thống cần giải thích được vì sao asset được chọn.

Mỗi kết quả nên ghi:

```json
{
  "selectedAssetId": "asset-043",
  "query": [
    "AI code analysis",
    "dependency graph",
    "software architecture"
  ],
  "score": {
    "semantic": 0.83,
    "visualIntent": 0.91,
    "orientation": 1.0,
    "continuity": 0.72,
    "quality": 0.91,
    "reusePenalty": 0.05
  },
  "reason": "Best technical-diagram candidate for a problem scene explaining hidden dependencies."
}
```

Không có observability, việc debug asset mapping sẽ rất khó và AI dễ tạo ra lựa chọn không nhất quán.

---

# 3. Kiến trúc mục tiêu

```text
Script
→ TTS / voice generation
→ Word timestamp alignment
→ Scene and narrative beat planning
→ Visual Intent Contract
→ Template selection
→ Local Asset Retrieval
   ├── metadata filter
   ├── tags
   ├── optional embeddings
   ├── continuity rerank
   └── reuse penalty
→ video-map.json
→ schema validation
→ user approval gate
→ Remotion render
→ visual QA + audio-sync QA
```

---

# 4. Thứ tự triển khai đề xuất

## P0 — Audio timeline

```text
- Render audio trong Composition
- Chuẩn hóa audio metadata
- Sinh scene range từ narration thật
```

## P1 — Timestamp caption

```text
- Import word timestamps
- Caption group có start/end time
- Active word bám timestamp
```

## P2 — Template architecture

```text
- Tách Adapter / Preset / Template
- Giảm alias không có khác biệt thực
- Bổ sung capability metadata
```

## P3 — Asset metadata

```text
- Xây local asset manifest
- Sinh thumbnail
- Chuẩn hóa resolution, duration, tags và quality score
```

## P4 — Rule-based retrieval MVP

```text
- Hard filter
- Tag matching
- Visual-intent scoring
- Continuity và reuse penalty
- JSON hoặc SQLite index
```

## P5 — Semantic retrieval

```text
- Transformers.js embeddings
- Multilingual model evaluation
- Semantic reranking
```

## P6 — Vector database

```text
- Đánh giá nhu cầu LanceDB
- Migrate index khi asset library đủ lớn
- Giữ AssetIndex abstraction để tránh khóa implementation
```

---

# 5. Kết luận

Transformers.js và LanceDB là hướng phù hợp cho local semantic retrieval, nhưng chưa phải điểm cần triển khai đầu tiên.

Thứ tự đúng cho Lucida là:

```text
Audio timeline
→ Timestamp caption
→ Template architecture
→ Asset metadata
→ Rule-based retrieval
→ Transformers.js
→ LanceDB
```

Điểm cần giữ vững:

- **audio-first**: timeline phải xuất phát từ narration thật;
- **contract-first**: scene, caption, asset và retrieval result đều phải có contract rõ ràng;
- **local-first**: model, asset index và render ưu tiên chạy local;
- **visual-intent-first**: semantic similarity chỉ là tín hiệu hỗ trợ, không phải quyết định cuối cùng;
- **observable retrieval**: mọi asset selection phải giải thích và kiểm tra được.
