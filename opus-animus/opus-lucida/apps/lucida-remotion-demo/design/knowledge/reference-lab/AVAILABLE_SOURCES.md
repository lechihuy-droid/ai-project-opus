# Reference Ingestion — Available Sources

Reviewed: 2026-07-11

This catalog lists tools, datasets, research papers, and inspiration libraries that can support Lucida's Reference Ingestion Pipeline.

Selection status:

- `selected` — suitable for the first implementation
- `evaluate` — useful but needs a technical or rights review
- `reference-only` — use for human research; do not scrape or redistribute without permission
- `research-lead` — promising research, not yet a production dependency

## 1. Selected implementation tools

### PySceneDetect

- Status: `selected`
- URL: https://www.scenedetect.com/docs/latest/
- Repository: https://github.com/Breakthrough/PySceneDetect
- Purpose:
  - shot and scene boundary detection
  - scene lists
  - keyframe image export
  - video splitting
- Lucida role:
  - default MVP scene segmentation engine
- Notes:
  - supports command-line and Python APIs
  - provides multiple detectors including content, adaptive, hash, histogram, and threshold approaches
  - requires FFmpeg or mkvmerge for video splitting
- Rights:
  - verify the repository's current license before vendoring or modifying code
  - analyzing a video does not grant rights to redistribute that video or extracted frames

### FFmpeg and ffprobe

- Status: `selected`
- URL: https://ffmpeg.org/
- Filter documentation: https://ffmpeg.org/ffmpeg-filters.html
- Purpose:
  - media probing
  - normalization
  - frame sampling
  - thumbnail/contact-sheet generation
  - crop, scale, trim, and frame-rate conversion
- Lucida role:
  - canonical media preprocessing layer
- Notes:
  - invoke through a constrained command builder; do not concatenate untrusted shell input
  - preserve original media and create immutable proxies
- Rights:
  - FFmpeg build and codec licensing must be reviewed for the deployment environment

### OpenCV Optical Flow

- Status: `selected`
- URL: https://docs.opencv.org/4.x/d4/dee/tutorial_optical_flow.html
- Purpose:
  - sparse feature tracking with Lucas–Kanade
  - dense optical flow with Farneback
  - estimate apparent displacement between consecutive frames
- Lucida role:
  - supporting measurement for camera/object motion
- Limits:
  - does not determine narrative intent
  - can confuse camera movement, object movement, occlusion, and lighting changes
- Rights:
  - review current OpenCV license and preserve notices when distributing modified code

### TransNetV2

- Status: `evaluate`
- URL: https://github.com/soCzech/TransNetV2
- Paper: https://arxiv.org/abs/2008.04838
- License: MIT repository
- Purpose:
  - learned shot-transition detection
  - improved handling of difficult cuts and gradual transitions
- Lucida role:
  - optional fallback after PySceneDetect
- Notes:
  - pretrained inference is available
  - model weights, runtime dependencies, and resource cost must be evaluated separately

## 2. Research and benchmark leads

### Motion Vectorization and Transformation

- Status: `research-lead`
- Paper: https://arxiv.org/abs/2309.14642
- Purpose:
  - convert a motion-graphics video into an editable SVG motion program
  - represent objects, motion, timing, and occlusion at a higher level than pixels
- Lucida relevance:
  - strong conceptual reference for object-level motion decomposition
  - possible future path for vector-heavy reference videos
- Current decision:
  - do not make it an MVP dependency
  - first implement scene segmentation, visual observation, optical flow, and taxonomy normalization
- Rights:
  - inspect code and dataset availability separately before implementation

### AniMINT

- Status: `research-lead`
- Paper: https://arxiv.org/abs/2604.26148
- Purpose:
  - benchmark VLM understanding of UI animation
  - includes primitive motion, purpose, and meaning annotations
- Reported scope:
  - 300 densely annotated UI animation videos
- Lucida relevance:
  - useful taxonomy ideas for separating motion appearance from motion purpose
  - useful benchmark design for the Motion Observer
- Current decision:
  - verify dataset/code release and license before use
  - do not treat the paper alone as permission to copy the dataset

