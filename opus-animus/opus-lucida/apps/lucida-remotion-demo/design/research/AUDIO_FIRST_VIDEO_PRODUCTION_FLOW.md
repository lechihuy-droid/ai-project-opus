# Audio-First Video Production Flow for Lucida Remotion

> Phạm vi: `opus-animus/opus-lucida/apps/lucida-remotion-demo`
>
> Ngày: 2026-07-12
>
> Trạng thái: research proposal — chưa implement đầy đủ trong runtime
>
> Mục tiêu: định nghĩa production flow để audio, subtitle, scene, visual cue, component và asset cùng chạy trên một timeline xác định; đồng thời xác định bộ input cần thiết ngoài script và audio.

---

## 1. Executive summary

Một video có audio không đồng nghĩa với một video được dựng khớp audio.

Lucida hiện có thể đi theo hướng:

```text
Script
→ scene duration ước lượng
→ caption chia đều theo câu/từ
→ visual component
→ Remotion render
```

Flow này phù hợp cho prototype nhưng chưa đủ cho production vì:

- composition duration chưa lấy voice track làm source of truth;
- caption timing chưa dựa trên word timestamp thật;
- scene boundary chưa dựa trên semantic beat của narration;
- component animation chưa có visual cue timeline;
- script không chứa đủ thông tin về platform, brand, visual direction, asset hoặc QA;
- một thay đổi audio có thể làm toàn bộ visual timing cũ trở nên không hợp lệ.

Kiến trúc mục tiêu:

```text
VideoProjectInput
        │
        ▼
Voice generation / voice import
        │
        ▼
Audio normalize + probe + checksum
        │
        ▼
Forced alignment
        │
        ▼
TimedScript
        ├── CaptionPlan
        ├── NarrativeBeatMap
        └── PauseMap
                │
                ▼
             ScenePlan
                │
                ▼
          VisualCuePlan
                │
                ▼
   Component + Asset Binding
                │
                ▼
      ResolvedVideoTimeline
                │
                ▼
Remotion Audio + Caption + Visual
                │
                ▼
       Sync QA + Render Report
```

Ba nguyên tắc nền tảng:

```text
ApprovedScript = text truth
VoiceTrack     = timeline truth
WhisperX       = timing evidence
```

WhisperX không được tự sửa script. Scene không được derive trực tiếp từ caption page. Visual không nên thay đổi theo từng word.

---

## 2. Current-state findings

Repo hiện dùng Remotion `4.0.486` nhưng chưa khai báo:

```text
@remotion/media
@remotion/captions
```

Các dấu hiệu hiện tại:

- `VisualAsset.kind` đã có `audio`;
- Composition chưa render một global voice track;
- scene duration vẫn là input chính để tính timeline;
- subtitle timing đang được derive tuyến tính từ scene duration;
- `scripts/run-whisperx.ps1` đã tồn tại nhưng output chưa được compile vào runtime;
- `design/workflow/create/G02_SCRIPT_TIMING.md` mới là roadmap;
- visual-flow compiler vẫn hard-code `assets: []`.

Kết luận:

```text
Audio capability đã được nghĩ tới
Alignment tool đã tồn tại
Runtime audio-first pipeline chưa tồn tại
```

---

## 3. Một video cần ba timeline độc lập

## 3.1 Audio timeline

Audio timeline là trục thời gian tuyệt đối của video.

Nó chứa:

```text
word timestamps
phrase timestamps
speech pauses
silence đầu/cuối
emphasis positions
voice track duration
music/SFX tracks
```

Audio timeline quyết định:

- composition duration;
- caption active word;
- phrase display range;
- narration coverage;
- scene narration range.

Audio timeline không quyết định trực tiếp component nào cần render.

---

## 3.2 Editorial beat timeline

Editorial beat trả lời:

> Tại thời điểm này, người xem cần hiểu điều gì?

Một phrase hoặc một caption page chưa chắc là một editorial beat. Một beat có thể chứa nhiều câu ngắn; ngược lại, một câu dài có thể chứa nhiều beat.

