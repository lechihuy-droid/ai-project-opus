# Nghiên cứu kiến trúc hệ thống tự động hóa video ngắn Local Remotion + AI

> Phạm vi tài liệu: chỉ giữ các phần tham khảo từ repository mã nguồn mở và kiến trúc local-first. Các nội dung về stock-video API đã được loại khỏi phần đánh giá kiến trúc.
>
> Vị trí áp dụng: `opus-animus/opus-lucida/apps/lucida-remotion-demo`
>
> Trạng thái: research + architecture review, chưa phải implementation specification.

---

## Phần I — Báo cáo nghiên cứu gốc đã chuẩn hóa

## 1. Bối cảnh

Sự phát triển mạnh của YouTube Shorts, Instagram Reels và TikTok thúc đẩy nhu cầu tự động hóa quy trình sản xuất video ngắn. Việc chuyển từ kịch bản văn bản thô sang video hoàn chỉnh đòi hỏi sự phối hợp giữa:

- phân tích kịch bản;
- chia scene;
- đồ họa động;
- chuyển cảnh;
- xử lý âm thanh;
- subtitle;
- lựa chọn tài nguyên hình ảnh;
- render và QA.

Remotion chạy trên Node.js và cho phép định nghĩa video bằng React component. Kiến trúc local-first có thể giảm phụ thuộc vào dịch vụ cloud, tăng khả năng kiểm soát source code, bảo mật dữ liệu và tính tái lập của quá trình render.

Mục tiêu nghiên cứu gồm:

1. Tìm các repository cung cấp component, transition và visual effect có thể tích hợp vào Remotion.
2. Xây cơ chế local asset mapping từ nội dung kịch bản sang tài nguyên hình ảnh.
3. Đề xuất kiến trúc cho hệ thống sản xuất video ngắn chạy chủ yếu trên máy local.

---

## 2. Repository component và visual effect cho Remotion

### 2.1 `kapishdima/remocn`

`remocn` áp dụng mô hình tương tự `shadcn/ui`: component được copy trực tiếp vào source tree của project thay vì trở thành một runtime dependency đóng kín.

Các nhóm component phù hợp với video công nghệ gồm:

- kinetic typography;
- animated text;
- code block;
- terminal simulation;
- glitch effect;
- animated background;
- transition;
- charts;
- AI-interface scene;
- process-flow scene.

Ưu điểm kiến trúc:

- project sở hữu source code sau khi import;
- dễ tùy biến theme, typography và motion;
- giảm phụ thuộc runtime;
- dễ kiểm soát performance và determinism;
- phù hợp với mô hình component registry nội bộ.

Rủi ro:

- import quá nhiều component có thể làm catalog phình to;
- component không được chuẩn hóa có thể tạo style không nhất quán;
- cần kiểm tra license, provenance, safe-area và render performance.

### 2.2 `reactvideoeditor/remotion-templates`

Repository này cung cấp một catalog lớn các template React/Remotion cho nhiều nhóm visual:

- text animation;
- chart;
- counter;
- background effect;
- cinematic scene;
- transition;
- content animation.

Giá trị chính của repository nằm ở:

- reference implementation;
- visual benchmark;
- source preset;
- test fixture;
- nguồn ý tưởng để xây adapter nội bộ.

Không nên mặc định coi mỗi tên template là một implementation độc lập. Nhiều template có thể dùng chung một visual grammar và chỉ khác preset motion hoặc style.

### 2.3 `Ashad001/remotion-transitions`

Repository tập trung vào custom transition, đặc biệt các pattern dựa trên `TransitionPresentation`, interpolation, stagger và spring physics.

Giá trị kiến trúc:

- tham khảo công thức transition;
- hiểu cách phối hợp outgoing scene và incoming scene;
- xây transition registry;
- tách transition khỏi scene rendering;
- hỗ trợ scene overlap thay cho overlay giả lập.

Nên ưu tiên triển khai transition nội bộ dựa trên API chuẩn của Remotion, thay vì khóa hệ thống vào một package bên ngoài.

---

## 3. Kiến trúc ánh xạ asset cục bộ

