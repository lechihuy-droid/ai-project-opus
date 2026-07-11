# Japan 10M Robots — Research to Create Flow

## 1. Topic decision

**Working topic:** Japan aims to deploy 10 million robots across 18 sectors by 2040.

**Content type:** AI trend / Japan / future of work

**Primary audience:** Vietnamese office workers and technology workers living in Japan.

**Why this topic is attractive:**

- Strong number-led hook: `10 million robots`.
- Directly connected to Japan's labor shortage and ageing population.
- Easy to visualize with factories, healthcare, logistics and office work.
- Creates FOMO without requiring deep technical knowledge.

## 2. Research findings

### Supported context

- Multiple recent secondary reports state that Japan is targeting around 10 million robots across 18 sectors by 2040.
- Recent Reuters reporting independently supports the broader context: Japan faces a severe long-term labor shortage, and Japanese companies are already using or considering AI-powered robots.
- Japan is also preparing very large public-private investment programs through 2040, including AI and other strategic sectors.

### Verification warning

At the time of research, the exact combination of these claims could not be confirmed in a directly accessible primary Japanese government source:

- 10 million robots
- 18 sectors
- Noetra as the core initiative
- exact deployment commitment by 2040

Therefore, the video must not present this as an unquestioned official fact. Use language such as:

> Recent reports say Japan is considering or targeting deployment of around 10 million robots by 2040.

Avoid:

> Japan will definitely deploy 10 million humanoid robots by 2040.

### Evidence hierarchy

| Claim | Confidence | Treatment |
|---|---:|---|
| Japan has a structural labor shortage | High | State directly |
| AI robots are already being adopted or considered by Japanese firms | High | State directly |
| Robotics is part of Japan's response to demographic pressure | High | State directly |
| 10 million robots by 2040 | Medium | Attribute to recent reports |
| 18 sectors | Medium | Attribute to recent reports |
| All robots will be humanoid | Low | Do not claim |
| Robots will replace most workers | Low | Do not claim |

## 3. Recommended editorial angle

Do not make the video only about robots.

The stronger angle is:

> Japan's labor shortage is accelerating the shift from repetitive work to human-AI-robot collaboration.

The audience takeaway should be:

> The immediate risk is not that a robot replaces every worker. The larger risk is that workers who can operate AI and automated systems move ahead of workers who cannot.

## 4. Create-flow input contract

