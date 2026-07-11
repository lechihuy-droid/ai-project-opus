# LLM Prompt: Script To Template Map

Use this prompt when asking an LLM to analyze a script and output `video-map.json`.

```text
You are a video content architect for Remotion.

Analyze the following cleaned brief or script and return only valid JSON.

Goal:
Create a template map for a vertical short video. Do not write React. Do not describe your reasoning outside JSON.

Tasks:
1. Split the cleaned script into scenes by meaning and communication intent.
2. Assign one primary intent to each scene.
3. Read apps/remotion-templates/template-catalog.json and choose a cataloged templateId for every scene.
4. Extract only the content needed to render that template.
5. Preserve the narration meaning in subtitles.
6. Keep on-screen text short.
7. Use visualReferences as style guidance only.
8. Use usableAssets only when the scene benefits from embedding them.
9. Add a short reason for every template choice.

Allowed intents:
- hook
- problem
- comparison
- process
- system_architecture
- list
- use_case
- takeaway
- quote
- code_explanation

Primary mapping:
- hook -> cinematic-title-intro, chapter-title, title-split, glitch-text
- repo/code reveal -> code-panel, typewriter-subtitle, animated-text, text-highlight
- comparison -> split-screen, comparison-chart, image-comparison-slider
- list/pattern -> animated-list, progress-steps, notification-pop
- use case -> rotating-carousel, gallery-grid, photo-stack, image-carousel
- stats -> stat-counter, progress-bars, chart-animation
- CTA -> end-card, subscribe-reminder
- backgroundEffect -> matrix-rain, starfield, bokeh-circles, noise-grain, gradient-shift, grid-pulse
- transitionIn/transitionOut -> cross-dissolve, slide-wipe, whip-pan, zoom-through

Rules:
- Choose only templateId values from template-catalog.json templates[] or localAdapters[].
- Use diagram only when the scene has concrete entities and relationships.
- Do not embed images marked only as style_reference.
- Keep each scene under 5 visual objects unless the catalog density supports high.
- Put long narration in subtitle.text or subtitle.segments, not card labels.
- Avoid arbitrary absolute coordinates.

Constraints:
- Format: 9:16 vertical.
- Style: dark AI tech, warm orange glow.
- Target duration: {{targetDurationSec}} seconds.
- Language: Vietnamese.

Return JSON using this shape:
{
  "video": {
    "title": "...",
    "subtitle": "...",
    "format": "vertical_9_16",
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "durationSec": 0,
    "style": "dark_ai_orange_glow",
    "language": "vi",
    "sourceBlocks": []
  },
  "theme": {
    "name": "lucida_dark_ai",
    "accent": "#ff8a3d",
    "accentSoft": "#ffd08a",
    "background": "#090807",
    "foreground": "#f8f3ee",
    "muted": "rgba(248,243,238,0.66)"
  },
  "assets": [],
  "scenes": [
    {
      "id": "scene_id",
      "intent": "hook",
      "templateId": "cinematic-title-intro",
      "templateRole": "scene",
      "durationSec": 5,
      "headline": "short on-screen headline",
      "subtitle": {
        "text": "spoken narration for this scene",
        "segments": ["optional subtitle segment"]
      },
      "content": {},
      "style": {
        "accent": "#ff8a3d",
        "density": "low",
        "safeArea": "tiktok"
      },
      "motion": ["slow_zoom", "title_reveal"],
      "backgroundEffect": "starfield",
      "transitionOut": "cross-dissolve",
      "subtitleMode": "bar",
      "reason": "Why this template fits the scene."
    }
  ]
}

SCRIPT:
{{script}}

CLEAN BRIEF, IF AVAILABLE:
{{cleanBriefJson}}
```
