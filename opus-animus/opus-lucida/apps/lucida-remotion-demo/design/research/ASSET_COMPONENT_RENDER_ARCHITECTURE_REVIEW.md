# Đánh giá kiến trúc Asset–Component và Audio-First Input cho Lucida Remotion

> Phạm vi: `opus-animus/opus-lucida/apps/lucida-remotion-demo`
>
> Ngày cập nhật: 2026-07-12
>
> Phiên bản: 2.0
>
> Loại tài liệu: current-state review + architecture decision + implementation research
>
> Mục tiêu: xác định cách script, audio, timestamp, asset và React component được compile thành input deterministic cho Remotion render.

---

## 1. Executive summary

Lucida đã có ba nền tảng đúng:

1. `video-map.json` là contract reviewable giữa planning và renderer.
2. `templateId` được resolve qua component registry thay vì viết scene-specific branch trong Composition.
3. Raw source được phân loại thành content truth, style reference, embeddable asset hoặc context-only trước mapping.

Tuy nhiên, hệ thống hiện còn hai production blocker:

```text
A. Asset pipeline mới ở mức asset-aware

video-map.assets[]
→ truyền toàn bộ xuống adapter
→ scene không bind asset cụ thể
→ phần lớn adapter không consume media thật

B. Timeline chưa audio-first

script
→ durationSec ước lượng
→ caption chia đều theo group/từ
→ Remotion render không có voice track
```

Kiến trúc đích:

```text
ApprovedScript
→ VoiceTrack
→ TimedScript
→ CaptionPlan
→ narration-based Scene Timeline
→ Scene Asset Binding
→ ResolvedVideoInput
→ Remotion Audio + Components + Captions
→ Render + Sync QA
```

### Quyết định ưu tiên cập nhật

Sau khi nghiên cứu audio flow, P0 được tách thành hai vertical slice:

```text
P0-A — Audio Foundation MVP        [thực hiện trước]
P0-B — Scene Asset Binding MVP     [thực hiện ngay sau]
```

Lý do thực hiện audio trước:

- video hiện không có narration track;
- scene duration và caption đều đang sai source of truth;
- lỗi subtitle không khớp giọng đọc đã xuất hiện trực tiếp trong QA video;
- wire một file audio có sẵn vào Remotion là vertical slice nhỏ, ít phụ thuộc;
- sau khi audio timeline ổn định, scene và visual asset mới có timestamp chính xác để bind.

Không bắt đầu bằng TTS provider integration. MVP đầu tiên dùng một voice file đã sinh sẵn để chứng minh toàn bộ đường ống render và timing.

---

## 2. Current-state architecture

## 2.1 Production flow hiện tại

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

Điểm đúng:

- không nhảy thẳng từ raw script sang React;
- mapping có intermediate artifact;
- visual mapping sửa ở JSON;
- layout/render bug sửa ở component;
- renderer có thể nhận `videoMap` qua render props.

## 2.2 Visual-flow hiện tại

```text
VisualFlowConfig
→ collect
→ sanitize
→ normalize
→ map visual scenes
→ compile video-map
→ render-props.json
→ Remotion render
```

Giới hạn:

```text
compileVideoMap()
→ assets: []
```

Visual-flow mới compile text/event thành component content, chưa compile media asset hoặc audio timeline.

---

## 3. Code findings

Các file chính:

```text
video-map.json
schemas/video-map.schema.json
src/data.ts
src/Composition.tsx
src/Root.tsx
src/templateRegistry.tsx
src/template-registry-map.json
scripts/run-whisperx.ps1
scripts/validate-video-map.mjs
pipeline/compilers/video-map.mjs
design/workflow/create/G02_SCRIPT_TIMING.md
```

### 3.1 Asset contract hiện tại

```ts
type VisualAsset = {
  id: string;
  src: string;
  kind: "image" | "video" | "audio";
  usage: "embed_asset" | "style_reference" | "context_only";
  alt?: string;
};
```

Gap:

- scene không có `assetBindings`;
- asset metadata quá mỏng;
- không validate file existence;
- không validate slot compatibility;
- không có resolved asset props;
- image/video/audio chưa được render theo policy dùng chung.

### 3.2 Adapter contract hiện tại

```ts
type TemplateAdapterProps = {
  scene: VideoScene;
  localFrame: number;
  durationFrames: number;
  theme: Theme;
  assets: VisualAsset[];
};
```

