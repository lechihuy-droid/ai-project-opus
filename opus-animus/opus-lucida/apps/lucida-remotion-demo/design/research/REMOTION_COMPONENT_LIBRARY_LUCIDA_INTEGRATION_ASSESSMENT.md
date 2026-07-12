# Đánh giá thư viện component Remotion và khả năng tích hợp vào Lucida

> Vị trí áp dụng: `opus-animus/opus-lucida/apps/lucida-remotion-demo`
>
> Phạm vi: đánh giá Remocn, React Video Editor Remotion Templates, custom transition repository, local-first architecture và mức độ phù hợp với code Lucida hiện tại.
>
> Trạng thái: architecture assessment và implementation guidance; chưa phải implementation specification.
>
> Ngày đánh giá: 2026-07-12.

---

## 1. Kết luận điều hành

Remocn là nguồn component phù hợp nhất để mở rộng visual capability của Lucida. Mô hình copy-source theo triết lý shadcn phù hợp với định hướng local-first, source-owned và deterministic rendering của dự án.

Tuy nhiên, việc tích hợp không nên dừng ở thao tác copy component rồi thêm `templateId`. Lucida hiện đã có template catalog, visual family, motion preset, validator và adapter registry, nhưng runtime vẫn còn bốn bottleneck chính:

1. Audio chưa được đưa vào composition như timeline source of truth.
2. Caption đang chia thời lượng theo scene và số từ, chưa dùng word timestamp thật.
3. `templateId`, adapter và motion preset chưa được tách hoàn chỉnh ở runtime.
4. Transition hiện chủ yếu là overlay trên scene cũ, chưa phối hợp outgoing scene và incoming scene.

Đánh giá tổng quát:

| Hạng mục | Mức phù hợp với Lucida | Khả năng áp dụng hiện tại |
|---|---:|---:|
| Remocn primitives | Rất cao | 75–80% |
| React Video Editor templates | Cao | 55–70%, tùy nhóm |
| Custom transition patterns | Trung bình–cao | 45–55% |
| Kiến trúc local-first | Cao | Khoảng 75% |
| Transformers.js local embedding | Trung bình | 30–40% |
| LanceDB local vector store | Thấp ở MVP | 15–25% |
| Component-library readiness | Cao | Khoảng 70–75% |
| Production pipeline readiness | Trung bình | Khoảng 55–60% |

Con số 70–75% phù hợp khi đánh giá riêng phần component-library architecture. Nó không đồng nghĩa toàn bộ video pipeline đã sẵn sàng ở mức tương đương.

---

## 2. Hiện trạng thực tế của Lucida

## 2.1 Lucida có 28 `templateId` nhưng chỉ có 10 adapter thật

Runtime adapter hiện nằm trong:

```text
src/templateRegistry.tsx
```

Các adapter thật gồm:

```text
AnimatedListAdapter
HeroTitleAdapter
CodePanelAdapter
SplitScreenAdapter
DiagramAdapter
EndCardAdapter
ImageCarouselAdapter
ProgressStepsAdapter
QuoteCardAdapter
StatCounterAdapter
```

Trong khi đó, `src/template-registry-map.json` đăng ký 28 `templateId`.

Ví dụ, bảy template sau cùng trỏ vào một implementation:

```text
animated-text
bounce-text
bubble-pop-text
chapter-title
cinematic-title-intro
glitch-text
title-split
    ↓
HeroTitleAdapter
```

Tương tự:

```text
gallery-grid
image-carousel
masonry-gallery
photo-stack
rotating-carousel
    ↓
ImageCarouselAdapter
```

Và:

```text
animated-list
card-flip
notification-pop
text-highlight
    ↓
AnimatedListAdapter
```

Điều này tạo ra catalog lớn trên metadata nhưng ít visual grammar thực trong output.

Không phải mỗi template cần một adapter riêng. Tuy nhiên, mỗi visual grammar khác nhau phải có implementation hoặc preset behavior khác nhau. Các cặp sau không nên tiếp tục chỉ là alias:

```text
glitch-text ≠ cinematic-title-intro
card-flip ≠ animated-list
notification-pop ≠ animated-list
text-highlight ≠ animated-list
image-comparison-slider ≠ split-screen
typewriter-subtitle ≠ code-panel
```

### Nhận định

- Số `templateId` có thể render: 28.
- Số adapter implementation: 10.
- Nhiều tên template hiện chỉ thay đổi catalog label, không thay đổi visual behavior.
- Tỷ lệ implementation so với template name khoảng 35,7%.