```ts
type NarrativeBeatPurpose =
  | "hook"
  | "context"
  | "problem"
  | "explanation"
  | "comparison"
  | "reveal"
  | "proof"
  | "takeaway"
  | "cta";

type NarrativeBeat = {
  id: string;
  startMs: number;
  endMs: number;

  purpose: NarrativeBeatPurpose;
  message: string;
  emphasisWords: string[];

  visualIntent: string;
  preferredRepresentation:
    | "kinetic_text"
    | "diagram"
    | "code"
    | "terminal"
    | "ui_demo"
    | "image"
    | "video"
    | "chart";

  sourcePhraseIds: string[];
};
```

Editorial beat quyết định:

- khi nào cần đổi visual concept;
- khi nào cần reveal hoặc comparison;
- visual family nào phù hợp;
- một scene cần chứa bao nhiêu caption pages.

---

## 3.3 Visual cue timeline

Visual cue trả lời:

> Component phải làm gì tại đúng thời điểm nào?

```ts
type VisualCueAction =
  | "enter"
  | "exit"
  | "reveal"
  | "highlight"
  | "focus"
  | "connect"
  | "zoom"
  | "hold"
  | "transition";

type VisualCue = {
  id: string;
  sceneId: string;
  beatId: string;

  atMs: number;
  durationMs?: number;

  action: VisualCueAction;
  targetId: string;
  preset?: string;
  easing?: string;
};
```

Ví dụ:

```text
00:00.000 scene enter
00:00.350 title enter
00:01.100 card-prompt reveal
00:02.000 card-tool reveal
00:02.750 card-memory reveal
00:03.500 connector connect
00:04.400 architecture hold
00:04.900 scene transition
```

Rule quan trọng:

```text
Word timestamp
→ subtitle highlight

Phrase timestamp
→ caption page

Narrative beat
→ visual concept / scene

Visual cue
→ component animation
```

Không dùng mỗi word timestamp để kích hoạt một visual mới. Điều đó tạo ra video quá bận và làm giảm khả năng tiếp nhận thông tin.

---

## 4. Target production flow

## 4.1 Stage A — Project input lock

Input cần được freeze trước khi tạo voice:

```text
ApprovedScript
PlatformProfile
BrandProfile
CaptionPolicy
PronunciationLexicon
VisualBrief
AssetManifest
TemplateCapabilities
AudioMixPolicy
QAProfile
```

Output:

```text
VideoProjectInput
project-input.checksum
```

---

## 4.2 Stage B — Voice generation or import

Voice có thể đến từ:

```text
pre-generated local file
recorded human voice
ElevenLabs
VieNeu-TTS
Edge TTS
provider khác
```

Renderer không được gọi trực tiếp TTS provider.

Mọi provider phải trả về một canonical `VoiceTrack`:

