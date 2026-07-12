# Đánh giá kiến trúc Asset–Component Input cho Lucida Remotion

> Phạm vi: `opus-animus/opus-lucida/apps/lucida-remotion-demo`
>
> Ngày đánh giá: 2026-07-12
>
> Loại tài liệu: current-state architecture review + target architecture proposal
>
> Mục tiêu: xác định cách asset, scene contract và React component được xử lý thành input deterministic cho Remotion render; chỉ ra gap hiện tại và đề xuất kiến trúc triển khai tiếp theo.

---

## 1. Executive summary

Lucida hiện đã có ba nền tảng đúng để phát triển thành một hệ thống render video có kiểm soát:

1. `video-map.json` đóng vai trò contract giữa tầng planning và renderer.
2. `templateId` được resolve qua component registry thay vì viết nhánh scene-specific trong Composition.
3. Raw source được phân loại thành content truth, style reference, embeddable asset hoặc context-only trước khi đi vào mapping.

Tuy nhiên, kiến trúc asset hiện mới ở mức **asset-aware**, chưa đạt mức **asset-driven**.

```text
Hiện tại

video-map.assets[]
        │
        ▼
createVideoInput()
        │
        ▼
assets[] được truyền toàn bộ xuống mỗi adapter
        │
        └── phần lớn adapter không consume asset
```

Hệ thống còn thiếu lớp liên kết bắt buộc:

```text
Asset Manifest
→ Scene Asset Binding
→ Template Slot Validation
→ Asset Resolver
→ Media Renderer
→ Remotion Component
```

Gap lớn nhất không phải thiếu thêm tên template. Gap lớn nhất là chưa có contract rõ ràng để trả lời bốn câu hỏi:

1. Asset nào thuộc scene nào?
2. Asset được đưa vào slot nào của component?
3. Asset có tương thích với component, aspect ratio và thời lượng không?
4. Renderer phải xử lý image, video, audio và SVG theo quy tắc nào?

Kết luận kiến trúc:

```text
usableAssets
→ asset manifest
→ scene.assetBindings
→ template slot schema
→ resolved component props
→ <Img> / <Video> / <Audio> / native React visual
```

Đây nên là hướng triển khai tiếp theo trước khi đầu tư vào semantic retrieval hoặc vector database.

---

## 2. Phạm vi code đã đánh giá

Các thành phần chính:

```text
apps/lucida-remotion-demo/
├── video-map.json
├── schemas/
│   └── video-map.schema.json
├── src/
│   ├── data.ts
│   ├── Composition.tsx
│   ├── Root.tsx
│   ├── templateRegistry.tsx
│   └── template-registry-map.json
├── pipeline/
│   ├── collectors/
│   ├── processors/
│   ├── mappers/
│   ├── compilers/
│   ├── contracts/
│   └── schemas/
├── scripts/
│   ├── collect-visual-inputs.mjs
│   ├── process-visual-inputs.mjs
│   ├── map-and-compile-visual-scenes.mjs
│   ├── render-generated-video.mjs
│   ├── run-visual-flow.mjs
│   └── validate-video-map.mjs
└── design/
    └── research/
```

Các orchestration skill liên quan:

```text
ai/skills/remotion-script-to-video/
ai/skills/source-ingestor-cleaner/
ai/skills/script-template-mapper/
ai/skills/remotion-video-builder/
```

---

## 3. Hai luồng input hiện tại

Lucida hiện có hai luồng tạo input cho Remotion.

## 3.1 Luồng production AI-assisted

```text
Raw script + optional raw sources
→ source-ingestor-cleaner
→ clean-brief.json
→ script-template-mapper
→ video-map.json
→ validate:videomap
→ user approval gate
→ remotion-video-builder
→ render
→ visual QA
```

Đặc điểm:

- AI hoặc người dùng quyết định scene intent và template.
- `clean-brief.json` tách nội dung, visual reference và usable asset.
- `video-map.json` là artifact reviewable trước khi React render.
- QA mapping phải sửa ở JSON trước; QA layout phải sửa ở component.

Đây là luồng phù hợp cho video editorial, educational và technical explainer.

## 3.2 Luồng visual-flow tự động

```text
VisualFlowConfig
→ collect sources
→ 01-raw-input.json
→ sanitize
→ 02-sanitized-input.json
→ normalize
→ 03-normalized-input.json
→ map visual scenes
→ 04-visual-scenes.json
→ compile
→ 05-video-map.json
→ render-props.json
→ Remotion render
```

