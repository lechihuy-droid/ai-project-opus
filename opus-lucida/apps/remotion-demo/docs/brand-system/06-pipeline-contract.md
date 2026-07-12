# 06. Brand Contract for Create Flow

## Architectural role

Brand là **cross-cutting control plane**, không phải một style được chọn sau Business Input.

```text
Research / Business Input
          ↓
Narrative Blueprint
          ↓
Style RAG ──────> Style Candidate
          ↓              │
       Brand Compatibility Gate
          ↓
Lucida-compliant Design Tokens
          ↓
Scene / Subtitle / Audio / Render
```

Style RAG có thể đề xuất editorial, terminal, diagram, cinematic hoặc data-storytelling variants. Tuy nhiên:

- tối thiểu 70% visual identity phải đến từ Lucida base;
- external style influence tối đa 30%;
- external style không được override palette core, typography, subtitle model, evidence language, logo và motion signature;
- candidate không qua brand gate phải bị reject hoặc normalize.

## Required contract block

```json
{
  "brand": {
    "id": "lucida-ai-v1",
    "series": "lucida-now",
    "promise": "Lọc điều đáng biết. Giải thích điều thay đổi. Chỉ ra bước tiếp theo.",
    "tagline": "Hiểu AI sớm. Làm việc đi trước.",
    "audience": {
      "primary": "vietnamese-professionals-in-japan",
      "need": "keep-up-understand-impact-take-action"
    },
    "voice": {
      "personality": ["analyst", "guide", "operator"],
      "urgency": "controlled",
      "certainty_must_follow_research": true,
      "required_narrative_functions": ["signal", "proof", "meaning", "action"]
    },
    "visual": {
      "theme": "dark-editorial-intelligence",
      "motif": "lucida-beam",
      "palette_id": "lucida-core-v1",
      "font_latin": "Manrope",
      "font_japanese": "Noto Sans JP",
      "max_external_style_influence": 0.3,
      "progress_bar": false
    },
    "subtitle": {
      "mode": "sentence-first-word-highlight",
      "max_lines": 2,
      "max_words_per_chunk": 12,
      "active_word_scale": 1.04,
      "replace_on_phrase_boundary": true
    },
    "motion": {
      "character": "controlled-confident",
      "signature": ["beam-reveal", "evidence-lock", "focus-pull"],
      "max_signature_uses": 4,
      "decorative_motion": "minimal"
    },
    "sonic": {
      "identity": "lucida-signal-v1",
      "intro_jingle": false,
      "functional_cues": ["reveal", "evidence", "warning", "takeaway"]
    },
    "logo": {
      "intro_fullscreen_max_seconds": 0.6,
      "watermark": "optional-subtle",
      "end_card": true
    }
  }
}
```

## Series mapping

```json
{
  "ai_news": "lucida-now",
  "japan_future_of_work": "lucida-now",
  "office_ai": "lucida-work",
  "github_repo": "lucida-lab",
  "research_paper": "lucida-lab",
  "ai_concept": "lucida-lab",
  "hype_or_risk_review": "lucida-check"
}
```

## Locked fields

These fields cannot be overridden by topic input or Style RAG:

- `brand.id`
- core palette
- font families
- subtitle mode
- evidence language rules
- Lucida Beam motif
- prohibited visual and motion patterns
- logo usage policy

## Variable fields

These fields may vary per video:

- series;
- accent semantic color;
- scene visual type;
- density;
- external style reference;
- music tension;
- CTA type;
- amount of diagram, demo, data or footage.

## Compatibility score

Style Engine should return:

```json
{
  "brand_compatibility": {
    "score": 0.92,
    "violations": [],
    "normalizations": [
      "replaced neon-purple with signal-cyan",
      "converted word-pop subtitles to sentence-first mode"
    ]
  }
}
```

Production threshold:

- `>= 0.85`: render allowed.
- `0.70–0.84`: normalize and revalidate.
- `< 0.70`: reject style candidate.

## Integration with existing Create Input

The Create Flow input should contain these top-level sections:

```text
context
research
verified_claims
story_flow / narrative_blueprint
brand
style_variant
scene_intents
subtitle_timing
asset_requirements
quality_rules
```

`brand` is fixed by channel configuration. The topic workflow should choose only `series` and permitted variants, not recreate the entire brand for every video.