Mọi adapter nhận toàn bộ global assets. Kiến trúc mục tiêu phải chuyển thành:

```text
Adapter receives all assets
→ không nên giữ

Adapter receives resolved slot assets only
→ mục tiêu
```

### 3.3 Audio hiện tại

- `VisualAsset.kind` có `audio`.
- `Composition.tsx` không render audio.
- `package.json` chưa có `@remotion/media` và `@remotion/captions`.
- `Root.tsx` cộng `scene.durationFrames` để xác định composition duration.
- `SubtitleBar` chia đều scene duration cho caption groups và words.
- `run-whisperx.ps1` chạy WhisperX riêng nhưng output chưa được consume.
- `G02_SCRIPT_TIMING.md` mô tả target flow nhưng đang ở trạng thái roadmap.

Kết luận:

```text
Audio contract có ý tưởng
Audio tool có tồn tại
Audio runtime integration chưa tồn tại
```

---

## 4. Architecture decision: audio is a global timeline concern

Audio narration không nên được xử lý như card-level asset của một scene.

Cần tách:

```text
Global tracks
- voiceover
- music bed

Scene-local tracks
- sound effect
- clip audio
```

Voiceover là master timeline của toàn video.

```text
Voice duration
→ composition duration

Word timestamps
→ caption active word

Sentence/phrase timestamps
→ caption page boundaries

Narration beats
→ scene start/end

Scene timeline
→ component and asset timing
```

`durationSec` trong scene có thể được giữ làm derived/debug field, nhưng không còn là source of truth.

---

## 5. Target audio flow

```text
ApprovedScript
        │
        ▼
Vietnamese Text Normalizer
        │
        ▼
TTS Provider Adapter / Recorded Voice Import
        │
        ▼
Raw Voice Audio
        │
        ▼
Audio Normalize + QA
        │
        ├── canonical format
        ├── loudness
        ├── clipping
        ├── silence
        └── checksum
        │
        ▼
VoiceTrack + audio-metadata.json
        │
        ▼
WhisperX Forced Alignment
        │
        ▼
whisperx.raw.json
        │
        ▼
Script-to-Audio Reconciliation
        │
        ▼
TimedScript
        │
        ▼
Caption Phrase Chunker
        │
        ▼
CaptionPlan
        │
        ▼
Narration Beat / Scene Timeline Resolver
        │
        ▼
video-map.json + render-props.json
        │
        ▼
Remotion <Audio> + timestamp captions + visual scenes
        │
        ▼
Render + Audio/Caption Sync QA
```

---

## 6. TTS provider strategy

Renderer và timing pipeline phải provider-neutral.

```ts
interface VoiceProvider {
  synthesize(input: VoiceSynthesisRequest): Promise<GeneratedVoice>;
}
```

Provider order đề xuất cho Lucida:

```text
1. Pre-generated/local voice file
   → dùng cho Audio Foundation MVP

2. ElevenLabs adapter
   → production narration ổn định đầu tiên

3. VieNeu-TTS adapter
   → local Vietnamese provider, batch lớn và privacy

4. Edge TTS adapter
   → preview nhanh hoặc fallback, đặc biệt khi cần Japanese voice
```

Không để provider trả thẳng input cho renderer. Mọi provider phải qua cùng bước normalize, probe, checksum, alignment và QA.

```text
Provider-specific output
→ canonical VoiceTrack
→ provider-independent downstream pipeline
```

---

## 7. Canonical audio format

Khuyến nghị internal master:

```text
WAV PCM
48 kHz
mono cho narration
```

Lý do:

- tránh transcode lặp lại trong các bước alignment và QA;
- dễ probe và debug;
- output MP4 có thể encode audio ở render stage;
- cùng một canonical input tăng tính reproducible.

TTS MP3 vẫn được giữ làm raw artifact, nhưng renderer nên ưu tiên normalized master.

Project loudness default đề xuất:

```text
Integrated loudness: -14 LUFS
Maximum true peak:    -1 dBTP
```

Giá trị này phải configurable theo channel profile. Với file production, ưu tiên loudness normalization hai pass thay vì chỉ tăng volume trong React.

---

## 8. Artifact contracts

## 8.1 VoiceTrack