```json
{
  "schema_version": "0.1",
  "content_id": "japan-10m-robots-2040",
  "content_type": "ai_trend",
  "status": "research_ready",
  "context": {
    "working_title": "Nhật Bản muốn đưa 10 triệu robot vào nền kinh tế trước năm 2040?",
    "language": "vi",
    "target_platforms": ["tiktok", "youtube_shorts", "facebook_reels"],
    "target_duration_seconds": 55,
    "audience": [
      "người Việt đang làm việc tại Nhật",
      "dân văn phòng",
      "developer, BA, PM và nhân sự công nghệ"
    ],
    "channel_promise": "Những thay đổi AI đáng biết trước khi bạn bị bỏ lại phía sau",
    "primary_goal": "reach",
    "secondary_goal": "follow"
  },
  "topic": {
    "canonical_topic": "Japan robotics expansion toward 2040",
    "topic_entities": [
      "Japan",
      "AI robotics",
      "physical AI",
      "labor shortage",
      "2040"
    ],
    "why_now": "Recent reports describe a new Japanese robotics push while fresh company surveys show growing interest in AI-powered robots.",
    "viewer_relevance": "People working in Japan need to understand how automation may change job design and required skills.",
    "viral_mechanism": [
      "large surprising number",
      "future-of-work anxiety",
      "Japan-specific relevance",
      "FOMO"
    ]
  },
  "research": {
    "research_status": "partially_verified",
    "source_policy": {
      "primary_source_required_for_hard_claims": true,
      "secondary_sources_allowed_for_attributed_claims": true,
      "uncertain_claims_must_be_labeled": true
    },
    "verified_claims": [
      {
        "claim_id": "claim-01",
        "claim": "Japan faces a long-term structural labor shortage driven by demographic decline.",
        "confidence": 0.95,
        "usage": ["context", "problem"]
      },
      {
        "claim_id": "claim-02",
        "claim": "A Reuters survey found that about one-third of surveyed Japanese companies were using, planning or considering AI-powered robots.",
        "confidence": 0.95,
        "usage": ["proof", "so_what"]
      },
      {
        "claim_id": "claim-03",
        "claim": "Recent reports say Japan is targeting roughly 10 million robots across 18 sectors by 2040.",
        "confidence": 0.65,
        "usage": ["hook"],
        "required_wording": "Theo các báo cáo gần đây"
      }
    ],
    "prohibited_claims": [
      "All 10 million robots will be humanoid",
      "The plan guarantees 10 million deployed robots",
      "Robots will replace most Japanese workers",
      "Noetra is confirmed as the sole official operating body"
    ],
    "open_questions": [
      "Can the exact 10 million target be confirmed in a Japanese government release?",
      "What are the named 18 sectors?",
      "Is Noetra a company, model, program or reporting error?"
    ]
  },
  "story_flow": {
    "hook": "Theo các báo cáo gần đây, Nhật Bản đang nhắm tới khoảng 10 triệu robot vào năm 2040.",
    "problem": "Lý do không chỉ là chạy đua công nghệ. Nhật đang thiếu lao động ngày càng nghiêm trọng.",
    "evidence": "Một khảo sát Reuters cho thấy khoảng một phần ba doanh nghiệp Nhật đã dùng, lên kế hoạch dùng hoặc đang cân nhắc robot AI.",
    "meaning": "Robot sẽ không chỉ nằm trong nhà máy mà có thể lan sang logistics, chăm sóc, thực phẩm và dịch vụ.",
    "viewer_impact": "Điều đáng lo không phải robot thay mọi người ngay lập tức, mà là người biết vận hành AI và tự động hóa sẽ vượt lên trước.",
    "cta": "Theo dõi kênh để cập nhật những thay đổi AI có thể ảnh hưởng trực tiếp đến công việc tại Nhật."
  },
  "script_constraints": {
    "tone": ["urgent", "credible", "clear"],
    "reading_level": "general_audience",
    "sentence_length": "short",
    "max_words": 145,
    "must_include": [
      "the attribution phrase for the 10 million claim",
      "labor shortage context",
      "one practical implication for workers"
    ],
    "must_avoid": [
      "unsupported certainty",
      "anti-technology fearmongering",
      "dense policy explanation",
      "more than three statistics"
    ]
  },
  "scene_intents": [
    {
      "scene_id": "s01",
      "duration_seconds": 5,
      "purpose": "stop_scroll",
      "key_message": "10 triệu robot vào năm 2040?",
      "emotion": "surprise",
      "visual_type": "number_reveal",
      "visual_objects": ["Japan map", "robot silhouettes", "2040"],
      "motion_intent": ["reveal", "scale", "count_up"],
      "camera_intent": "push_in"
    },
    {
      "scene_id": "s02",
      "duration_seconds": 9,
      "purpose": "explain_problem",
      "key_message": "Nhật Bản đang thiếu lao động",
      "emotion": "concern",
      "visual_type": "cause_diagram",
      "visual_objects": ["ageing population", "shrinking workforce", "empty job positions"],
      "motion_intent": ["split", "trace"],
      "camera_intent": "overview"
    },
    {
      "scene_id": "s03",
      "duration_seconds": 10,
      "purpose": "provide_evidence",
      "key_message": "Khoảng 1/3 doanh nghiệp Nhật đang dùng hoặc cân nhắc robot AI",
      "emotion": "credibility",
      "visual_type": "data_comparison",
      "visual_objects": ["company grid", "one-third highlight", "Reuters source label"],
      "motion_intent": ["fill", "highlight"],
      "camera_intent": "focus"
    },
    {
      "scene_id": "s04",
      "duration_seconds": 13,
      "purpose": "show_scope",
      "key_message": "Robot có thể mở rộng ra nhiều ngành",
      "emotion": "discovery",
      "visual_type": "sector_map",
      "visual_objects": ["factory", "healthcare", "food", "logistics", "service"],
      "motion_intent": ["branch", "reveal_sequence"],
      "camera_intent": "pan"
    },
    {
      "scene_id": "s05",
      "duration_seconds": 12,
      "purpose": "deliver_implication",
      "key_message": "Người biết vận hành AI sẽ đi trước",
      "emotion": "fomo",
      "visual_type": "human_vs_human_comparison",
      "visual_objects": ["worker with AI system", "worker without AI system", "skill gap"],
      "motion_intent": ["compare", "accelerate"],
      "camera_intent": "follow"
    },
    {
      "scene_id": "s06",
      "duration_seconds": 6,
      "purpose": "convert_follow",
      "key_message": "Đừng để bị bỏ lại phía sau",
      "emotion": "urgency",
      "visual_type": "channel_cta",
      "visual_objects": ["follow prompt", "AI update badge"],
      "motion_intent": ["focus", "pulse"],
      "camera_intent": "lock"
    }
  ],
  "visual_language": {
    "style_intent": ["premium", "futuristic", "editorial", "credible"],
    "theme": "dark_japan_future",
    "palette_intent": ["graphite", "deep_red_accent", "soft_white"],
    "typography_intent": "bold condensed numbers with clean sans-serif body",
    "diagram_style": "minimal layered infographic",
    "icon_style": "thin geometric line icons",
    "spacing": "airy",
    "depth": "subtle glass layers",
    "avoid": ["cartoon robots", "cyberpunk overload", "anime aesthetics", "military imagery"]
  },
  "subtitle_rules": {
    "mode": "sentence_chunk_with_word_highlight",
    "max_words_per_chunk": 7,
    "show_full_chunk_first": true,
    "highlight_current_word": true,
    "replace_chunk_after_sentence": true,
    "position": "lower_middle",
    "avoid_progress_bar": true
  },
  "asset_requirements": [
    {
      "asset_type": "map",
      "description": "Minimal map silhouette of Japan",
      "required": true
    },
    {
      "asset_type": "icons",
      "description": "Factory, healthcare, food, logistics and service icons",
      "required": true
    },
    {
      "asset_type": "source_card",
      "description": "Reuters survey citation card",
      "required": true
    },
    {
      "asset_type": "robot_visual",
      "description": "Generic industrial or service robot silhouettes; not necessarily humanoid",
      "required": true
    }
  ],
  "quality_rules": {
    "max_scene_duration_seconds": 13,
    "max_primary_objects_per_scene": 6,
    "no_repeated_transition_more_than_twice": true,
    "source_label_required_for_statistics": true,
    "uncertain_claim_marker_required": true,
    "no_bottom_progress_bar": true,
    "final_review_checks": [
      "Does the script attribute the 10 million figure?",
      "Does every statistic have a source label?",
      "Does the ending give a concrete worker implication?",
      "Are subtitles sentence-based and word-synced?"
    ]
  }
}
```

## 5. Recommended script direction

The script generator should build from this logic:

```text
Large surprising number
→ Why Japan needs this
→ Proof adoption has already started
→ Where robots may appear
→ What workers should learn now
```

## 6. Research sources used for this prototype

- Recent reporting on the alleged 10 million robot / 18-sector target.
- Reuters survey on AI-powered robot adoption among Japanese companies.
- Reuters reporting on Japan's public-private investment ambitions through 2040.
- Supporting context on Japan's demographic and labor shortage challenge.

## 7. Gate before production

This topic can proceed to script and visual prototyping, but should remain marked `partially_verified` until a primary Japanese government or official program source confirms the exact 10 million / 18-sector claim.