Báo cáo gốc đề xuất pipeline lai chạy cục bộ:

```text
Script text
→ lightweight NLP keyword extraction
→ local text embedding
→ vector search
→ asset candidate ranking
→ selected local asset
```

### 3.1 Trích xuất keyword cục bộ

Một bước NLP nhẹ có thể:

- chuẩn hóa Unicode;
- loại stopword;
- phát hiện danh từ và thực thể;
- chuyển từ tiếng Việt sang canonical visual concepts;
- tạo positive và negative visual keywords.

Ví dụ:

```json
{
  "sourceText": "AI đọc toàn bộ codebase và phát hiện dependency ẩn",
  "visualConcepts": [
    "artificial intelligence",
    "source code",
    "dependency graph",
    "software architecture"
  ],
  "negativeConcepts": [
    "generic robot face",
    "generic business meeting"
  ]
}
```

### 3.2 Embedding cục bộ bằng Transformers.js

`@huggingface/transformers` có thể chạy model embedding trong môi trường JavaScript/Node.js mà không cần inference server riêng.

Embedding giúp xử lý các trường hợp khác chữ nhưng gần nghĩa, ví dụ:

```text
programmer ↔ coding
server infrastructure ↔ data center
agent memory ↔ context storage
```

Tuy nhiên, model embedding phải được đánh giá với tiếng Việt hoặc pipeline đa ngôn ngữ. Một model tối ưu cho tiếng Anh không nên được mặc định dùng làm lựa chọn production cho script tiếng Việt.

### 3.3 Local vector store bằng LanceDB

LanceDB có thể đóng vai trò local vector index lưu trên disk và hỗ trợ:

- vector search;
- metadata filtering;
- incremental indexing;
- embedded/in-process retrieval.

Asset record có thể gồm:

```json
{
  "id": "asset-043",
  "localPath": "assets/normalized/asset-043.mp4",
  "type": "video",
  "orientation": "vertical",
  "durationSec": 8.2,
  "tags": ["source code", "dependency graph"],
  "visualStyle": ["technical", "dark"],
  "qualityScore": 0.91,
  "embeddingVersion": "multilingual-v1"
}
```

Khi số asset còn nhỏ, JSON hoặc SQLite kết hợp cosine search trong memory có thể đủ. Vector database chỉ nên được đưa vào khi quy mô và nhu cầu filtering thực sự yêu cầu.

---

## 4. Kiến trúc local-first tổng quát trong báo cáo gốc

```text
Raw script
→ script analysis
→ local NLP extraction
→ local semantic retrieval
→ Remotion scene composition
→ local render
→ local QA
→ final short video
```

Mục tiêu local-first:

- source code nằm trong repository;
- asset được cache local;
- render deterministic;
- giảm cloud dependency;
- bảo mật script và media;
- kiểm soát version component;
- tái tạo được cùng output từ cùng input.

Tuy nhiên, “local-first” không đồng nghĩa tuyệt đối với “offline”. Một số bước ingest hoặc cập nhật model có thể vẫn cần internet. Sau khi asset và model đã có trong local workspace, pipeline chính mới có thể chạy offline.

---

# Phần II — Đánh giá kiến trúc và khuyến nghị cho Lucida

## 5. Kết luận kiến trúc

Báo cáo đúng ở ba hướng:

1. Lucida cần một thư viện component Remotion nội bộ.
2. Lucida cần transition system thực, thay vì chỉ có overlay cuối scene.
3. Lucida nên có local asset index để tái sử dụng tài nguyên.

Tuy nhiên, roadmap trong báo cáo chưa ưu tiên đúng bottleneck hiện tại của `lucida-remotion-demo`.

Thứ tự đúng phải là:

```text
Audio/TTS
→ word timestamps
→ caption sync
→ scene timing
→ adapter/template architecture
→ transition system
→ local asset metadata
→ semantic retrieval
→ vector database
```

Không nên xây asset vector retrieval trước khi audio timeline và scene contract đã ổn định.

---

## 6. Đánh giá `remocn`

### Mức phù hợp

Rất cao.

`remocn` phù hợp với Lucida vì source component được copy vào project và có thể được chuẩn hóa theo:

- `Be Vietnam Pro`;
- palette Lucida;
- safe-area TikTok/Reels/Shorts;
- vertical 9:16;
- deterministic frame rendering;
- adapter contract hiện có.

### Cách tích hợp đúng

Không import component rồi đưa thẳng vào registry. Cần một pipeline quản trị:

```text
Repository component
→ source and license review
→ copy into vendor/import area
→ normalize props
→ apply Lucida theme
→ benchmark render
→ visual QA
→ wrap with Lucida adapter
→ register template/preset
```

Nên import trước các visual family phục vụ AI/computer-science:

- kinetic typography;
- glitch text;
- glass code block;
- terminal simulation;
- code diff;
- process flow;
- AI interface;
- animated chart.

### Rủi ro

Nếu chỉ tăng số `templateId` mà không tăng visual grammar thực, Lucida sẽ lặp lại vấn đề hiện tại: catalog lớn nhưng output ít đa dạng.

**Đánh giá:** 9/10 về giá trị tham khảo, 8/10 về khả năng tích hợp.

---

## 7. Đánh giá `reactvideoeditor/remotion-templates`

### Mức phù hợp

Cao khi dùng làm catalog và reference source; trung bình khi copy trực tiếp.

Lucida hiện đã có các tên/effect gần với catalog này, nhưng nhiều template khác tên đang map về cùng một adapter. Điều đó làm số template không phản ánh số implementation thực.

### Kiến trúc đề xuất

Tách ba khái niệm:

```text
Adapter
= React rendering implementation

Preset
= motion/style parameters

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

Một adapter có thể có nhiều preset, nhưng preset phải tạo khác biệt motion/style thực sự.

### Adapter families nên có

```text
KineticTextAdapter
GlitchTextAdapter
CodeWalkthroughAdapter
TerminalSimulationAdapter
AnimatedListAdapter
StatStoryAdapter
DataChartAdapter
ComparisonAdapter
ProcessFlowAdapter
ArchitectureDiagramAdapter
CinematicAssetAdapter
EndCardAdapter
```

**Đánh giá:** 8/10 về catalog, 6.5/10 về code dùng trực tiếp.

---

## 8. Đánh giá transition architecture

Lucida hiện chọn một scene duy nhất tại mỗi frame và dùng effect overlay gần cuối scene. Đây chưa phải transition hai scene thực sự.

Nên chuyển sang mô hình:

```text
Scene A
↘ overlap window ↙
Scene B
```

Transition contract nên độc lập với scene adapter:

```json
{
  "transitionOut": {
    "id": "spatial-push",
    "durationFrames": 12,
    "direction": "left",
    "intensity": 0.75
  }
}
```

Transition registry cần xác định:

- supported outgoing family;
- supported incoming family;
- duration range;
- motion intensity;
- safe-area behavior;
- render cost.

Cần phân biệt:

```text
Transition
= phối hợp outgoing scene và incoming scene

Overlay
= flash, grain, light leak hoặc effect tại cut point
```

**Đánh giá:** mức ưu tiên cao, nên triển khai sau audio/caption.

---

## 9. Đánh giá local asset retrieval

### Điểm đúng

- Local metadata index giúp tái sử dụng asset.
- Embedding hữu ích khi từ khóa không khớp chính xác.
- Metadata filtering kết hợp semantic search tốt hơn keyword search đơn thuần.

### Điểm chưa đủ

Semantic similarity không đồng nghĩa với visual suitability.

Ví dụ script:

> Agent bị mắc kẹt giữa quá nhiều context.

Asset gần nghĩa có thể là:

- người nhìn nhiều màn hình;
- server room;
- robot AI.

Nhưng visual phù hợp với narrative có thể là:

- context block chồng lên nhau;
- memory window bị đầy;
- agent bị nhiều luồng dữ liệu bao quanh;
- diagram bottleneck.

Do đó query contract cần thêm:

```json
{
  "subject": "AI agent context",
  "sceneIntent": "problem",
  "visualFunction": "explain bottleneck",
  "representation": "diagram",
  "mood": "overloaded"
}
```

### Retrieval pipeline đề xuất

```text
Hard filters
→ tag/category matching
→ semantic search
→ scene-intent compatibility
→ visual continuity rerank
→ reuse penalty
→ top candidates
```

Ví dụ scoring:

```text
score =
  0.30 semantic similarity