Đặc điểm:

- Pipeline ưu tiên nguồn có cấu trúc như script, command output và asciicast.
- Event được normalize rồi nhóm thành scene.
- Visual family được compile sang `templateId`.
- Provenance được giữ qua `sourceEventIds`.

Giới hạn hiện tại:

```text
compileVideoMap()
→ assets: []
```

Vì vậy visual-flow hiện tạo **component content input**, chưa tạo **media asset input**.

---

## 4. Kiến trúc source ingestion và asset classification

`source-ingestor-cleaner` phân loại mỗi nguồn theo usage:

```text
content_truth
style_reference
embed_asset
context_only
ignore
```

Đây là quyết định kiến trúc đúng vì nó ngăn ba loại dữ liệu bị trộn lẫn:

```text
Content truth
= dùng để bảo đảm script và claim chính xác

Style reference
= dùng để học mood, palette, layout, typography và motion

Embeddable asset
= file được phép xuất hiện trực tiếp trong video
```

Contract `CleanBrief` đã tách:

```ts
type CleanBrief = {
  visualReferences: VisualReference[];
  usableAssets: UsableAsset[];
};
```

Asset được phép sử dụng có dạng:

```ts
type UsableAsset = {
  id: string;
  sourceId: string;
  type: "image" | "video" | "audio" | "svg";
  path: string;
  usage: "embed_in_video";
  sceneHints: string[];
  safeToUse: boolean;
  reason: string;
};
```

### Điểm mạnh

- Có `sourceId` để trace nguồn.
- Có `safeToUse` để kiểm soát quyền sử dụng.
- Có `sceneHints` để hỗ trợ mapper.
- Không mặc định biến screenshot hoặc image tham khảo thành asset.

### Gap

`UsableAsset` chưa được compile thành một asset manifest đủ giàu metadata cho renderer.

Thiếu các thuộc tính quan trọng:

```text
width
height
duration
fps
mime type
checksum
orientation
crop policy
loop policy
audio gain
license/provenance detail
quality score
```

---

## 5. `video-map.json` là contract trung tâm

Runtime type hiện tại:

```ts
type VideoMap = {
  video: VideoMetadata;
  theme: Theme;
  assets: VisualAsset[];
  scenes: VideoMapScene[];
};
```

Asset contract hiện tại:

```ts
type VisualAsset = {
  id: string;
  src: string;
  kind: "image" | "video" | "audio";
  usage: "embed_asset" | "style_reference" | "context_only";
  alt?: string;
};
```

Scene contract hiện chứa:

```text
id
intent
templateId
templateRole
durationSec
headline
subtitle
content
style
motion
backgroundEffect
transitionIn
transitionOut
subtitleMode
reason
```

### Điểm mạnh

- Renderer không phụ thuộc trực tiếp vào raw source.
- Scene content và rendering instruction được review trước render.
- `templateId` là abstraction ổn định giữa AI mapper và React component.
- Video metadata có thể override bằng render props.

### Gap chính

Scene không có field liên kết tới asset.

Hiện chưa có:

```ts
type SceneAssetBindings = {
  hero?: string;
  background?: string;
  items?: string[];
  voiceover?: string;
};
```

Do đó `video-map.assets[]` đang tồn tại như một danh sách global không có ownership rõ ràng.

---

## 6. Runtime normalization

`src/data.ts` thực hiện:

```text
video-map.json
→ defaultVideoMap
→ createVideoInput(videoMap)
→ normalizeScene(scene)
→ VideoInput
```

`normalizeScene()` hiện derive:

```text
kicker
title
narration
captionGroups
footer
accent
bullets
nodes
links
durationFrames
```

Sau đó `createVideoInput()` giữ nguyên:

```ts
{
  theme: videoMap.theme,
  assets: videoMap.assets,
  scenes: normalizedScenes
}
```

### Đánh giá

Cách normalize này phù hợp với content-derived props nhưng chưa phù hợp với asset-derived props.

Nên bổ sung một bước độc lập:

```text
createVideoInput()
→ normalizeSceneContent()
→ resolveSceneAssets()
→ validateTemplateSlots()
→ ResolvedVideoInput
```

Không nên để mỗi adapter tự search asset trong global array.

---

## 7. Component registry

