# LLM Prompt: Source Ingestor Cleaner

```text
You are preparing raw inputs for a Remotion script-to-video workflow.

Return only valid JSON.

Goal:
Convert mixed raw inputs into clean-brief.json. Classify each source automatically and decide how it should be used.

Source usage classes:
- content_truth: use for factual claims, entities, mechanisms, examples, or script correction.
- style_reference: use for mood, palette, composition, layout, typography, shape language, or animation ideas.
- embed_asset: use directly in the video only if the user supplied/owns it or explicitly asked to include it.
- context_only: useful background, not directly rendered or cited in the visual plan.
- ignore: irrelevant, duplicate, low-signal, broken, or unsafe.

Tasks:
1. Inventory all inputs.
2. Clean the script without changing its core meaning.
3. Extract key claims, entities, mechanisms, use cases, and constraints.
4. Analyze images as style references by default.
5. Promote images/files to embed_asset only when safe and useful.
6. Extract GitHub repo signals such as useful templates, files, component patterns, and ignored noise.
7. Separate factual content from visual direction.
8. Include confidence and reason for every source usage decision.

Rules:
- Do not copy third-party visual assets by default.
- Do not include exact logos/brand marks unless user explicitly owns or requests them.
- Do not let raw source order dictate scene order.
- Prefer concise cleaned claims over long excerpts.
- Preserve Vietnamese narration meaning.

Return JSON using this shape:
{
  "project": {
    "title": "...",
    "format": "vertical_9_16",
    "durationSec": 60,
    "language": "vi",
    "style": "dark_ai_orange_glow"
  },
  "sourceDecisions": [
    {
      "id": "src_1",
      "type": "url|github_repo|pdf|local_file|image|script|text",
      "location": "...",
      "usage": "content_truth|style_reference|embed_asset|context_only|ignore",
      "confidence": "high|medium|low",
      "reason": "..."
    }
  ],
  "narration": {
    "sourceScript": "...",
    "cleanedScript": "...",
    "needsRewrite": false
  },
  "knowledge": {
    "keyClaims": [
      {
        "claim": "...",
        "sourceIds": ["src_1"],
        "confidence": "high|medium|low"
      }
    ],
    "entities": [],
    "mechanisms": [],
    "useCases": [],
    "caveats": []
  },
  "visualReferences": [
    {
      "sourceId": "src_2",
      "type": "image|repo_template|website|video_frame",
      "analysis": {
        "mood": "...",
        "palette": [],
        "composition": "...",
        "shapeLanguage": "...",
        "textTreatment": "...",
        "motionIdeas": []
      },
      "usage": "style_reference_only",
      "doNotCopy": []
    }
  ],
  "usableAssets": [
    {
      "id": "asset_1",
      "sourceId": "src_3",
      "type": "image|video|audio|svg",
      "path": "...",
      "usage": "embed_in_video",
      "sceneHints": [],
      "safeToUse": true,
      "reason": "..."
    }
  ],
  "constraints": {
    "mustShow": [],
    "avoid": [],
    "openQuestions": []
  }
}

INPUTS:
{{inputs}}
```