Vấn đề cốt lõi của Lucida không phải thiếu catalog mà là thiếu runtime visual grammar.

---

## 2.2 Lucida đã có design director khá tốt

Lucida hiện đã có ba lớp metadata quan trọng:

```text
design/visual-library/index.json
design/motion-library/index.json
design/directors/selection-rules.json
```

Visual library đã định nghĩa các family:

```text
cinematic-hook
repo-code
contrast-panel
pattern-list
workflow-process
data-proof
asset-gallery
closing-cta
```

Motion library đã định nghĩa các preset:

```text
cinematic-title-reveal
terminal-reveal
contrast-slide
staggered-card-list
step-connector-draw
metric-count-up
cta-scale
```

Như vậy Lucida không cần tạo thêm một family/preset architecture song song. Việc cần làm là nối ba lớp hiện có:

```text
Design director
visual family + motion preset

Template catalog
template metadata + source file

Runtime registry
templateId → adapter component
```

Khoảng trống hiện tại:

```text
templateId
→ adapterId
→ presetId
→ runtime behavior
```

---

## 2.3 Motion token hiện chủ yếu là metadata

`video-map.json` đã có các motion token, ví dụ:

```json
{
  "motion": [
    "slow_zoom",
    "title_reveal",
    "underline_grow",
    "product_card_stagger"
  ]
}
```

Nhưng adapter hiện hard-code animation bằng `spring()`, `interpolate()` và các frame cố định. Thay đổi `motion` token chưa bảo đảm thay đổi animation thực tế.

Runtime registry nên chuyển từ mapping string đơn giản sang definition object:

```ts
type TemplateDefinition = {
  templateId: string;
  adapterId: string;
  presetId: string;
  familyId: string;
  status: "production" | "experimental" | "catalog-only" | "unsupported";
  capabilities: TemplateCapabilities;
};
```

Ví dụ:

```json
{
  "templateId": "glitch-text",
  "adapterId": "GlitchTextAdapter",
  "presetId": "rgb-tear-medium",
  "familyId": "cinematic-hook",
  "status": "production",
  "capabilities": {
    "intents": ["hook", "problem", "code_explanation"],
    "density": ["low"],
    "safeAreas": ["tiktok", "reels", "youtube_shorts"],
    "supportsAssets": false
  }
}
```

---

## 2.4 Caption hiện đúng visual concept nhưng sai timing source

`SubtitleBar` hiện tính thời gian theo công thức:

```text
scene duration
÷ số caption group
= thời gian mỗi group
```

Sau đó:

```text
thời gian group
÷ số từ
= thời gian mỗi từ
```

Hệ quả:

- câu đọc nhanh và chậm vẫn có thời lượng bằng nhau;
- từ ngắn và dài nhận thời lượng gần tương đương;
- pause trong voiceover không được phản ánh;
- active-word animation có thể đẹp nhưng không khớp giọng;
- scene duration vẫn dựa trên ước lượng.

Phần visual concept hiện đã gần đúng:

```text
hiện một phrase ngắn
→ giữ phrase trên màn hình
→ highlight hoặc bounce từ đang đọc
→ hết phrase thì đổi phrase mới
```

Phần cần thay là timing source:

```text
WhisperX JSON
→ normalize caption schema
→ map caption vào scene narration range
→ SubtitleBar dùng startMs/endMs thật
```

Repository đã có:

```text
scripts/run-whisperx.ps1
```

và README đã mô tả cách tạo word-level timestamps cho tiếng Việt. Vì vậy công nghệ STT/alignment cơ bản đã được chọn; bước còn thiếu là wiring vào `VideoMap`, `createVideoInput()` và renderer.

---

## 2.5 Audio-first vẫn là P0

`Composition.tsx` hiện:

- đọc frame hiện tại;
- tìm một scene tại frame đó;
- resolve một adapter;
- render `SceneShell`;
- chưa render audio track.

`Root.tsx` tính tổng duration bằng tổng `durationFrames` của scene. Timeline chưa lấy audio duration hoặc narration range làm source of truth.

Thứ tự đúng:

```text
audio
→ word timestamp
→ caption sync
→ narrative beat
→ scene timing
→ component selection
→ transition
→ asset retrieval
```

Asset vector retrieval không nên đi trước audio timeline.

---