Registry hiện resolve theo luồng:

```text
scene.templateId
→ template-registry-map.json
→ adapterComponents
→ templateRegistry
→ resolveTemplateAdapter()
→ React adapter
```

Các adapter thực tế:

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

Registry JSON hiện có 28 `templateId` map về 10 adapter.

Ví dụ alias:

```text
animated-text
bounce-text
bubble-pop-text
chapter-title
cinematic-title-intro
glitch-text
title-split
→ HeroTitleAdapter
```

### Điểm mạnh

- Thêm template ID không cần sửa Composition.
- Unsupported template có adapter explicit, không silently fallback.
- Adapter dùng chung một props contract.
- Composition không chứa logic scene-specific.

### Gap

Registry mới chỉ mô tả:

```text
templateId → adapterName
```

Nó chưa mô tả:

```text
adapter capabilities
asset slots
accepted asset kinds
required asset count
supported intents
supported aspect ratio
fallback behavior
render cost
```

Do đó validator chỉ biết template có tồn tại, nhưng không biết scene có đủ input để render template đúng nghĩa hay không.

---

## 8. Adapter props và luồng render

Mọi adapter nhận:

```ts
type TemplateAdapterProps = {
  scene: VideoScene;
  localFrame: number;
  durationFrames: number;
  theme: Theme;
  assets: VisualAsset[];
};
```

Composition thực hiện:

```text
useCurrentFrame()
→ createVideoInput(videoMap)
→ getSceneAtFrame()
→ resolveTemplateAdapter(scene.templateId)
→ SceneShell
→ Adapter
```

`SceneShell` render các phần dùng chung:

```text
GlowBackground
Header
Adapter children
SubtitleBar
TransitionOverlay
```

### Đánh giá

Separation hiện tại là hợp lý:

```text
SceneShell
= shared chrome và timeline behavior

Adapter
= visual stage implementation
```

Nhưng `assets` đang được truyền ở dạng quá rộng.

```text
Hiện tại
Adapter receives all assets

Mục tiêu
Adapter receives only resolved slot assets
```

Ví dụ mục tiêu:

```ts
type ImageCarouselResolvedProps = {
  items: ResolvedImageAsset[];
  background?: ResolvedVideoAsset;
};
```

---

## 9. Đánh giá mức độ consume asset hiện tại

## 9.1 Image carousel chưa phải media carousel

`ImageCarouselAdapter` hiện sử dụng:

```ts
const items = getItems(scene).slice(0, 5);
```

Sau đó dựng card gradient chứa text.

Nó không:

- đọc `assets`;
- resolve asset ID;
- render `<Img>`;
- crop image;
- preload asset;
- xử lý missing image.

Vì vậy tên template hiện mô tả intent nhiều hơn implementation thực tế.

```text
image-carousel hiện tại
= animated text-card carousel

không phải
= image asset carousel
```

## 9.2 Video asset chưa có renderer

Chưa có component chung chịu trách nhiệm:

```text
<Video>
loop
trim
startFrom
endAt
muted
playbackRate
objectFit
poster frame
```

## 9.3 Audio asset chưa được consume

`VisualAsset.kind` có giá trị `audio`, nhưng composition không render `<Audio>`.

Hệ quả:

- video output không có narration track;
- scene timing chưa lấy audio làm source of truth;
- audio metadata không ảnh hưởng duration;
- subtitle không thể bám word timestamp thật.

## 9.4 SVG chưa tồn tại trong runtime contract

`CleanBrief.UsableAsset` cho phép `svg`, nhưng `VisualAsset.kind` chỉ cho:

```text
image
video
audio
```

Đây là contract mismatch giữa ingestion và renderer.

SVG cần được quyết định rõ:

```text
A. normalize thành image
B. giữ kind = svg và render qua <Img>
C. parse thành native React SVG khi cần animate từng phần
```

---

## 10. Visual input pipeline

`VisualFlowConfig` định nghĩa nhiều source type:

```text
script
repository
command
asciicast
theme_reference
web_reference
image_reference
```

Nhưng collector hiện mới implement:

```text
script
command
asciicast
```

Pipeline giữ provenance tốt:

```ts
type SourceProvenance = {
  sourceId: string;
  sourceRef: string;
  sourceChecksum: string;
  collectorVersion: string;
};
```

Normalized events được map thành `VisualSceneRequirement` với:

```text
visualFamily
preset
themeId
durationInFrames
blocks[]
sourceEventIds[]
```

Compiler map visual family sang template:

```text
terminal             → code-panel
code                 → code-panel
editorial            → animated-list
infographic           → animated-list
dashboard            → progress-steps
data_visualization    → progress-steps
product_demo          → split-screen
cinematic_typography → cinematic-title-intro
```

### Điểm mạnh

- Pipeline deterministic.
- Input được sanitize trước mapping.
- Event timing được normalize theo frame.
- Provenance không bị mất khi compile scene.
- Có artifact ở từng stage để debug.

### Gap

- `repository`, `image_reference`, `web_reference` chưa có collector implementation.
- Pipeline chưa tạo asset manifest.
- `compileVideoMap()` hard-code `assets: []`.
- `media` block tồn tại trong contract nhưng chưa được compile thành asset binding.
- Mapping hiện chủ yếu dựa trên event kind, chưa dựa trên visual intent và asset availability.

---

## 11. Validation hiện tại

`video-map.schema.json` kiểm tra asset có:

```text
id
src
kind
usage
alt?
```

Validator hiện chưa kiểm tra:

```text
file exists
path is inside approved workspace
asset ID uniqueness
asset is actually used
scene binding exists
slot compatibility
MIME type
dimensions
duration
fps
checksum
safe-to-use status
license
orientation
```

Template validation hiện cũng chưa kiểm tra:

```text
image-carousel requires 2–5 images
video-background accepts video only
voiceover accepts audio only
diagram should not require media asset
```

### Hệ quả

Một `video-map.json` có thể pass schema nhưng vẫn không đủ dữ liệu để render đúng semantic của template.

---

## 12. Render entrypoint

Generated flow tạo:

```text
05-video-map.json
render-props.json
```

`render-props.json` có dạng:

```json
{
  "videoMap": {}
}
```

Render script gọi:

```text
npx remotion render
LucidaMotionDemo
output/video.mp4
--props=<render-props.json>
```

`Root.tsx` sử dụng `calculateMetadata()` để derive:

```text
durationInFrames
fps
width
height
```

Đây là kiến trúc tốt vì render có thể nhận video map động mà không sửa source code.

### Gap

Metadata hiện chỉ phụ thuộc vào scene duration, chưa phụ thuộc vào:

```text
audio duration
video asset duration
trim range
transition overlap
```

Khi audio-first timeline được triển khai, `calculateMetadata()` cần dùng timeline đã resolved thay vì cộng đơn giản `durationFrames` của scene.

---

## 13. Đánh giá tổng thể

| Hạng mục | Trạng thái | Đánh giá |
|---|---|---|
| Source classification | Đã có | Tốt |
| Separation reference/asset | Đã có | Tốt |
| Reviewable `video-map.json` | Đã có | Tốt |
| Typed scene normalization | Đã có | Tốt |
| Template registry | Đã có | Tốt |
| Unsupported template handling | Đã có | Tốt |
| Dynamic render props | Đã có | Tốt |
| Provenance ở visual-flow | Đã có | Tốt |
| Asset metadata contract | Mỏng | Cần mở rộng |
| Scene-to-asset binding | Chưa có | Critical gap |
| Template slot schema | Chưa có | Critical gap |
| Asset resolver | Chưa có | Critical gap |
| Image renderer | Chưa hoàn chỉnh | Critical gap |
| Video renderer | Chưa có | Critical gap |
| Audio renderer | Chưa có | Critical gap |
| SVG policy | Chưa thống nhất | Gap |
| Asset file validation | Chưa có | Gap |
| Retrieval engine | Chưa có | Chưa cấp thiết |
| Semantic/vector retrieval | Chưa có | Nên làm sau |

---

## 14. Kiến trúc mục tiêu

```text
Raw sources
  │
  ▼
Source classification
  ├── content truth
  ├── style reference
  ├── usable asset
  └── ignored source
          │
          ▼
Asset ingestion and normalization
          │
          ├── probe metadata
          ├── checksum
          ├── provenance
          ├── safety/license
          ├── thumbnail
          └── normalized path
          │
          ▼
Asset Manifest
          │
Script / narrative planning
          │
          ▼
Scene intent + template selection
          │
          ▼
Scene Asset Binding
          │
          ▼
video-map.json
          │
          ▼
Schema validation
          │
          ▼
Template Slot Validation
          │
          ▼
Asset Resolver
          │
          ▼
ResolvedVideoInput
          │
          ▼
Component Registry
          │
          ▼
Resolved Adapter Props
          │
          ├── native React visual
          ├── <Img>
          ├── <Video>
          ├── <Audio>
          └── SVG renderer
          │
          ▼
Remotion render
```