```ts
type VoiceTrack = {
  id: string;
  assetId: string;
  provider: "imported" | "recorded" | "elevenlabs" | "vieneu" | "edge-tts";
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

Canonical narration master đề xuất:

```text
WAV PCM
48 kHz
mono
```

Raw provider output được giữ để trace, nhưng downstream pipeline chỉ consume normalized master.

---

## 4.3 Stage C — Audio normalize and probe

```text
raw voice
→ format normalization
→ loudness normalization
→ silence analysis
→ clipping analysis
→ metadata probe
→ checksum
→ canonical VoiceTrack
```

Metadata phải lấy bằng tool, không do LLM suy đoán:

```text
durationMs
sampleRate
channels
codec
bytes
checksum
```

Project default đề xuất:

```text
Integrated loudness: -14 LUFS
Maximum true peak:    -1 dBTP
```

Giá trị này phải configurable theo channel profile.

---

## 4.4 Stage D — Forced alignment

```text
ApprovedScript
+ VoiceTrack
+ PronunciationLexicon
→ WhisperX
→ whisperx.raw.json
→ reconciliation
→ TimedScript
```

Approved script là content authority. WhisperX transcript chỉ là timing candidate.

Reconciliation policy:

```text
1. Unicode NFC normalization.
2. Whitespace and punctuation normalization.
3. Apply technical pronunciation dictionary.
4. Align approved-script tokens với ASR tokens.
5. Preserve exact/normalized timestamp matches.
6. Interpolate only inside trusted phrase boundaries.
7. Mark unresolved words explicitly.
8. Fail QA when alignment coverage is below threshold.
```

Contract:

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

---

## 4.5 Stage E — Caption plan

Caption requirement của Lucida:

```text
Một câu/cụm ngắn xuất hiện đầy đủ
→ page giữ nguyên trong toàn phrase range
→ từng từ jump/highlight theo timestamp
→ hết phrase mới đổi page
```

Không lấy WhisperX segment làm caption page mặc định.

Caption page cần được tạo từ:

```text
ApprovedScript phrase boundary
+ punctuation
+ semantic chunk
+ reading length
+ word timestamps
+ CaptionPolicy
```

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

A caption page is not a scene.

Một scene thông thường có thể chứa từ hai đến bốn caption pages.

---

## 4.6 Stage F — Pause map

Pause không chỉ là phần thừa cần cắt.

```ts
type AudioPause = {
  id: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  role: "natural" | "emphasis" | "transition" | "trim_candidate";
};
```

Pause có thể được dùng để:

- hold một diagram;
- cho người xem đọc số liệu;
- tạo reveal;
- đổi scene;
- zoom hoặc focus;
- tạo nhấn mạnh.

Chỉ `trim_candidate` mới nên được cân nhắc loại bỏ.

---

## 4.7 Stage G — Narrative beat mapping

```text
TimedScript
+ ApprovedScript structure
+ VisualBrief
→ NarrativeBeatMap
```

LLM có thể đề xuất beat boundary và visual intent nhưng không được phát minh timestamp. Timestamp của beat phải được resolve từ phrase/word range đã align.

Output:

```ts
type NarrativeBeatMap = {
  timedScriptChecksum: string;
  beats: NarrativeBeat[];
};
```

---

## 4.8 Stage H — Scene plan

Scene boundary phải được xây trên narrative beat, không phải caption page.

```ts
type ScenePlanItem = {
  id: string;
  startMs: number;
  endMs: number;

  beatIds: string[];
  narrationRange: {
    fromPhraseId: string;
    toPhraseId: string;
  };

  intent: string;
  templateId: string;
  transitionIn?: string;
  transitionOut?: string;
};
```

Rules:

- scene không được cắt giữa một word;
- scene có thể chứa nhiều beats nếu visual concept vẫn liên tục;
- transition visual không được fade voiceover;
- voiceover chạy global xuyên qua scene transition;
- `durationSec` chỉ là derived field để debug;
- scene start/end dùng milliseconds làm canonical unit.

---

## 4.9 Stage I — Visual cue planning

```text
ScenePlan
+ NarrativeBeatMap
+ TemplateCapabilities
→ VisualCuePlan
```

```ts
type VisualCuePlan = {
  scenePlanChecksum: string;
  cues: VisualCue[];
};
```

Mỗi cue phải target một object/component ID cụ thể.

Validator cần kiểm tra:

```text
cue nằm trong scene range
cue target tồn tại
không reveal cùng object hai lần ngoài ý muốn
hold duration hợp lệ
transition không cắt narration
cue density không vượt pacing policy
```

---

## 4.10 Stage J — Component and asset binding

```text
ScenePlan
+ VisualCuePlan
+ AssetManifest
+ TemplateCapabilities
→ ResolvedVideoTimeline
```

Voiceover là global track, không đặt trong scene asset bindings.

```ts
type SceneAssetBindings = {
  background?: AssetBinding;
  hero?: AssetBinding;
  items?: AssetBinding[];
  overlay?: AssetBinding;
  soundEffects?: AssetBinding[];
};
```

Asset resolver kiểm tra:

```text
asset ID exists
file exists
safeToUse
kind accepted by slot
orientation
min/max asset count
clip duration
trim range
checksum
```

---

## 4.11 Stage K — Resolved render timeline

Remotion không nên tự suy luận business/editorial timing trong React.

Nó nên nhận một input đã resolve:

```ts
type ResolvedVideoTimeline = {
  durationMs: number;
  fps: number;

  audio: ResolvedAudioPlan;
  captions: CaptionPlan;
  scenes: ResolvedScene[];
  visualCues: VisualCue[];

  checksums: {
    projectInput: string;
    script: string;
    voice: string;
    timedScript: string;
    captionPlan: string;
    scenePlan: string;
    visualCuePlan: string;
  };
};
```

React adapter chỉ chịu trách nhiệm:

```text
layout
style
animation implementation
asset rendering
```

Không chịu trách nhiệm:

```text
chọn scene boundary
đoán asset
đoán caption page
đoán word timing
sửa script
```

---

## 5. Required input beyond script and audio

Script và audio chỉ đủ để tạo một narrated subtitle video.

Để tạo video production có visual direction, cần thêm các input sau.

## 5.1 Platform profile

```ts
type PlatformProfile = {
  id: "tiktok" | "instagram_reels" | "youtube_shorts";
  width: number;
  height: number;
  fps: number;

  safeAreas: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };

  maximumDurationSec?: number;
};
```

Mục tiêu:

- tránh subtitle bị platform UI che;
- đặt CTA đúng safe area;
- lock resolution/FPS/duration.

---

## 5.2 Brand profile

```ts
type BrandProfile = {
  id: string;

  fonts: {
    heading: string;
    body: string;
    subtitle: string;
    code?: string;
  };

  colors: {
    background: string;
    foreground: string;
    accent: string;
    muted: string;
  };

  logoAssetId?: string;
  watermarkPolicy: "none" | "always" | "outro";
  motionIntensity: "low" | "medium" | "high";
};
```

AI không được tự chọn lại brand palette cho mỗi scene.

---

## 5.3 Caption policy

```ts
type CaptionPolicy = {
  maxWordsPerPage: number;
  maxLines: number;
  maxCharactersPerLine: number;

  phraseGapThresholdMs: number;
  minimumPageDurationMs: number;
  maximumPageDurationMs: number;

  activeWordStyle: "scale" | "lift" | "color" | "underline";
  showFutureWords: boolean;
  safeArea: "bottom" | "center";
};
```

---

## 5.4 Pronunciation lexicon

```ts
type PronunciationEntry = {
  written: string;
  spoken: string;
  aliases?: string[];
};
```

Ví dụ:

```json
[
  {"written": "AI", "spoken": "ây ai"},
  {"written": "API", "spoken": "ây pi ai"},
  {"written": "CLI", "spoken": "xi él ai"},
  {"written": "GitHub", "spoken": "gít hắp"},
  {"written": "Remotion", "spoken": "ri mô shần"}
]
```

Lexicon phải được dùng trong:

```text
TTS generation
WhisperX reconciliation
caption token matching
```

---

## 5.5 Visual brief

```ts
type VisualBrief = {
  dominantStyle: string;
  allowedVisualFamilies: string[];
  avoidVisualFamilies: string[];

  pacing: "slow" | "balanced" | "fast";

  mustShow: string[];
  avoid: string[];
  referenceIds: string[];
};
```

Ví dụ:

```json
{
  "dominantStyle": "luxury technical editorial",
  "allowedVisualFamilies": [
    "kinetic_typography",
    "technical_diagram",
    "code_panel",
    "ui_cards"
  ],
  "avoidVisualFamilies": [
    "generic_robot",
    "generic_stock_office"
  ],
  "pacing": "balanced",
  "mustShow": [],
  "avoid": [],
  "referenceIds": []
}
```

---

## 5.6 Asset manifest

Mỗi asset cần tối thiểu:

```text
id
src
kind
width / height
duration
orientation
safeToUse
checksum
tags
sceneHints
provenance
```

Asset metadata phải được probe trước mapping.

---

## 5.7 Template capability registry

```ts
type TemplateCapability = {
  templateId: string;
  adapterId: string;

  supportedIntents: string[];

  assetSlots: Record<string, {
    acceptedKinds: Array<"image" | "video" | "audio" | "svg">;
    required: boolean;
    min?: number;
    max?: number;
  }>;

  maximumObjects: number;
  supportsSubtitle: boolean;
  supportsGlobalAudio: boolean;
};
```

Planner chỉ được chọn template khi input thỏa capability.

---

## 5.8 Audio mix policy

```ts
type AudioMixPolicy = {
  voiceVolume: number;
  musicVolume: number;
  sfxVolume: number;

  duckMusicUnderVoice: boolean;
  duckingAmountDb?: number;

  introMusicMs?: number;
  outroTailMs?: number;
};
```

Music và SFX phải là track trong timeline, không chèn thủ công sau render.

---

## 5.9 Fact package

Với video AI/engineering:

```ts
type FactPackage = {
  claims: Array<{
    id: string;
    text: string;
    sourceIds: string[];
    confidence: "high" | "medium" | "low";
  }>;

  numbers: Array<{
    id: string;
    value: number | string;
    unit?: string;
    sourceId: string;
  }>;
};
```

Mục tiêu: tránh visual đẹp nhưng claim hoặc số liệu sai.

---

## 5.10 QA profile

```ts
type QAProfile = {
  maximumSubtitleDriftMs: number;
  minimumAlignmentCoverage: number;

  maximumObjectsPerScene: number;
  minimumTextContrast: number;
  maximumCueDensityPerSecond: number;

  requireAudioStream: boolean;
  requireNoClipping: boolean;
  requireSafeAreaPass: boolean;
};
```

QA threshold phải là machine-readable input, không chỉ là nhận xét cảm tính.

---

## 6. Unified project input contract

```ts
type VideoProjectInput = {
  project: {
    id: string;
    title: string;
    language: "vi" | "en" | "ja";
  };

  platform: PlatformProfile;
  brand: BrandProfile;

  script: ApprovedScript;
  pronunciation: PronunciationEntry[];

  voice: VoiceTrack | VoiceGenerationRequest;
  audioMix: AudioMixPolicy;

  captionPolicy: CaptionPolicy;
  visualBrief: VisualBrief;

  assets: AssetManifest;
  templates: TemplateCapability[];

  facts?: FactPackage;
  publishing?: PublishingBrief;

  qa: QAProfile;
};
```

Phân biệt:

```text
Script + audio
= narrated subtitle video