## 3. Đánh giá Remocn

## 3.1 Độ phù hợp: rất cao

Repository canonical hiện tại:

```text
https://github.com/Remocn/remocn
```

Một số tài liệu và badge vẫn tham chiếu owner cũ `kapishdima/remocn`. Provenance nên lưu cả canonical repository và legacy reference khi cần truy vết.

Remocn sử dụng mô hình tương tự shadcn:

```text
chọn component
→ npx shadcn add
→ copy source vào project
→ project sở hữu source
→ không runtime dependency
→ không version lock-in
```

Kho hiện có hơn 110 component, gồm:

### Typography

- Soft Blur In
- Per Character Rise
- Tracking In
- Typewriter
- Shimmer Sweep
- Marker Highlight
- Slot Machine Roll
- Matrix Decode
- RGB Glitch Text
- Number Wheel
- Rolling Number
- Marquee variants

### Transition và wipe

- Zoom Through
- Device Mockup Zoom
- Image Expand to Fullscreen
- Directional Wipe
- Spatial Push
- Frosted Glass Wipe
- Grid Pixelate Wipe
- Chromatic Aberration Wipe

### UI và technical visual

- Glass Code Block
- Terminal Simulator
- Code Accordion
- Code Diff Wipe
- Tool Menu Slide In
- Animated Line Chart
- Animated Bar Chart
- Drag and Drop Flow

### AI scenes

- Claude Chat
- ChatGPT
- v0
- Claude Code
- OpenCode

### Composition hoàn chỉnh

- Browser Flow
- AI Generation Canvas
- Live Code Compilation
- Terminal to Browser Deploy
- Dashboard Populate
- Ecosystem Constellation

Những nhóm này phù hợp trực tiếp với video AI, coding, product demo và system architecture của Lucida.

License hiện là MIT. Khi copy source cần giữ provenance, source commit và license notice theo quy định nội bộ.

---

## 3.2 Không nên import nguyên trạng hàng loạt

Một số component Remocn dùng trực tiếp:

```ts
const frame = useCurrentFrame();
```

Trong Lucida hiện tại, scene không nằm trong một `<Sequence>` riêng. Composition tự tìm scene bằng `getSceneAtFrame()` và truyền `localFrame` vào adapter.

Nếu component Remocn dùng global `useCurrentFrame()`:

```text
scene bắt đầu ở global frame 300
component glitchAt = 20
→ component có thể coi animation đã kết thúc
```

Đây là rủi ro tích hợp quan trọng.

### Hướng ngắn hạn

Refactor component thành primitive nhận frame từ Lucida:

```tsx
<RGBGlitchTextPrimitive
  frame={localFrame}
  fps={fps}
  text={scene.headline}
  preset={preset}
/>
```

### Hướng dài hạn

Chuyển scene scheduler sang `Series` hoặc `TransitionSeries` để mỗi scene có local timeline tự nhiên. Đây cũng là prerequisite cho true scene transition.

---

## 3.3 Component Remocn nên nhập trước

### P1 — ít phụ thuộc asset, giá trị cao

| Remocn component | Adapter Lucida đề xuất | Use case |
|---|---|---|
| Per Character Rise | `KineticTextAdapter` | Hook và title reveal |
| Matrix Decode | `KineticTextAdapter` preset | AI/coding reveal |
| RGB Glitch Text | `GlitchTextAdapter` | Cyber hook, leak, warning |
| Glass Code Block | mở rộng `CodePanelAdapter` | Code walkthrough |
| Terminal Simulator | `TerminalSimulationAdapter` | CLI, tool execution |
| Code Diff Wipe | `CodeDiffAdapter` | Before/after code |
| Animated Charts | `DataChartAdapter` | Metric, benchmark |
| Drag and Drop Flow | `ProcessFlowAdapter` | Workflow, agent process |

### P2 — cần content contract mới

| Component | Contract cần bổ sung |
|---|---|
| Claude/ChatGPT scenes | `messages[]`, role, tool call, avatar policy |
| Browser Flow | URL bar, viewport state, interaction steps |
| Live Code Compilation | source lines, output lines, state transition |
| Dashboard Populate | widgets, metrics, update sequence |
| Ecosystem Constellation | entities, links, hierarchy |

Không nên nhập composition hoàn chỉnh trước khi content contract tương ứng tồn tại.

---

## 3.4 Đánh giá Remocn