---

## 15. Asset manifest đề xuất

```ts
type AssetKind = "image" | "video" | "audio" | "svg";

type AssetManifestItem = {
  id: string;
  src: string;
  kind: AssetKind;
  usage: "embed_asset";

  safeToUse: boolean;
  alt?: string;

  metadata: {
    mimeType?: string;
    width?: number;
    height?: number;
    orientation?: "portrait" | "landscape" | "square";
    durationSec?: number;
    fps?: number;
    sampleRate?: number;
    channels?: number;
    bytes?: number;
  };

  semantics: {
    tags: string[];
    sceneHints: string[];
    representation?: string;
    mood?: string;
    visualStyle?: string[];
    qualityScore?: number;
  };

  provenance: {
    sourceId: string;
    sourceType: string;
    originalPath?: string;
    sourceRef?: string;
    license?: string;
    checksum: string;
  };
};
```

### Nguyên tắc

- `src` phải là path đã normalize cho Remotion.
- `id` phải stable trong cùng project.
- Metadata được probe bằng tool, không do LLM đoán.
- `safeToUse` phải được validate trước render.
- Semantic metadata hỗ trợ mapper nhưng không thay thế hard validation.

---

## 16. Scene asset binding đề xuất

Mỗi scene nên khai báo asset theo slot semantic:

```ts
type SceneAssetBindings = {
  background?: AssetBinding;
  hero?: AssetBinding;
  items?: AssetBinding[];
  overlay?: AssetBinding;
  voiceover?: AssetBinding;
  soundEffect?: AssetBinding[];
};

type AssetBinding = {
  assetId: string;
  fit?: "cover" | "contain" | "fill";
  position?: "center" | "top" | "bottom" | "left" | "right";
  startSec?: number;
  endSec?: number;
  loop?: boolean;
  muted?: boolean;
  volume?: number;
};
```

Ví dụ:

```json
{
  "id": "scene-03",
  "intent": "use_case",
  "templateId": "image-carousel",
  "assetBindings": {
    "items": [
      {
        "assetId": "asset-image-01",
        "fit": "cover"
      },
      {
        "assetId": "asset-image-02",
        "fit": "cover"
      }
    ],
    "background": {
      "assetId": "asset-video-01",
      "fit": "cover",
      "loop": true,
      "muted": true
    }
  }
}
```

### Lợi ích

- Asset ownership rõ ràng.
- Mapper có thể giải thích asset nào phục vụ scene nào.
- Validator kiểm tra được slot compatibility.
- Adapter không phải search global asset list.
- Unused asset có thể được phát hiện.

---

## 17. Template definition và slot schema

Registry nên nâng cấp từ:

```text
templateId → adapter
```

thành:

```ts
type TemplateDefinition = {
  adapter: TemplateAdapter;
  adapterId: string;
  presetId?: string;

  supportedIntents: SceneIntent[];
  supportedAspectRatios: Array<"vertical_9_16">;

  slots: Record<string, {
    acceptedKinds: AssetKind[];
    required: boolean;
    min?: number;
    max?: number;
  }>;

  capabilities: {
    supportsNativeVisual: boolean;
    supportsSubtitle: boolean;
    supportsAudio: boolean;
    maxTextObjects?: number;
  };
};
```

Ví dụ:

```ts
const imageCarouselDefinition: TemplateDefinition = {
  adapter: ImageCarouselAdapter,
  adapterId: "image-carousel",
  supportedIntents: ["list", "use_case"],
  supportedAspectRatios: ["vertical_9_16"],
  slots: {
    items: {
      acceptedKinds: ["image", "svg"],
      required: true,
      min: 2,
      max: 5
    },
    background: {
      acceptedKinds: ["image", "video"],
      required: false
    }
  },
  capabilities: {
    supportsNativeVisual: false,
    supportsSubtitle: true,
    supportsAudio: true,
    maxTextObjects: 5
  }
};
```

---

## 18. Asset resolver đề xuất