```ts
type VoiceTrack = {
  id: string;
  assetId: string;
  provider: "imported" | "elevenlabs" | "vieneu" | "edge-tts";
  src: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  checksum: string;
  scriptChecksum: string;
  normalization: {
    format: "wav-pcm";
    targetLufs: number;
    truePeakDb: number;
  };
};
```

## 8.2 TimedScript

```ts
type TimedWord = {
  id: string;
  text: string;
  normalizedText: string;
  startMs: number;
  endMs: number;
  confidence: number | null;
  alignment: "exact" | "normalized" | "interpolated" | "unresolved";
};

type TimedPhrase = {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  wordIds: string[];
};

type TimedScript = {
  scriptChecksum: string;
  voiceChecksum: string;
  durationMs: number;
  words: TimedWord[];
  phrases: TimedPhrase[];
};
```

## 8.3 CaptionPlan

```ts
type CaptionPage = {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  wordIds: string[];
  lines: string[][];
  weight: "normal" | "compact";
};

type CaptionPlan = {
  timedScriptChecksum: string;
  pages: CaptionPage[];
};
```

## 8.4 AudioPlan trong render contract

```ts
type AudioTrack = {
  id: string;
  assetId: string;
  role: "voiceover" | "music" | "sound_effect" | "clip_audio";
  startMs: number;
  endMs?: number;
  trimStartMs?: number;
  trimEndMs?: number;
  volume: number;
  loop?: boolean;
};

type AudioPlan = {
  masterTrackId: string;
  durationMs: number;
  tracks: AudioTrack[];
};
```

Top-level `video-map.json` nên dần chuyển thành:

```ts
type VideoMap = {
  video: VideoMetadata;
  theme: Theme;
  audio: AudioPlan;
  timing: {
    timedScriptRef: string;
    captionPlanRef: string;
  };
  assets: AssetManifestItem[];
  scenes: VideoMapScene[];
};
```

---

## 9. Script lock and alignment policy

Approved script phải là content truth. WhisperX chỉ là timing evidence.

Không được dùng ASR transcript để âm thầm viết lại script.

```text
ApprovedScript.text
= text authority

WhisperX words
= timing authority candidate
```

Reconciliation pipeline:

```text
1. Normalize Unicode NFC.
2. Normalize whitespace and punctuation variants.
3. Expand or map known technical tokens.
4. Align approved-script tokens với WhisperX tokens.
5. Giữ timestamp cho exact/normalized matches.
6. Interpolate only inside a trusted phrase boundary.
7. Mark unresolved token thay vì tự đoán toàn timeline.
8. Fail QA nếu coverage dưới threshold.
```

Đặc biệt cần dictionary cho video AI/engineering:

```text
AI
API
CLI
GitHub
ChatGPT
Claude
Gemini
Cursor
Remotion
WhisperX
```

WhisperX có thể không cấp timestamp cho một số token ngoài dictionary alignment model, số hoặc punctuation. Vì vậy pipeline phải lưu `alignment` status trên từng word.

---

## 10. Caption behavior requirement

Yêu cầu CC của Lucida:

```text
Hiện một câu/cụm ngắn
→ giữ nguyên page cho tới endMs
→ highlight/jump từng từ theo word timestamp
→ hết phrase mới chuyển page
```

Không tiếp tục dùng:

```text
scene duration / number of groups / number of words
```

Remotion `Caption` standard có thể được dùng làm token interchange:

```ts
type Caption = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
};
```

`createTikTokStyleCaptions()` có thể hỗ trợ grouping theo khoảng thời gian, nhưng không nên là rule duy nhất. Lucida cần phrase boundaries đã lock từ ApprovedScript để bảo đảm một câu ngắn xuất hiện đầy đủ rồi mới chuyển câu.

Recommended approach:

```text
TimedScript words
+ locked phrase boundaries
→ Lucida CaptionPlan
→ active word determined by absolute timestamp
```

---

## 11. Scene timing contract

Scene nên bind vào narration range:

```ts
type VideoMapScene = {
  id: string;
  startMs: number;
  endMs: number;
  narrationRange: {
    fromPhraseId: string;
    toPhraseId: string;
  };
  durationSec?: number; // derived only
};
```

Rules:

- `startMs` lấy từ phrase đầu tiên của scene.
- `endMs` lấy từ phrase cuối cùng, cộng configurable visual tail nếu cần.
- Scene không được cắt giữa một word.
- Transition overlap phải được resolve rõ trong timeline compiler.
- Visual mapping có thể đổi nhưng không được sửa narration timing.