| Tiêu chí | Điểm |
|---|---:|
| Giá trị component | 9.5/10 |
| Phù hợp nội dung AI/coding | 9.5/10 |
| License và source ownership | 9/10 |
| Dùng trực tiếp không sửa | 5.5/10 |
| Tích hợp qua adapter | 8/10 |
| Giá trị dài hạn | 9/10 |

Kết luận: Remocn nên là nguồn component chính nhưng không nên trở thành runtime dependency hoặc architecture core.

---

## 4. Đánh giá `reactvideoeditor/remotion-templates`

Repository nguồn:

```text
https://github.com/reactvideoeditor/remotion-templates
```

Repository có 81 standalone React/Remotion template, chia thành chín nhóm:

- Charts & Data
- Text
- Content Animation
- Background
- Cinematic
- Transition
- Logo & Branding
- Intro & Outro
- Image & Media

Mỗi template dùng Remotion hooks và có implementation riêng.

Lucida đã có template catalog và source files trong:

```text
apps/remotion-templates
```

Validator hiện kiểm tra source file của catalog và mapping sang adapter được support. Như vậy Lucida đã vendored source nhưng chưa chuyển phần lớn template thành production adapters.

Ví dụ, source `glitch-text.tsx` có RGB split riêng, nhưng runtime lại map:

```text
glitch-text → HeroTitleAdapter
```

Đây là lỗi chiến lược tích hợp, không phải lỗi repository nguồn.

---

## 4.1 Cách tích hợp đúng

Không cần biến 81 template thành 81 adapter.

Nên gom thành khoảng 14 visual grammar:

```text
KineticTextAdapter
GlitchTextAdapter
ChapterTitleAdapter
CodeWalkthroughAdapter
TerminalSimulationAdapter
CodeDiffAdapter
AnimatedListAdapter
NotificationStackAdapter
ComparisonAdapter
ProcessFlowAdapter
ArchitectureDiagramAdapter
DataChartAdapter
AssetGalleryAdapter
EndCardAdapter
```

Sau đó mỗi template là preset:

```json
{
  "templateId": "bounce-text",
  "adapterId": "KineticTextAdapter",
  "presetId": "spring-character-bounce"
}
```

```json
{
  "templateId": "animated-text",
  "adapterId": "KineticTextAdapter",
  "presetId": "character-rise-soft"
}
```

```json
{
  "templateId": "glitch-text",
  "adapterId": "GlitchTextAdapter",
  "presetId": "rgb-tear-medium"
}
```

Bounce Text và Animated Text có thể dùng chung adapter nhưng phải có stagger, spring config, character wrapper và entrance/exit behavior khác nhau.

---

## 4.2 Alias cần xử lý trước

### Cần adapter hoặc visual grammar riêng

```text
glitch-text
card-flip
notification-pop
text-highlight
image-comparison-slider
typewriter-subtitle
```

### Có thể dùng chung adapter với preset khác

```text
animated-text
bounce-text
bubble-pop-text
```

và:

```text
gallery-grid
masonry-gallery
photo-stack
rotating-carousel
```

Nhưng preset phải tạo ra layout và motion behavior khác nhau thật sự.

---

## 4.3 Đánh giá React Video Editor templates

| Tiêu chí | Điểm |
|---|---:|
| Giá trị làm visual catalog | 9/10 |
| Giá trị làm benchmark | 9/10 |
| Chất lượng code mẫu | 7/10 |
| Khả năng copy trực tiếp | 6/10 |
| Phù hợp làm architecture core | 4.5/10 |
| Phù hợp làm preset source | 9/10 |

Kết luận: repository phù hợp nhất để làm reference catalog, test fixture, preset source và visual benchmark; không nên trở thành architecture core của Lucida.

---

## 5. Đánh giá custom transition repository

Repository:

```text
https://github.com/Ashad001/remotion-transitions
```

Đây chủ yếu là skill/reference repository về:

- `TransitionPresentation`;
- animation math;
- timing pattern;
- stagger formula;
- spring configuration;
- frame budget;
- custom transition implementation.

Các transition tham khảo gồm:

- Striped Slam
- Zoom Punch
- Diagonal Reveal
- Emerald Burst
- Vertical Shutter
- Glitch Slam

License MIT.

---

## 5.1 Gap hiện tại của Lucida

Lucida hiện chọn đúng một scene tại mỗi frame:

```ts
const {scene, localFrame} = getSceneAtFrame(input, frame);
```