+ 0.20 visual-intent compatibility
+ 0.15 aspect-ratio fit
+ 0.10 duration fit
+ 0.10 style continuity
+ 0.05 technical quality
+ 0.05 source reliability
- 0.05 recent reuse penalty
```

### Khi nào cần LanceDB

Chưa cần cho MVP nếu:

- asset dưới vài nghìn;
- metadata đơn giản;
- retrieval chỉ chạy một user/một máy;
- chưa có nhiều embedding version.

Bắt đầu bằng:

```text
JSON/SQLite
+ manual/generated tags
+ thumbnails
+ exact filtering
```

Chỉ nâng cấp sang LanceDB khi:

- số asset tăng lớn;
- cần ANN search;
- có nhiều vector field;
- cần filtering phức tạp;
- indexing incremental trở thành bottleneck.

**Đánh giá:** 8/10 về hướng kiến trúc dài hạn, 4/10 về tính cấp thiết hiện tại.

---

## 10. Thiếu sót lớn nhất của báo cáo: audio-first architecture

Báo cáo gốc tập trung nhiều vào:

```text
script
→ keyword
→ asset
→ Remotion
```

Nhưng video production cần timeline dựa trên audio:

```text
script
→ TTS/voice
→ word alignment
→ narration beats
→ scene timing
→ visual planning
→ Remotion
```

Hiện tại Lucida có hai gap chính:

1. Video output chưa có audio track được wire vào composition.
2. Caption timing đang chia đều theo caption group và số từ, không bám timestamp thật.

Vì vậy, mọi quyết định scene duration và transition hiện vẫn dựa trên ước lượng thay vì narration timeline.

---

## 11. Contract đề xuất

### 11.1 Audio contract

```json
{
  "audio": {
    "src": "audio/voice.wav",
    "durationSec": 48.72,
    "sampleRate": 48000,
    "normalization": {
      "targetLufs": -14,
      "truePeakDb": -1
    }
  }
}
```

### 11.2 Caption contract

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

### 11.3 Scene timing contract

```json
{
  "id": "scene-001",
  "startMs": 0,
  "endMs": 4200,
  "narrationRange": {
    "fromCaption": "caption-001",
    "toCaption": "caption-002"
  }
}
```

`durationSec` có thể được giữ làm derived field, nhưng không nên là source of truth duy nhất.

### 11.4 Template contract

```json
{
  "templateId": "cyber-glitch-hook",
  "adapterId": "glitch-text",
  "presetId": "rgb-scanline-heavy",
  "capabilities": {
    "intents": ["hook", "problem"],
    "density": ["low", "medium"],
    "safeAreas": ["tiktok", "reels", "youtube_shorts"]
  }
}
```

### 11.5 Asset selection contract

```json
{
  "assetSelection": {
    "strategy": "local-first",
    "visualIntent": "show-system-breakdown",
    "representation": "diagram",
    "query": [
      "AI agent context overload",
      "context bottleneck",
      "memory window full"
    ],
    "selectedAssetId": "asset-043",
    "fallback": "architecture-diagram"
  }
}
```

---

## 12. Kiến trúc mục tiêu cho Lucida

```text
Raw script
  ↓
Source cleanup
  ↓
TTS / recorded voice
  ↓
Word-level alignment
  ↓
Narrative beat segmentation
  ↓
Visual intent planning
  ↓
Template retrieval
  ├── Lucida native adapters
  ├── imported Remocn components
  ├── adapted template presets
  └── transition registry
  ↓
Local asset retrieval
  ├── metadata filters
  ├── tags
  ├── optional embeddings
  └── continuity rerank
  ↓
video-map.json
  ↓
Schema validation
  ↓
User approval gate
  ↓
Remotion composition / TransitionSeries
  ↓
Render
  ↓
Visual QA + audio-sync QA
  ↓