---

## 12. Remotion implementation research

## 12.1 Dependency direction

Với Remotion `4.0.486`, thêm các package cùng version:

```json
{
  "@remotion/media": "4.0.486",
  "@remotion/captions": "4.0.486"
}
```

Audio mới nên dùng:

```ts
import {Audio} from "@remotion/media";
```

Không ưu tiên API audio cũ từ package `remotion`.

## 12.2 Public asset path

File local dùng trong browser/render bundle nên được normalize vào `public/`:

```text
public/
└── runs/
    └── <run-id>/
        └── audio/
            └── voice.wav
```

Contract lưu:

```json
{
  "src": "runs/<run-id>/audio/voice.wav"
}
```

Renderer resolve bằng:

```ts
staticFile(track.src)
```

Không truyền absolute Windows filesystem path vào React component.

## 12.3 AudioLayer

```tsx
import {Audio} from "@remotion/media";
import {staticFile, useVideoConfig} from "remotion";

const msToFrames = (ms: number, fps: number) =>
  Math.round((ms / 1000) * fps);

export const AudioLayer: React.FC<{plan: ResolvedAudioPlan}> = ({plan}) => {
  const {fps} = useVideoConfig();

  return (
    <>
      {plan.tracks.map((track) => (
        <Audio
          key={track.id}
          name={`${track.role}:${track.id}`}
          src={staticFile(track.src)}
          from={msToFrames(track.startMs, fps)}
          durationInFrames={
            track.endMs === undefined
              ? undefined
              : msToFrames(track.endMs - track.startMs, fps)
          }
          trimBefore={msToFrames(track.trimStartMs ?? 0, fps)}
          trimAfter={
            track.trimEndMs === undefined
              ? undefined
              : msToFrames(track.trimEndMs, fps)
          }
          volume={track.volume}
          loop={track.loop}
          onError={() => "fail"}
          disallowFallbackToHtml5Audio
        />
      ))}
    </>
  );
};
```

Global audio layer nên nằm cạnh scene renderer, không nằm trong từng visual adapter:

```tsx
<AbsoluteFill>
  <AudioLayer plan={input.audio} />
  <SceneRenderer input={input} />
</AbsoluteFill>
```

## 12.4 Dynamic metadata

`calculateMetadata()` phải dùng resolved audio duration:

```ts
const calculateMetadata: CalculateMetadataFunction<MyCompositionProps> = async ({props}) => {
  const resolved = await resolveVideoInput(props.videoMap ?? defaultVideoMap);

  return {
    durationInFrames: Math.ceil(
      (resolved.timeline.durationMs / 1000) * resolved.video.fps,
    ),
    fps: resolved.video.fps,
    width: resolved.video.width,
    height: resolved.video.height,
    defaultSampleRate: 48000,
    props: {
      ...props,
      resolvedVideo: resolved,
    },
  };
};
```

`calculateMetadata()` có thể async, nhưng dữ liệu trả về phải JSON-serializable.

## 12.5 Media metadata probing

Không dùng duration do LLM hoặc filename cung cấp.

Probe trước render:

```text
audio src
→ media metadata probe
→ durationMs
→ sample rate
→ channels
→ checksum
```

Remotion hiện khuyến nghị Mediabunny cho metadata của audio/video. `getAudioDurationInSeconds()` đã deprecated.

---

## 13. Audio QA

## 13.1 File QA

```text
- file exists
- readable
- checksum matches
- supported format
- duration > 0
- sample rate declared
- no clipping
- no unexpected long silence
- normalized output exists
```

## 13.2 Script/audio QA

```text
- script checksum matches VoiceTrack.scriptChecksum
- 100% phrase coverage
- no phrase reordered
- no silent script rewrite from ASR output
- unresolved word count below threshold
- word times stay inside phrase times
```

## 13.3 Timeline QA

```text
- composition duration equals master audio duration ± allowed tail
- first caption does not appear before speech
- page changes only at phrase boundary
- active word follows word timestamp
- final caption ends before/equal audio end
- scene start/end covers narration range
```

## 13.4 Mix QA

```text
- voiceover remains intelligible
- music does not mask speech
- SFX does not clip master bus
- final true peak stays inside configured limit
```

---