`TransitionOverlay` chỉ phủ effect ở cuối scene hiện tại, ví dụ:

- gradient wipe;
- blur;
- border zoom;
- dark overlay.

Mô hình hiện tại:

```text
Scene A
+ overlay
+ fade out
→ hard switch sang Scene B
```

Đây chưa phải:

```text
Scene A outgoing presentation
+ overlap window
+ Scene B incoming presentation
```

---

## 5.2 Kiến trúc transition đề xuất

Không nên phụ thuộc trực tiếp vào repository custom transition như runtime package.

Nên:

1. Thêm `@remotion/transitions`.
2. Chuyển composition sang `TransitionSeries`.
3. Xây transition registry nội bộ.
4. Port animation math và pattern cần thiết.
5. Chuẩn hóa theo Lucida palette, motion intensity và safe area.

Contract đề xuất:

```ts
type LucidaTransitionDefinition = {
  id: string;
  durationFrames: number;
  direction?: "left" | "right" | "up" | "down";
  intensity: number;
  outgoingFamilies?: string[];
  incomingFamilies?: string[];
  renderCost: "low" | "medium" | "high";
};
```

Nên bắt đầu với bốn transition:

```text
cross-dissolve
spatial-push
zoom-punch
glitch-slam
```

Các effect như grain, flash, light leak và film burn nên ở overlay/effect registry riêng.

### Đánh giá

| Tiêu chí | Điểm |
|---|---:|
| Giá trị tham khảo | 8/10 |
| Khả năng dùng trực tiếp | 5.5/10 |
| Phù hợp với gap Lucida | 9/10 |
| Mức ưu tiên | Cao, sau audio/caption và scene scheduler |

---

## 6. Đánh giá local-first và visual-input pipeline

Lucida hiện đã có local visual flow:

```text
collect
→ sanitize
→ normalize
→ map
→ compile
→ validate
→ preview
→ render
```

Collector hiện xử lý:

```text
script
asciicast
allowlisted command
```

Mapper chia narrative thành editorial scene và operational event thành terminal scene.

Compiler hiện dùng static mapping:

```text
terminal → code-panel
code → code-panel
editorial → animated-list
infographic → animated-list
dashboard → progress-steps
data_visualization → progress-steps
product_demo → split-screen
cinematic_typography → cinematic-title-intro
```

Đây là content-to-scene pipeline, chưa phải asset retrieval pipeline.

### Điểm mạnh

- local-first;
- deterministic;
- có source-event provenance;
- có sanitization;
- có schema/registry validation;
- có preview và render automation.

### Điểm hạn chế

- static family mapping;
- chưa semantic template selection;
- chưa audio timeline;
- chưa asset matching;
- compiler đang sinh `assets: []`;
- caption chỉ có segment text, chưa có word timing.

Kết luận: local-first architecture phù hợp cao và nên giữ. Tuy nhiên, pipeline hiện tại chưa phải semantic asset retrieval system.

---

## 7. Asset retrieval và vector database

Nhận định sau là phù hợp:

```text
Transformers.js embedding: giá trị trung bình ở giai đoạn hiện tại
LanceDB: thấp ở MVP, cao khi asset library lớn
```

Tuy nhiên, trước embedding còn một bước cơ bản hơn: actual asset rendering.

`VisualAsset` hiện mới có các field cơ bản:

```ts
id
src
kind
usage
alt
```

Nên mở rộng:

```ts
type VisualAsset = {
  id: string;
  src: string;
  kind: "image" | "video" | "audio";
  usage: "embed_asset" | "style_reference" | "context_only";

  width?: number;
  height?: number;
  durationMs?: number;
  orientation?: "portrait" | "landscape" | "square";

  tags?: string[];
  visualFunctions?: string[];
  moods?: string[];
  styles?: string[];

  qualityScore?: number;
  provenance?: AssetProvenance;
};
```

`ImageCarouselAdapter` hiện chủ yếu dựng card từ text item, chưa trở thành asset renderer hoàn chỉnh.

Thứ tự đúng:

```text
asset rendering primitives
→ metadata schema
→ manual/tag filtering
→ reuse tracking
→ optional semantic embedding
→ vector database khi cần
```

### Khi chưa cần LanceDB

- asset dưới vài nghìn;
- metadata còn đơn giản;
- retrieval chạy local cho một user/máy;
- chưa có nhiều embedding version;
- ANN search chưa phải bottleneck.