Patch and re-render
```

---

## 13. Import governance cho repository ngoài

Mỗi component import cần lưu provenance:

```json
{
  "componentId": "rgb-glitch-text",
  "source": {
    "repo": "kapishdima/remocn",
    "commit": "<source-commit>",
    "license": "<verified-license>"
  },
  "lucida": {
    "adapter": "GlitchTextAdapter",
    "importedAt": "YYYY-MM-DD",
    "modified": true
  }
}
```

Mỗi component cần qua quality gate:

```text
license review
source commit pinning
TypeScript check
frame determinism
render benchmark
memory usage
font loading
vertical 9:16 QA
safe-area QA
Vietnamese text overflow QA
motion-intensity QA
```

---

## 14. Roadmap đề xuất

### P0 — Production core

- Wire audio vào composition.
- Chuẩn hóa audio path và metadata.
- Import word timestamps.
- Caption theo câu ngắn và highlight theo word timestamp.
- Scene timing dựa trên narration ranges.

### P1 — Template architecture

- Tách adapter, preset và template.
- Loại bỏ alias không tạo khác biệt thực.
- Thêm capability metadata.
- Thêm adapter/preset validation.

### P2 — Component expansion

- Import có kiểm soát từ `remocn`.
- Adapt một số visual family từ `reactvideoeditor/remotion-templates`.
- Ưu tiên code, terminal, diagram, chart và kinetic typography.

### P3 — Transition system

- Chuyển composition sang `TransitionSeries` hoặc kiến trúc scene overlap tương đương.
- Xây 4–6 transition chuẩn.
- Tách transition khỏi overlay effect.

### P4 — Local asset library

- Xây cấu trúc asset folder.
- Tạo metadata schema.
- Sinh thumbnail.
- Tạo JSON/SQLite index.
- Thêm quality score và reuse history.

### P5 — Semantic retrieval

- Thử nghiệm multilingual embedding.
- Đánh giá latency và accuracy với script tiếng Việt.
- Thêm semantic rerank.
- Chỉ đưa LanceDB vào khi benchmark chứng minh cần thiết.

---

## 15. Quyết định kiến trúc đề xuất

### Nên áp dụng ngay

- Mô hình copy-source của `remocn`.
- Component registry nội bộ.
- Adapter/preset/template separation.
- Transition architecture thực.
- Audio-first timeline.

### Nên thiết kế ngay nhưng triển khai sau

- Local asset metadata schema.
- Retrieval interface abstraction.
- Import provenance schema.

### Chưa cần build ngay

- LanceDB production index.
- Semantic search cho toàn bộ asset library.
- NLP pipeline phức tạp.

---

## 16. Đánh giá cuối cùng

Báo cáo có định hướng tốt về repository và local-first architecture, nhưng cần đảo thứ tự roadmap để giải quyết đúng production bottleneck.

Đánh giá tổng thể:

| Hạng mục | Điểm |
|---|---:|
| Giá trị repository tham khảo | 8.5/10 |
| Kiến trúc component | 8/10 |
| Kiến trúc transition | 7.5/10 |
| Kiến trúc asset retrieval | 8/10 dài hạn |
| Tính cấp thiết của vector DB | 4/10 hiện tại |
| Khả năng áp dụng cho Lucida | 7.5/10 |

Thứ tự ưu tiên cuối cùng:

```text
1. Audio và timestamp
2. Caption sync
3. Adapter / preset / template architecture
4. Import Remocn có kiểm soát
5. TransitionSeries hoặc scene overlap
6. Asset metadata index
7. Embedding và LanceDB
```

Kết luận: các repository được nghiên cứu phù hợp để mở rộng visual capability của Lucida, nhưng kiến trúc production phải lấy audio timeline làm source of truth, visual intent làm cơ sở chọn hình và component registry làm lớp kiểm soát giữa source ngoài với renderer nội bộ.

---

## 17. Repository tham khảo

- `https://github.com/kapishdima/remocn`
- `https://github.com/reactvideoeditor/remotion-templates`
- `https://github.com/Ashad001/remotion-transitions`
- `https://github.com/huggingface/transformers.js`
- `https://github.com/lancedb/lancedb`