VideoProjectInput
= directed, branded, asset-backed, QA-able production video
```

---

## 7. Remotion runtime design

## 7.1 Dependencies

Với project đang dùng Remotion `4.0.486`, các package Remotion mới phải giữ cùng version:

```json
{
  "@remotion/media": "4.0.486",
  "@remotion/captions": "4.0.486"
}
```

Recommended audio component:

```ts
import {Audio} from "@remotion/media";
```

---

## 7.2 Global AudioLayer

Voiceover phải nằm ngoài scene adapters:

```tsx
<AbsoluteFill>
  <AudioLayer plan={input.audio} />
  <SceneRenderer input={input} />
  <CaptionRenderer plan={input.captions} />
</AbsoluteFill>
```

Lý do:

- narration chạy liên tục qua scene transitions;
- visual transition không làm fade voice;
- voice track có một owner duy nhất;
- music/SFX có thể mix độc lập.

---

## 7.3 Public asset path

Local audio dùng trong Remotion bundle nên được normalize vào:

```text
public/
└── runs/
    └── <run-id>/
        └── audio/
            └── voice.wav
```

Contract lưu relative path:

```json
{
  "src": "runs/<run-id>/audio/voice.wav"
}
```

Runtime resolve bằng `staticFile()`.

Không đưa absolute Windows path vào React props.

---

## 7.4 Composition metadata

Composition duration phải derive từ resolved master timeline:

```text
master narration duration
+ allowed visual/audio tail
= composition duration
```

Không tiếp tục cộng duration scene ước lượng.

`calculateMetadata()` chịu trách nhiệm resolve:

```text
durationInFrames
fps
width
height
default sample rate
resolved props
```

---

## 7.5 Timestamp unit policy

Canonical timing unit trong pipeline:

```text
milliseconds
```

Chỉ convert sang frame ở Remotion boundary:

```ts
const startFrame = Math.floor((startMs * fps) / 1000);
const endFrame = Math.ceil((endMs * fps) / 1000);
```

Không convert lặp lại:

```text
ms → frame → ms → frame
```

Điều này làm tích lũy rounding drift.

---

## 8. Checksum and invalidation graph

Mọi artifact timing phải có dependency checksum.

```text
ApprovedScript checksum
        │
        ▼