```ts
type ResolvedSceneAssets = {
  background?: ResolvedAsset;
  hero?: ResolvedAsset;
  items: ResolvedAsset[];
  overlay?: ResolvedAsset;
  voiceover?: ResolvedAsset;
  soundEffect: ResolvedAsset[];
};
```

Resolver pipeline:

```text
scene.assetBindings
+ asset manifest
+ template slot schema
        │
        ▼
resolveSceneAssets()
        │
        ├── asset ID exists?
        ├── path exists?
        ├── safeToUse = true?
        ├── kind accepted by slot?
        ├── min/max count valid?
        ├── trim range valid?
        ├── orientation acceptable?
        └── duration sufficient?
        │
        ▼
ResolvedSceneAssets
```

Fail-fast policy:

```text
Missing required asset
→ validation error

Wrong kind
→ validation error

Optional asset missing
→ explicit fallback

Unsafe asset
→ validation error

Unused asset
→ warning
```

---

## 19. Media renderer dùng chung

```tsx
const AssetRenderer: React.FC<{
  asset: ResolvedAsset;
  binding: AssetBinding;
}> = ({ asset, binding }) => {
  switch (asset.kind) {
    case "image":
    case "svg":
      return (
        <Img
          src={asset.src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: binding.fit ?? "cover"
          }}
        />
      );

    case "video":
      return (
        <Video
          src={asset.src}
          muted={binding.muted ?? true}
          volume={binding.volume ?? 1}
          style={{
            width: "100%",
            height: "100%",
            objectFit: binding.fit ?? "cover"
          }}
        />
      );

    case "audio":
      return (
        <Audio
          src={asset.src}
          volume={binding.volume ?? 1}
        />
      );
  }
};
```

### Nguyên tắc

- Asset rendering policy nằm trong component dùng chung.
- Adapter chỉ quyết định layout và animation.
- Trim, loop, fit và volume lấy từ binding.
- Không hard-code đường dẫn asset trong adapter.

---

## 20. Audio architecture

Audio không nên là một card-level asset thông thường.

Cần tách hai loại:

```text
Global audio
= narration, music bed

Scene audio
= sound effect, scene-local clip
```

Contract đề xuất:

```ts
type VideoAudioTrack = {
  id: string;
  assetId: string;
  role: "voiceover" | "music";
  startMs: number;
  endMs?: number;
  volume: number;
};

type SceneAudioBinding = {
  assetId: string;
  role: "sound_effect" | "clip_audio";
  startMs: number;
  volume: number;
};
```

Timeline mục tiêu:

```text
Voice/TTS
→ word timestamps
→ narration beats
→ scene start/end
→ caption groups
→ active word animation
→ Remotion timeline
```

Scene duration không nên tiếp tục là nguồn sự thật duy nhất.

---

## 21. Validation layers đề xuất

## 21.1 JSON schema validation

Kiểm tra shape và required fields.

## 21.2 Asset manifest validation

```text
unique IDs
valid kind
valid normalized src
safeToUse
checksum exists
metadata consistent
```

## 21.3 File-system validation

```text
file exists
file is readable
path stays inside approved root
MIME matches extension
```

## 21.4 Template slot validation

```text
required slot present
accepted kind
min/max count
aspect ratio compatibility
```

## 21.5 Timeline validation

```text
trim range valid
asset duration sufficient
audio duration covers narration
scene boundaries do not overlap unexpectedly
```

## 21.6 Render preflight

```text
Remotion composition available
font loaded
asset preload succeeds
representative still renders
```

---

## 22. Proposed repository structure

```text
src/
├── assets/
│   ├── types.ts
│   ├── resolver.ts
│   ├── validators.ts
│   ├── AssetRenderer.tsx
│   └── audio.tsx
├── registry/
│   ├── templateDefinitions.ts
│   ├── templateRegistry.ts
│   └── slotValidation.ts
├── adapters/
│   ├── HeroTitleAdapter.tsx
│   ├── ImageCarouselAdapter.tsx
│   ├── VideoBackgroundAdapter.tsx
│   └── ...
├── timeline/
│   ├── resolveTimeline.ts
│   ├── captionTiming.ts
│   └── audioTracks.ts
├── data.ts
├── Composition.tsx
└── Root.tsx

pipeline/
├── assets/
│   ├── ingest.mjs
│   ├── probe.mjs
│   ├── normalize.mjs
│   └── manifest.mjs
├── collectors/
├── processors/
├── mappers/
├── compilers/
└── validators/
```