Bắt đầu bằng:

```text
JSON hoặc SQLite
+ tags
+ thumbnail
+ exact filtering
+ reuse history
```

Chỉ thêm LanceDB khi benchmark chứng minh cần ANN search, multiple vector fields hoặc incremental indexing phức tạp.

---

## 8. Kiến trúc runtime đề xuất

## 8.1 Giữ architecture hiện có

Không tạo thêm hệ thống song song. Nên tiếp tục dùng:

```text
design/visual-library
design/motion-library
design/directors
apps/remotion-templates
src/templateRegistry
```

## 8.2 Nâng cấp registry

Hiện tại:

```json
{
  "glitch-text": "HeroTitleAdapter"
}
```

Mục tiêu:

```json
{
  "glitch-text": {
    "adapterId": "GlitchTextAdapter",
    "presetId": "rgb-tear-medium",
    "familyId": "cinematic-hook",
    "status": "production",
    "capabilities": {
      "intents": ["hook", "problem", "code_explanation"],
      "density": ["low"],
      "safeAreas": ["tiktok", "reels", "youtube_shorts"],
      "supportsAssets": false
    }
  }
}
```

## 8.3 Nâng cấp adapter props

Current contract:

```ts
type TemplateAdapterProps = {
  scene: VideoScene;
  localFrame: number;
  durationFrames: number;
  theme: Theme;
  assets: VisualAsset[];
};
```

Đề xuất:

```ts
type TemplateAdapterProps<TPreset = unknown> = {
  scene: VideoScene;
  frame: number;
  durationInFrames: number;
  fps: number;

  theme: Theme;
  assets: VisualAsset[];

  preset: TPreset;
  safeArea: SafeArea;
};
```

Component vendored không nên tự phụ thuộc global frame khi adapter đã có local scene frame.

## 8.4 Folder structure đề xuất

```text
src/
  composition/
    LucidaComposition.tsx
    SceneTimeline.tsx
    transitions.ts

  templates/
    types.ts
    registry.ts

    adapters/
      KineticTextAdapter.tsx
      GlitchTextAdapter.tsx
      CodeWalkthroughAdapter.tsx
      TerminalSimulationAdapter.tsx
      CodeDiffAdapter.tsx
      AnimatedListAdapter.tsx
      NotificationStackAdapter.tsx
      ComparisonAdapter.tsx
      ProcessFlowAdapter.tsx
      ArchitectureDiagramAdapter.tsx
      DataChartAdapter.tsx
      AssetGalleryAdapter.tsx
      EndCardAdapter.tsx

    presets/
      kinetic-text.ts
      glitch-text.ts
      code.ts
      charts.ts
      transitions.ts

  vendor/
    remocn/
      rgb-glitch-text.tsx
      per-character-rise.tsx
      glass-code-block.tsx
      terminal-simulator.tsx
      code-diff-wipe.tsx

design/
  imports/
    remocn-provenance.json
```

`vendor/remocn` giữ source gần upstream. Adapter chịu trách nhiệm:

- local frame;
- Lucida theme;
- safe area;
- Vietnamese typography;
- density;
- normalized content contract;
- render performance.

---

## 9. Import governance

Mỗi component import cần provenance:

```json
{
  "componentId": "rgb-glitch-text",
  "source": {
    "canonicalRepo": "Remocn/remocn",
    "legacyRepo": "kapishdima/remocn",
    "commit": "<source-commit>",
    "license": "MIT",
    "sourcePath": "registry/remocn/rgb-glitch-text/index.tsx"
  },
  "lucida": {
    "adapter": "GlitchTextAdapter",
    "preset": "rgb-tear-medium",
    "importedAt": "YYYY-MM-DD",
    "modified": true
  }
}
```