VoiceTrack.scriptChecksum
        │
        ▼
TimedScript
        │
        ├── CaptionPlan
        └── NarrativeBeatMap
                │
                ▼
             ScenePlan
                │
                ▼
          VisualCuePlan
                │
                ▼
      ResolvedVideoTimeline
```

Invalidation rules:

```text
Script changed
→ voice invalid unless re-approved against new script
→ TimedScript invalid
→ CaptionPlan invalid
→ NarrativeBeatMap invalid
→ ScenePlan invalid
→ VisualCuePlan invalid

Voice changed
→ TimedScript invalid
→ all downstream timing invalid

Caption style only changed
→ timing stays valid
→ caption visual render invalid only

Asset file changed
→ scene timing remains valid
→ asset binding/render report invalid
```

Không được render silently với timing của audio cũ.

---

## 9. QA gates

## 9.1 Audio file QA

```text
file exists
file readable
checksum matches
format supported
duration > 0
sample rate declared
no clipping
no unexpected long silence
normalized output exists
```

## 9.2 Script/audio QA

```text
script checksum matches VoiceTrack
100% phrase coverage
no phrase reordered
ASR did not rewrite script
unresolved word rate below threshold
word timestamps stay inside phrase ranges
```

## 9.3 Caption QA

```text
one short phrase per page
page does not change mid-phrase
active word follows timestamp
line length within policy
caption stays inside safe area
final page ends before/equal audio end
```

## 9.4 Editorial QA

```text
scene boundaries follow narrative beats
scene is not created per caption page
visual changes are not triggered per word
important claims receive visual emphasis
pause is used intentionally
hook has sufficient visual density
```

## 9.5 Visual cue QA

```text
cue target exists
cue falls inside scene range
cue density within pacing limit
hold duration sufficient
transition does not cut narration
reveal order matches spoken logic
```

## 9.6 Output QA

```text
MP4 contains audio stream
composition duration matches master timeline
voice remains intelligible
music does not mask narration
safe area passes
render report contains all checksums
```

---

## 10. Proposed run artifacts

```text
pipeline/runs/<run-id>/
├── input/
│   ├── project-input.json
│   ├── approved-script.json
│   ├── pronunciation-lexicon.json
│   ├── visual-brief.json
│   └── qa-profile.json
├── audio/
│   ├── voice.raw.mp3
│   ├── voice.wav
│   ├── audio-metadata.json
│   └── pause-map.json
├── timing/
│   ├── whisperx.raw.json
│   ├── timed-script.json
│   ├── caption-plan.json
│   ├── narrative-beat-map.json
│   ├── scene-plan.json
│   └── visual-cue-plan.json
├── render/
│   ├── resolved-video-timeline.json
│   ├── video-map.json
│   └── render-props.json
├── output/
│   └── video.mp4
└── reports/
    ├── preflight-report.json
    ├── alignment-report.json
    ├── render-report.json
    └── sync-qa-report.json