## 14. Audio Foundation MVP

Mục tiêu duy nhất:

> Render một video Lucida hiện có với một voice file local, composition duration lấy từ audio metadata, và output MP4 thực sự chứa audio.

Scope:

```text
1. Thêm @remotion/media.
2. Tạo một audio asset local trong public/.
3. Thêm top-level audio plan tối thiểu vào video-map.
4. Probe duration trước render.
5. Tạo AudioLayer.
6. Wire AudioLayer vào Composition.
7. calculateMetadata lấy duration từ master voice track.
8. Preflight fail khi file audio thiếu hoặc không đọc được.
9. Render MP4 và verify có audio stream.
```

Chưa làm trong slice này:

```text
- tự động gọi ElevenLabs/VieNeu
- music bed
- sound effects
- WhisperX integration
- timestamp caption
- semantic scene retiming
```

### Definition of Done

```text
1. video-map có một voiceover track.
2. Voice file được resolve bằng stable asset ID.
3. Render fail trước Remotion nếu audio file không tồn tại.
4. Composition duration derive từ audio metadata.
5. MP4 output có audio stream.
6. Audio không bị trim ngoài ý muốn.
7. render-report ghi voice asset ID, duration và checksum.
8. Cùng input và checksum tạo timeline giống nhau.
```

---

## 15. TimedScript and Caption Lock MVP

Thực hiện ngay sau Audio Foundation MVP.

```text
voice.wav
→ run-whisperx.ps1
→ whisperx.raw.json
→ normalize-whisperx.mjs
→ reconcile-approved-script.mjs
→ timed-script.json
→ build-caption-plan.mjs
→ caption-plan.json
→ timestamp SubtitleBar
```

Cần thêm scripts:

```text
scripts/audio/probe-audio.mjs
scripts/audio/normalize-audio.mjs
scripts/audio/normalize-whisperx.mjs
scripts/audio/reconcile-approved-script.mjs
scripts/audio/build-caption-plan.mjs
scripts/audio/validate-timed-script.mjs
```

`SubtitleBar` chuyển từ local linear timing sang absolute timing:

```text
currentFrame
→ absoluteMs
→ active CaptionPage
→ active TimedWord
→ render page
→ animate active word
```

### Definition of Done

```text
1. Caption page đổi theo startMs/endMs thật.
2. Mỗi page là một câu/cụm ngắn đã lock.
3. Active word bám timestamp.
4. Không thêm/xóa/đổi thứ tự script.
5. Missing timestamp được flag rõ.
6. Scene có thể bind narrationRange bằng phrase ID.
```

---

## 16. Scene Asset Binding MVP

Thực hiện sau khi audio timeline đã có source of truth.

```ts
type SceneAssetBindings = {
  background?: AssetBinding;
  hero?: AssetBinding;
  items?: AssetBinding[];
  overlay?: AssetBinding;
  soundEffects?: AssetBinding[];
};
```

Voiceover không đặt trong từng scene asset binding; nó nằm ở global `AudioPlan`.

Vertical slice đầu tiên:

> Một scene `image-carousel` bind 2–5 local image assets và render đúng asset theo ID.

Required work:

```text
- thêm assetBindings vào VideoMapScene
- tạo template slot definition
- tạo resolveSceneAssets()
- refactor ImageCarouselAdapter để render <Img>
- validate ID, kind, min/max count và file existence
- ghi used asset IDs vào render-report
```

---

## 17. Proposed repository structure

```text
src/
├── audio/
│   ├── types.ts
│   ├── AudioLayer.tsx
│   ├── resolveAudioPlan.ts
│   └── captionTiming.ts
├── assets/
│   ├── types.ts
│   ├── resolver.ts
│   ├── validators.ts
│   └── AssetRenderer.tsx
├── timeline/
│   ├── resolveTimeline.ts
│   ├── resolveSceneRanges.ts
│   └── frameTime.ts
├── registry/
│   ├── templateDefinitions.ts
│   ├── templateRegistry.ts
│   └── slotValidation.ts
├── adapters/
├── data.ts
├── Composition.tsx
└── Root.tsx

scripts/
├── audio/
│   ├── probe-audio.mjs
│   ├── normalize-audio.mjs
│   ├── normalize-whisperx.mjs
│   ├── reconcile-approved-script.mjs
│   ├── build-caption-plan.mjs
│   └── validate-timed-script.mjs
├── validate-video-map.mjs
└── render-run.mjs

pipeline/
├── audio/
├── assets/
├── collectors/
├── processors/
├── mappers/
├── compilers/
└── validators/
```