---

## 23. Roadmap triển khai

## P0 — Scene asset binding

Mục tiêu: nối asset manifest với scene.

```text
- Thêm `assetBindings` vào VideoMapScene
- Mở rộng JSON schema
- Thêm unique asset ID validation
- Thêm unused asset warning
```

## P1 — Asset resolver và media renderer

```text
- Xây `resolveSceneAssets()`
- Xây `AssetRenderer`
- Chuẩn hóa Remotion src path
- Fail-fast khi missing required asset
```

## P2 — Image-backed adapter đầu tiên

```text
- Refactor ImageCarouselAdapter
- Render 2–5 image/SVG assets thật
- Thêm crop/fit/position policy
- Thêm placeholder explicit cho optional asset
```

## P3 — Audio-first composition

```text
- Wire global voiceover bằng <Audio>
- Thêm audio metadata
- Import word timestamps
- Chuyển caption sang timestamp-based
- Derive scene timing từ narration range
```

## P4 — Video asset support

```text
- Thêm video slot
- Hỗ trợ trim, loop, mute, volume
- Probe duration/fps/resolution
- Validate scene duration với clip duration
```

## P5 — Template capability registry

```text
- Tách adapter / preset / template
- Thêm slot schema
- Thêm supported intents
- Thêm supported aspect ratio
- Loại alias không tạo visual difference thực
```

## P6 — Visual-flow asset compilation

```text
- Implement image/local-file/repository collectors
- Tạo asset manifest trong pipeline
- Compile media block thành asset binding
- Bỏ hard-code `assets: []`
```

## P7 — Rule-based retrieval

```text
- Metadata filter
- Tag matching
- Scene hint matching
- Orientation and duration filter
- Continuity and reuse penalty
```

## P8 — Semantic retrieval

```text
- Multilingual embedding evaluation
- Transformers.js reranking
- LanceDB chỉ khi asset scale chứng minh cần thiết
```

---

## 24. Quyết định kiến trúc đề xuất

### Nên áp dụng ngay

- Giữ `video-map.json` làm contract trung tâm.
- Giữ component registry thay vì scene-specific branching.
- Thêm scene-level asset binding.
- Thêm template slot validation.
- Tạo asset resolver trước adapter.
- Refactor `ImageCarouselAdapter` thành media-backed adapter thật.

### Nên thiết kế ngay, triển khai sau P0–P3

- Asset metadata giàu thông tin.
- Adapter/preset/template separation.
- Global audio tracks.
- Visual-flow media collectors.

### Chưa cần build ngay

- LanceDB production index.
- Semantic search cho toàn bộ thư viện.
- Complex computer-vision tagging.
- Tự động chọn stock footage từ external API.

---

## 25. Success criteria

Kiến trúc asset-component được xem là hoàn thành phiên bản đầu khi:

```text
1. Một asset trong clean-brief được normalize thành asset manifest.
2. Scene bind asset bằng stable asset ID.
3. Validator xác nhận asset phù hợp với template slot.
4. Adapter nhận resolved asset, không nhận toàn bộ global array.
5. ImageCarouselAdapter render image thật.
6. Composition render voiceover audio thật.
7. Missing/unsafe/wrong-kind asset fail trước render.
8. Render report ghi lại asset IDs đã dùng.
9. Cùng video-map + cùng asset checksum tạo output tái lập được.
```

---

## 26. Kết luận

Lucida đã có xương sống phù hợp cho một renderer có kiểm soát:

```text
source ingestion
→ reviewable contract
→ component registry
→ deterministic Remotion render
```

Nhưng asset hiện chưa phải first-class input của scene component.

Kiến trúc cần hoàn thiện theo thứ tự:

```text
Asset metadata
→ Scene asset binding
→ Template slot schema
→ Asset resolver
→ Image/video/audio renderer
→ Audio-first timeline
→ Rule-based retrieval
→ Semantic retrieval
```

Ưu tiên đúng không phải thêm nhiều template ID hoặc đưa vector database vào sớm. Ưu tiên đúng là đóng kín chuỗi dữ liệu:

```text
usableAssets
→ asset manifest
→ assetBindings
→ resolved adapter props
→ Remotion media primitives
```

Khi chuỗi này hoàn thiện, asset và component mới thực sự trở thành nguồn input deterministic, traceable và reusable cho Remotion render.