### AutoShot / SHOT dataset

- Status: `evaluate`
- Repository: https://github.com/wentaozhu/AutoShot
- Paper: https://arxiv.org/abs/2304.06116
- Purpose:
  - shot-boundary detection designed around short-form video
- Lucida relevance:
  - potentially useful when references are TikTok/Reels/Shorts-style videos
- Current decision:
  - benchmark against PySceneDetect and TransNetV2 after MVP
  - review dataset and code licenses before downloading

## 3. Reference libraries for visual and motion research

These sources are useful for human-led reference selection. They are not automatically approved for scraping, bulk downloading, dataset creation, or redistribution.

### Mobbin

- Status: `reference-only`
- URL: https://mobbin.com/
- Focus:
  - real-world mobile and web UI screens
  - complete product flows
  - video flows with micro-interactions and animation
- Lucida use:
  - UI explainers
  - dashboard/video scene patterns
  - interaction and transition taxonomy
- Constraint:
  - follow Mobbin's terms and plan permissions
  - store links and notes by default, not copied libraries of screenshots or videos

### Page Flows

- Status: `reference-only`
- URL: https://pageflows.com/
- Focus:
  - recorded user flows
  - UI/UX patterns for apps and websites
- Lucida use:
  - interaction sequencing
  - onboarding, checkout, search, and navigation motion references
- Constraint:
  - verify account terms before downloading or retaining media

### Art of the Title

- Status: `reference-only`
- URL: https://www.artofthetitle.com/
- Focus:
  - film, television, game, and conference title sequences
  - interviews and design-process analysis
- Lucida use:
  - cinematic typography
  - title cards
  - narrative visual motifs
  - opening and closing sequences
- Constraint:
  - use links, notes, and manually approved evidence
  - title videos and stills remain subject to their respective rights holders

### ShotDeck

- Status: `reference-only`
- URL: https://shotdeck.com/
- Focus:
  - searchable cinematic image library
  - composition, lighting, lens, color, and production references
- Lucida use:
  - cinematic color and composition vocabulary
  - camera and lighting reference
- Constraint:
  - subscription access does not necessarily grant redistribution rights
  - do not commit images without explicit permission

### FilmGrab

- Status: `reference-only`
- URL: https://film-grab.com/
- Focus:
  - curated film stills
- Lucida use:
  - composition and color research
  - scene-density and framing references
- Constraint:
  - treat images as third-party copyrighted reference material
  - prefer source links and private evidence storage

## 4. Recommended MVP stack

```text
ffprobe
  -> FFmpeg normalized proxy
  -> PySceneDetect
  -> FFmpeg keyframes/contact sheet
  -> VLM Visual Observer
  -> OpenCV frame difference + optical flow
  -> VLM Motion Observer
  -> Lucida taxonomy normalizer
  -> provenance and rights gate
  -> Remotion validation render
  -> human review
```

Optional fallback:

```text
PySceneDetect low confidence
  -> TransNetV2
  -> manual boundary correction
```

## 5. Sources not automatically imported

The following should remain external unless their exact terms permit use:

- paid screenshot/video libraries
- premium motion templates
- commercial fonts
- copyrighted title sequences
- proprietary app recordings
- creator portfolio videos
- streaming-platform clips
- stock footage without a project license

For these sources, store:

- URL
- creator/title
- timestamp range
- private evidence URI when authorized
- content hash
- extracted observations
- rights classification

Do not store the original media in Git by default.

## 6. Next evaluation tasks

1. Benchmark PySceneDetect against TransNetV2 on five representative Lucida videos.
2. Define a shot-boundary confidence and manual-correction format.
3. Prototype OpenCV sparse and dense optical-flow summaries.
4. Design a Motion Observer taxonomy inspired by AniMINT without importing its data until release and license are verified.
5. Test a vector-heavy motion graphic against the Motion Vectorization paper's conceptual model.
6. Add a source adapter that records Mobbin/Page Flows/Art of the Title links without downloading protected media.
7. Add a rights policy test that blocks public Git commits of raw reference media.