Run artifacts:

```text
pipeline/runs/<run-id>/
├── approved-script.json
├── audio/
│   ├── voice.raw.mp3
│   ├── voice.wav
│   └── audio-metadata.json
├── timing/
│   ├── whisperx.raw.json
│   ├── timed-script.json
│   └── caption-plan.json
├── video-map.json
├── render-props.json
├── output/
│   └── video.mp4
└── render-report.json
```

---

## 18. Updated roadmap

## P0-A — Audio Foundation MVP

```text
- add @remotion/media
- add AudioPlan contract
- normalize public asset path
- probe master audio duration
- create AudioLayer
- derive composition duration from audio
- verify output audio stream
```

## P0-B — TimedScript and Caption Lock

```text
- consume WhisperX JSON
- reconcile with ApprovedScript
- create word/phrase timestamps
- build short caption pages
- replace linear SubtitleBar timing
- bind scenes to narration ranges
```

## P1 — Scene Asset Binding MVP

```text
- assetBindings contract
- template slot validation
- resolveSceneAssets()
- real image carousel
- asset usage report
```

## P2 — TTS provider adapters

```text
- provider-neutral interface
- ElevenLabs first production adapter
- VieNeu local adapter
- Edge TTS preview/fallback adapter
- all outputs pass canonical audio pipeline
```

## P3 — Video and audio mix support

```text
- video trim/loop/mute
- music bed
- SFX tracks
- volume envelope and ducking
- mix QA
```

## P4 — Template capability registry

```text
- adapter / preset / template separation
- asset slots
- supported intents
- aspect ratio
- render cost
- remove aliases without real visual difference
```

## P5 — Visual-flow asset compilation

```text
- image/local-file/repository collectors
- compile media blocks
- remove hard-coded assets: []
- preserve provenance through render report
```

## P6 — Rule-based retrieval

```text
- metadata filter
- tag and scene-hint match
- orientation and duration checks
- continuity and reuse penalty
```

## P7 — Semantic retrieval

```text
- multilingual embedding evaluation
- Transformers.js reranking
- LanceDB only after benchmark proves need
```

---

## 19. Engineering rules

1. Audio timeline is the source of truth.
2. ApprovedScript is text truth; ASR must not rewrite it.
3. Renderer must not call a TTS provider.
4. TTS, alignment and render are separate deterministic stages.
5. `video-map.json` remains reviewable before render.
6. Voiceover is global audio, not scene-local visual asset.
7. Scene duration is derived from narration range.
8. Adapter receives resolved assets only.
9. Missing required media fails before render.
10. Every generated artifact has checksum and provenance.
11. LLM may propose chunk boundaries but cannot invent timestamps.
12. Timing conversion uses one shared ms/frame utility.

---

## 20. Final recommendation

Next implementation should not be semantic retrieval, more template aliases, or a full TTS integration.

Thứ tự đúng:

```text
1. Add one existing voice file to Remotion output.
2. Make audio duration drive composition metadata.
3. Compile WhisperX output into TimedScript.
4. Lock caption phrases and animate words by timestamp.
5. Bind scene boundaries to narration ranges.
6. Add deterministic scene asset binding.
7. Only then automate TTS providers and asset retrieval.
```

Đây là đường ngắn nhất để giải quyết hai vấn đề production đang thấy rõ nhất:

```text
- video chưa có audio track
- subtitle đúng style nhưng sai nhịp
```

---

## 21. Primary references

- Remotion `<Audio>` from `@remotion/media`: https://www.remotion.dev/docs/media/audio
- Remotion `calculateMetadata()`: https://www.remotion.dev/docs/calculate-metadata
- Remotion media metadata with Mediabunny: https://www.remotion.dev/docs/mediabunny/metadata
- Remotion Caption contract: https://www.remotion.dev/docs/captions/caption
- Remotion TikTok-style caption grouping: https://www.remotion.dev/docs/captions/create-tiktok-style-captions
- WhisperX repository and alignment limitations: https://github.com/m-bain/whisperX
- FFmpeg `loudnorm`: https://ffmpeg.org/ffmpeg-filters.html#loudnorm