```

---

## 11. Proposed repository structure

```text
src/
├── audio/
│   ├── types.ts
│   ├── AudioLayer.tsx
│   ├── resolveAudioPlan.ts
│   └── mixPolicy.ts
├── captions/
│   ├── CaptionRenderer.tsx
│   ├── captionTiming.ts
│   └── types.ts
├── timeline/
│   ├── frameTime.ts
│   ├── resolveTimeline.ts
│   ├── resolveSceneRanges.ts
│   └── visualCues.ts
├── assets/
│   ├── types.ts
│   ├── resolver.ts
│   ├── validators.ts
│   └── AssetRenderer.tsx
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
│   ├── normalize-audio.mjs
│   ├── probe-audio.mjs
│   ├── analyze-silence.mjs
│   ├── normalize-whisperx.mjs
│   ├── reconcile-approved-script.mjs
│   └── validate-timed-script.mjs
├── timing/
│   ├── build-caption-plan.mjs
│   ├── build-narrative-beat-map.mjs
│   ├── build-scene-plan.mjs
│   └── build-visual-cue-plan.mjs
└── validate-video-map.mjs
```

---

## 12. Implementation roadmap

## Slice 1 — Audio Foundation MVP

Mục tiêu:

> Render video hiện tại với một local voice file; composition duration lấy từ audio metadata; MP4 output chứa audio stream.

```text
- add @remotion/media
- add minimal AudioPlan contract
- normalize voice into public/runs/<run-id>/audio/
- probe duration and checksum
- create global AudioLayer
- derive calculateMetadata duration from audio
- preflight missing/invalid audio
- verify output audio stream
```

Definition of Done:

```text
1. Stable voice asset ID exists.
2. Missing audio fails before render.
3. Composition duration comes from voice duration.
4. MP4 has an audio stream.
5. Render report includes voice checksum and duration.
```

---

## Slice 2 — TimedScript and Caption Lock

```text
voice.wav
→ WhisperX
→ normalize output
→ reconcile ApprovedScript
→ TimedScript
→ CaptionPlan
→ timestamp CaptionRenderer
```

Definition of Done:

```text
1. Caption page changes at phrase boundaries.
2. Active word follows word timestamp.
3. Script text is unchanged.
4. Missing timestamps are explicit.
5. Caption drift stays inside QA threshold.
```

---

## Slice 3 — Narrative Beat and Scene Timing

```text
TimedScript
→ NarrativeBeatMap
→ ScenePlan
→ narration-bound scene ranges
```

Definition of Done:

```text
1. Scene is not created per caption page.
2. Scene boundary does not cut a word.
3. Hook/problem/reveal/takeaway beats are explicit.
4. Scene start/end are resolved from narration ranges.
```

---

## Slice 4 — Visual Cue Plan

```text
ScenePlan
+ TemplateCapabilities
→ VisualCuePlan
→ component event timing
```

Definition of Done:

```text
1. Every cue targets a real component object.
2. Reveal order follows narration logic.
3. Cue density respects pacing policy.
4. Visual transitions do not modify voiceover.
```

---

## Slice 5 — Component and Asset Binding

```text
VisualCuePlan
+ AssetManifest
+ TemplateCapabilities
→ ResolvedVideoTimeline
```

Definition of Done:

```text
1. Scene binds asset by stable ID.
2. Adapter receives resolved slot assets only.
3. Wrong-kind or missing asset fails preflight.
4. Real image/video assets render at the intended cue.
```

---

## Slice 6 — Provider and Mix Automation

```text
- provider-neutral VoiceProvider interface
- ElevenLabs adapter
- VieNeu-TTS adapter
- Edge TTS preview adapter
- music and SFX tracks
- voice ducking
- mix QA
```

---

## 13. Engineering decisions

1. VoiceTrack is the master timeline.
2. ApprovedScript is the only text authority.
3. WhisperX provides timing evidence, not editorial text.
4. Renderer never calls a TTS provider.
5. Caption page, narrative beat and scene are different entities.
6. Visual cue timing is separate from word highlighting.
7. Voiceover is a global audio layer.
8. Scene transition does not fade narration.
9. Milliseconds are canonical; frame conversion occurs at the Remotion boundary.
10. LLM may propose semantic boundaries but may not invent media timestamps.
11. Every downstream timing artifact is checksum-bound.
12. A changed voice invalidates all timing-dependent artifacts.
13. Template selection must respect actual component capabilities.
14. Asset selection must resolve to stable IDs before React render.
15. QA thresholds are part of project input.

---

## 14. Final recommendation

Do not jump directly from audio integration to automated asset retrieval.

Correct implementation order:

```text
1. Add one existing voice file to Remotion output.
2. Make voice duration drive composition metadata.
3. Compile WhisperX output into TimedScript.
4. Lock short caption phrases and animate words by timestamp.
5. Build NarrativeBeatMap.
6. Derive ScenePlan from narration ranges.
7. Build VisualCuePlan for component events.
8. Bind components and assets against the resolved timeline.
9. Automate TTS providers, music and retrieval afterwards.
```

Completing Slice 1 and Slice 2 creates a video with correct audio and captions.

Completing Slice 3 and Slice 4 creates a video that is actually directed according to the audio.

Completing Slice 5 creates a deterministic asset-backed production renderer.

---

## 15. References

### Repository

- `package.json`
- `src/data.ts`
- `src/Composition.tsx`
- `src/Root.tsx`
- `src/templateRegistry.tsx`
- `scripts/run-whisperx.ps1`
- `design/workflow/create/G02_SCRIPT_TIMING.md`
- `design/research/ASSET_COMPONENT_RENDER_ARCHITECTURE_REVIEW.md`

### External primary sources

- Remotion Audio component: https://www.remotion.dev/docs/media/audio
- Remotion calculateMetadata: https://www.remotion.dev/docs/calculate-metadata
- Remotion Caption contract: https://www.remotion.dev/docs/captions/caption
- Remotion TikTok-style caption grouping: https://www.remotion.dev/docs/captions/create-tiktok-style-captions
- Remotion media metadata with Mediabunny: https://www.remotion.dev/docs/mediabunny/metadata
- WhisperX: https://github.com/m-bain/whisperX