Quality gate tối thiểu:

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
audio/caption overlap QA
```

---

## 10. Roadmap cập nhật

## P0 — Audio và caption source of truth

- Thêm audio contract vào `VideoMap`.
- Render audio trong composition.
- Normalize WhisperX JSON.
- Thêm `startMs`, `endMs`, `words[]` cho captions.
- Chia phrase theo punctuation, pause và word count.
- Scene timing lấy từ narration range.
- Thêm audio-sync QA.

## P1 — Scene scheduler và registry contract

- Chuyển scene rendering sang `Series` hoặc `TransitionSeries`.
- Bảo đảm local frame cho từng scene.
- Chuyển registry map từ string sang definition object.
- Tách adapter, preset và template.
- Thêm implementation status.
- Validator kiểm tra adapter và preset thực sự tồn tại.

## P2 — Component library MVP

Import có kiểm soát:

1. Per Character Rise.
2. Matrix Decode.
3. RGB Glitch Text.
4. Glass Code Block.
5. Terminal Simulator.
6. Code Diff Wipe.
7. Animated Line/Bar Chart.
8. Drag and Drop Flow.

Mục tiêu:

- tăng từ 10 adapter lên khoảng 14–16 adapter;
- đạt tối thiểu 18–22 visual preset có behavior thật;
- loại các alias gây hiểu sai.

## P3 — True transition

- Thêm `@remotion/transitions`.
- Dùng `TransitionSeries`.
- Implement bốn transition chuẩn.
- Tách overlay khỏi transition.
- Thêm transition compatibility matrix.
- Benchmark render cost.

## P4 — Asset plumbing

- Render actual image/video assets.
- Thêm orientation, duration và metadata.
- Thêm asset usage policy.
- Sinh thumbnail và local index.
- Dùng JSON hoặc SQLite.
- Thêm reuse history.

## P5 — Semantic retrieval

- Thử Transformers.js với multilingual embedding.
- Benchmark script tiếng Việt.
- Kết hợp hard filter và semantic rerank.
- Chỉ thêm LanceDB khi benchmark chứng minh cần thiết.

---

## 11. Ma trận quyết định cuối cùng

| Hạng mục | Phù hợp Lucida | Khả năng áp dụng ngay | Quyết định |
|---|---:|---:|---|
| Remocn primitives | Rất cao | 75–80% | Nguồn component chính |
| Remocn full compositions | Cao | 45–60% | Đưa vào giai đoạn sau |
| React Video Editor catalog | Rất cao | Khoảng 70% | Nguồn preset và benchmark |
| React Video Editor code trực tiếp | Trung bình–cao | 55–65% | Refactor chọn lọc |
| Official Remotion skills | Cao | Khoảng 90% | Dùng làm coding rules |
| Caption component/pattern | Rất cao | Khoảng 70% sau timestamp | Ưu tiên P0 |
| Custom transition repository | Cao | 45–55% | Reference, không runtime dependency |
| Local-first pipeline | Cao | Khoảng 75% | Giữ và mở rộng |
| Transformers.js embedding | Trung bình | 30–40% | Thiết kế sau |
| LanceDB | Thấp ở MVP | 15–25% | Chưa triển khai |
| Component-library readiness | Cao | 70–75% | Có thể bắt đầu |
| Production readiness | Trung bình | 55–60% | Cần hoàn thành P0 và P1 |

---

## 12. Kết luận cuối cùng

Lucida không thiếu template catalog. Dự án đã có:

- 81 source templates;
- 28 registered `templateId`;
- visual family library;
- motion library;
- selection rules;
- validator;
- 10 runtime adapters;
- local visual-input pipeline.

Phần thiếu là runtime implementation có visual grammar đủ khác biệt và timeline dựa trên audio.

Quyết định kiến trúc đề xuất:

```text
Remocn
= nguồn component chính

React Video Editor templates
= catalog + benchmark + preset source

Lucida adapters
= implementation boundary

Lucida visual/motion libraries
= design direction

TransitionSeries
= scene orchestration

WhisperX timestamps
= timeline source of truth

JSON/SQLite
= asset index MVP

Transformers.js/LanceDB
= optimization dài hạn
```

Thứ tự ưu tiên cuối cùng:

```text
1. Audio và word timestamps
2. Caption sync
3. Scene scheduler
4. Adapter / preset / template runtime contract
5. Import Remocn có kiểm soát
6. True scene transitions
7. Actual asset rendering và metadata
8. Embedding và LanceDB
```

Với hướng này, Lucida sẽ không chỉ tăng số template trên giấy mà thực sự tăng số visual language có thể quan sát được trong output video.

---

## 13. Repository tham khảo

- `https://github.com/Remocn/remocn`
- `https://github.com/reactvideoeditor/remotion-templates`
- `https://github.com/Ashad001/remotion-transitions`
- `https://github.com/remotion-dev/remotion`
- `https://github.com/remotion-dev/skills`
- `https://github.com/neutral-Stage/remotion-captioneer`
- `https://github.com/huggingface/transformers.js`
- `https://github.com/lancedb/lancedb`
