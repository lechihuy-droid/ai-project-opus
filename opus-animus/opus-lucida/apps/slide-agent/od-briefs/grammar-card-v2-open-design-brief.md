# Open Design Brief - `grammar_card_v2`

Project: Lucida JLPT N2  
Date: 2026-05-14  
Purpose: Generate one production-ready slide template mockup for the Lucida slide-agent template library.  
Template spike: `grammar_card_v2`

## Context

Lucida is a Vietnamese-first JLPT N2 teaching system.

Slides are not decorative script summaries. Each slide is a learner-facing thinking structure between:

```text
teaching skeleton -> typed slide JSON -> HTML template -> PNG frame -> audio/video
```

Open Design is used only for template authoring and visual contract review. It is not the production renderer.

Production renderer:

```text
apps/slide-agent/
```

Current production path:

```text
slide-plan.json
-> apps/slide-agent/templates/<template_id>/template.html + slots.json + template.css
-> final-deck.html
-> Playwright PNG export
-> audio/video assembly
```

LLMs may choose a `template_id` and fill typed JSON slots. LLMs must not output HTML/CSS.

## Learner And Content Context

Audience:

```text
Vietnamese late N3 / early N2 learners.
They know basic Japanese grammar but confuse similar N2 patterns under exam pressure.
```

Current sample lesson:

```text
wake-cluster:
わけだ
わけではない
わけがない
わけにはいかない
```

Teaching goal:

```text
Help learners stop translating "わけ" mechanically.
They should ask: "Ở câu này, người nói đang muốn nói gì?"
```

Required public 3-view labels:

```text
Ý nghĩa
Dạng
Cách dùng
```

Do not use:

```text
Meaning / Form / Usage
Nghĩa - Hình - Dụng
Core Method
Reveal
Payoff
Diagnostic Practice
speaker action
Decision rule
```

## Template Goal

Create a new grammar-card template:

```text
template_id: grammar_card_v2
learning_function: teach one grammar pattern as a speaker intent + usage card
phase_fit: Grammar Core
```

Use this template when:

```text
- one grammar pattern needs to be taught clearly
- the learner must see meaning, form, usage, example, and trap at once
- the slide needs to contrast speaker intent, not just dictionary meaning
```

Do not use this template when:

```text
- comparing two patterns side-by-side
- running a quiz
- showing a clue map or exam decision table
- doing recap / CTA
```

## Required Slots

The mockup must be designed around these slots:

```json
{
  "template_id": "grammar_card_v2",
  "required_slots": {
    "pattern_jp": { "type": "string", "max_chars": 42 },
    "speaker_action_vi": { "type": "string", "max_chars": 130 },
    "meaning_vi": { "type": "string", "max_chars": 100 },
    "form_jp": { "type": "string", "max_chars": 70 },
    "usage_vi": { "type": "string", "max_chars": 130 },
    "example_jp": { "type": "string", "max_chars": 160 },
    "trap_vi": { "type": "string", "max_chars": 140 }
  },
  "optional_slots": {
    "bonus_vi": { "type": "string", "max_chars": 90 }
  }
}
```

Design must make each slot visually identifiable without showing internal slot names.

## Realistic Test Content

Use this content in the mockup:

```json
{
  "pattern_jp": "わけにはいかない",
  "speaker_action_vi": "Muốn cũng không làm được, vì có trách nhiệm hoặc ràng buộc.",
  "meaning_vi": "không thể làm, vì có ràng buộc",
  "form_jp": "V辞書形 + わけにはいかない",
  "usage_vi": "Hay gặp với deadline, quy tắc, vai trò, trách nhiệm.",
  "example_jp": "今夜は飲みに行くわけにはいきません。",
  "trap_vi": "Khác わけがない: đây là hành động bị giữ lại.",
  "bonus_vi": "Vない + わけにはいかない = không thể không làm"
}
```

Worst-case content to test density:

```json
{
  "pattern_jp": "わけではない",
  "speaker_action_vi": "Người nói đang đính chính lại một cách hiểu dễ bị lệch, không phải phủ định toàn bộ sự việc.",
  "meaning_vi": "không phải là... / không có nghĩa là...",
  "form_jp": "普通形 + わけではない",
  "usage_vi": "Dùng khi muốn gỡ lại một cách hiểu sai từ câu trước hoặc từ suy đoán của người nghe.",
  "example_jp": "行きたくないわけではありません。",
  "trap_vi": "Đừng kéo sang わけがない nếu câu chỉ đang đính chính, chưa bác bỏ khả năng.",
  "bonus_vi": "Mềm hơn わけがない; trọng tâm là sửa cách hiểu."
}
```

## Visual System Constraints

Canvas:

```text
16:9
1920 x 1080
static frame
no animation
safe-zone padding >= 40px
```

Lucida visual tone:

```text
premium exam-console
dark quiet background
high readability
structured, not decorative
Vietnamese + Japanese must both feel intentional
```

Current palette reference:

```css
--lucida-ink: #111827;
--lucida-paper: #f7f1e5;
--lucida-line: rgba(247, 241, 229, 0.18);
--lucida-amber: #f5b841;
--lucida-blue: #4a90e2;
--lucida-red: #d95d59;
--lucida-green: #2f7d5c;
--lucida-violet: #7c6a9e;
```

Fonts:

```text
UI / Vietnamese: Manrope, Segoe UI, Arial, sans-serif
Japanese: Noto Sans JP, BIZ UDPGothic, Meiryo, sans-serif
```

Avoid:

```text
- decorative blobs / gradient orbs
- marketing hero style
- oversized empty cards
- English learner-facing labels
- tiny text
- text overlap
- nested cards inside cards
```

## Layout Expectations

The pattern should be the first visual anchor.

Suggested hierarchy:

```text
1. Japanese pattern
2. Speaker intent question / answer
3. Three view: Ý nghĩa / Dạng / Cách dùng
4. Example sentence
5. Trap note
6. Optional bonus
```

The slide should answer:

```text
Ở câu này, người nói đang muốn nói gì?
```

But do not make that sentence overpower the grammar pattern.

The template must still work if `bonus_vi` is absent.

## Output Required From Open Design

Return these artifacts:

```text
mockup.html
template.css
slot-contract.json
template-notes.md
```

`mockup.html` should be a single static 1920x1080 slide frame with realistic test content.

`slot-contract.json` should mirror the slots in this brief.

`template-notes.md` should include:

```text
- purpose
- use_when
- do_not_use_when
- visual hierarchy
- density assumptions
- known risks
- PASS/REVISE recommendation
```

## Acceptance Criteria

PASS only if:

```text
- all required slots are visible
- no text overflows or overlaps
- Japanese pattern is immediately scannable
- Vietnamese explanation reads learner-facing, not internal
- labels use Ý nghĩa / Dạng / Cách dùng
- example and trap are clearly separated
- safe zones are respected
- no animation/reveal dependency
- the design can be ported to apps/slide-agent/templates/grammar_card_v2/
```

REVISE if:

```text
- density is too high
- example/trap compete with the main pattern
- visual hierarchy is unclear
- text is readable but cramped
```

BLOCK if:

```text
- English learner-facing labels appear
- layout depends on animation/reveal
- JSON would need raw HTML to render
- design cannot fit worst-case slot lengths
```

## After OD Output

If approved, port to:

```text
apps/slide-agent/templates/grammar_card_v2/template.html
apps/slide-agent/templates/grammar_card_v2/slots.json
apps/slide-agent/templates/grammar_card_v2/template.css
```

Then create:

```text
apps/slide-agent/lessons/od-template-test/slide-plan.json
```

And run:

```powershell
cd apps/slide-agent
node scripts/validateTemplate.js templates/grammar_card_v2
node scripts/render.js --lane od-template-test
node scripts/exportFrames.js --lane od-template-test --out lessons/od-template-test/frames
```
