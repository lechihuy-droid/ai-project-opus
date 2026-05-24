# Lucida · N2 Slide Templates — Design Spec

**File:** `lucida-n2-slide-templates.html`
**Purpose:** Reusable template gallery for any N2 grammar cluster (Wake, kai/gai/temade, ばかり family, etc.)
**Default demo data:** Wake cluster (わけだ・わけではない・わけがない・わけにはいかない)
**Canvas:** 1920 × 1080 (deck-stage). Print via Cmd+P → 1 page per slide.
**Total slides:** 25 (15 core + 5 production + 5 JLPT exam-prep)

---

## 1. Brand & Tone

> **Tiếng Nhật rõ ràng. Học theo mạch logic, không học theo bảng dịch.**

Every slide must reinforce one of these pillars:
1. **Mạch logic** — mỗi mẫu ngữ pháp là một hành động của người nói
2. **3 cách nhìn** — Ý nghĩa · Dạng · Cách dùng (luôn đủ 3 góc)
3. **Dấu hiệu** — học để chọn đúng mẫu khi vào đề, không chỉ để hiểu

---

## 2. Type System

**Default pairing (locked):** Be Vietnam Pro — designed for Vietnamese diacritics, hiển thị đẹp & cân đối nhất cho dấu thanh.

| Token | Family | Use |
|---|---|---|
| `--f-display` | Be Vietnam Pro 700/800 | slide titles, pattern hero, headings |
| `--f-body` | Be Vietnam Pro 400/500 | explanations, captions, body |
| `--f-jp` | Noto Sans JP 400/700 | tất cả Japanese characters |
| `--f-mono` | JetBrains Mono 400/700 | grammar patterns (`普通形 + わけだ`), code |

**Tweak overrides** (cho A/B test, không lưu vào template chính):
- `auto` — Be Vietnam Pro (dark) ↔ Newsreader + Source Sans 3 (light)
- `clean` — Manrope + DM Sans
- `apple` — Plus Jakarta Sans
- `editorial` — Newsreader + Source Sans 3

**Type scale (px on 1920×1080):**

```
hero    96   single dominant statement
title   64   slide titles
sub     44   secondary headings, JP lines
body    34   explanation paragraphs
small   28   labels, captions, ví dụ vn
xs      24   meta, chrome (template badge, slide num, brand)
micro   24   minimum — never go below
```

---

## 3. Color Tokens

**Dark / Video mode (canonical for screen recording):**

```
bg        #0d0d16     fg        #e8e8f0
bg-card   #16161f     fg-muted  #8888a8
bg-card2  #1c1c28     fg-sub    #5a5a78
```

Accent palette (oklch ensures perceptual consistency):

| Token | Value | Speaker-action role |
|---|---|---|
| `--amber` | `oklch(75% 0.18 78)` | primary highlight · 1 mẫu / 1 emphasis |
| `--red` | `oklch(62% 0.22 22)` | trap · bị ràng buộc · wrong path |
| `--blue` | `oklch(70% 0.16 255)` | kết luận hợp lý |
| `--green` | `oklch(68% 0.16 155)` | bác bỏ khả năng |

**Light / Print mode:**

```
bg        #f5f2eb     fg        #1a1714
amber     oklch(48% 0.22 22)   crimson — replaces amber
```

### 4-pattern color slots

For Comparison Matrix (T09) and Recap (T14), assign one color per pattern by **speaker-action archetype**, not JP alphabetic order:

| Slot | Color | Speaker action | Wake example |
|---|---|---|---|
| 1 | blue | đi đến kết luận hợp lý | わけだ |
| 2 | amber | đính chính / phủ định mềm | わけではない |
| 3 | green | bác bỏ khả năng rất mạnh | わけがない |
| 4 | red | bị ràng buộc, không thể làm | わけにはいかない |

> Khi clone cho cluster mới: map pattern theo speaker-action, không theo JP alphabet. Mục đích là build memory ổn định giữa các cluster — người học nhìn thấy blue → nghĩ ngay "kết luận".

---

## 4. Spacing & Chrome

**Comfortable mode (default):**

```
px (slide horizontal): 120px
py (slide vertical):   88px
gap-title:             48px    rule → content
gap-item:              24px    between cards
```

**Compact mode** (worksheet/print-dense):

```
px: 96px   py: 64px   gap-title: 32px   gap-item: 18px
```

**Chrome (every slide):**

| Element | Position | Content |
|---|---|---|
| `.tmpl-badge` | top-left | `● T## · Template Name` (template identity) |
| `.slide-num` | top-right | `NN / 15` |
| `.brand` | bottom-right | `lucida●` wordmark |

---

## 5. Template Specs

Each entry: **Purpose · Slots to fill · Do not break**.

### T01 · Hook Situation

- **Purpose:** Pain point trong 5–15 giây. Anchor line + tension tag.
- **Slots:** anchor JP line (2 highlighted patterns), tension tag VN, learner question
- **Keep:** anchor font-size 80px, `.hi` + `.hi-red` highlight pair, single rule line
- **Don't:** thêm grammar explanation; hook là để gây tò mò, không phải để dạy

### T02 · Hook Contrast

- **Purpose:** Show 2 near-identical sentences carry different speaker logic.
- **Slots:** sentence ① JP, sentence ② JP, takeaway VN
- **Keep:** vs-stamp between rows, takeaway dot + amber border-left
- **Don't:** dạy quá kỹ; chỉ cần làm rõ "khác mạch logic"

### T03 · Quiz Before / After

- **Purpose:** Let learner attempt before reveal.
- **Slots:** question JP với `.blank`, 3 options (1 correct), `.opt.correct` highlights answer
- **Keep:** chỉ 3 options, không hơn. `.check` icon trên option đúng.
- **Don't:** explain answer here — đẩy sang T11 (Worked Example) hoặc T13 (Trap)

### T04 · Promise Board

- **Purpose:** State outcome after hook, before deeper teaching.
- **Slots:** topic title, pattern strip (4 chips), 2 outcomes (đề + đời thật), guide question
- **Keep:** 2 outcome cards = "khi làm đề" + "ngoài đời"; guide question luôn là "Ở câu này, người nói đang muốn nói gì?"
- **Don't:** overpromise điểm số; tone phải grounded

### T05 · Story Context

- **Purpose:** Ground grammar in a natural situation.
- **Slots:** 3 beats — setting / constraint / tension. Beat 3 dùng class `.tense` (amber tint).
- **Keep:** flow setting → constraint → tension (không đảo thứ tự)
- **Don't:** map cả 4 mẫu vào story; story chỉ tạo tension, không dạy

### T06 · Method Board

- **Purpose:** Introduce reusable thinking method.
- **Slots:** 3 view cards với glyph (意 / 形 / 用), heading VN, guiding question
- **Keep:** Vietnamese labels "Ý nghĩa · Dạng · Cách dùng" — KHÔNG dùng Meaning/Form/Usage
- **Don't:** dạy grammar point ở đây; method board chỉ thiết lập mindset

### T07 · Grammar Card

- **Purpose:** Teach 1 pattern through speaker intent + 3 views.
- **Slots:** pattern JP, **speaker-action thesis** (bắt buộc), 3 view rows, 1–2 examples, 1 trap
- **Keep:** speaker-action line trả lời "người nói đang muốn nói gì?" — đây là thesis, không phải translation
- **Don't:** chỉ dạy "nghĩa = …" rồi đi ngay sang ví dụ; thiếu speaker intent thì slide fail

### T08 · Minimal Pair

- **Purpose:** Separate 2 confusable patterns by 1 explicit contrast axis.
- **Slots:** side A (amber), side B (green), contrast axis VN ở footer
- **Keep:** contrast axis phải declarative ("gỡ lại cách hiểu" vs "bác hẳn khả năng"), không vague
- **Don't:** so sánh nhiều hơn 2 patterns ở đây → dùng T09 thay

### T09 · Comparison Matrix

- **Purpose:** 3–4 patterns trong 1 decision map.
- **Slots:** 4 rows (pattern + speaker action + note + swatch color)
- **Variants:** `table` (default) hoặc `cards` (2×2 grid, toggle via Tweaks)
- **Keep:** color slot order (blue → amber → green → red) theo speaker-action archetype
- **Don't:** chỉ liệt kê nghĩa Việt; mỗi row phải có speaker action

### T10 · Clue Map

- **Purpose:** Convert understanding into answer-choice behavior.
- **Slots:** 3-step checklist (left), signal → pattern table (right)
- **Keep:** checklist phải là CỤM TỪ TRƯỚC / SAU / MẠCH LOGIC, không phải keyword list
- **Don't:** biến thành "thấy 締切 → chọn わけにはいかない" — phải là dấu hiệu để suy luận

### T11 · Worked Example

- **Purpose:** Model full solving process think-aloud.
- **Slots:** question (lặp lại từ T03), 3 options, 5-step reasoning (Step 1–4 + trap), final answer
- **Keep:** trap step bắt buộc — phải giải thích vì sao đáp án sai NGHE có vẻ đúng
- **Don't:** jump thẳng đến đáp án; mất giá trị thinking-aloud

### T12 · Diagnostic Practice

- **Purpose:** Test transfer + diagnose error type.
- **Slots:** question JP (mới, không phải lại từ T03), 3 options đều có trap-tag, hình thức warning
- **Keep:** mỗi wrong option có 1 `.trap-tag` riêng + diagnosis ngắn
- **Don't:** dùng lại câu hỏi từ T03; T12 test transfer, không retrieval

### T13 · Trap Explanation

- **Purpose:** Explain why wrong answer feels right.
- **Slots:** wrong panel (red border-top), right panel (amber border-top), decision rule strip
- **Keep:** tone tôn trọng — "nghe có vẻ đúng" không phải "sai rồi nhé"
- **Don't:** sham learner; giải thích misconception thật

### T14 · Recap Map

- **Purpose:** Screenshot-friendly memory map.
- **Slots:** 4 cells (blue/amber/green/red border-left), bonus dashed strip
- **Keep:** không info mới; chỉ consolidation. 4 cells map đúng color-action slots
- **Don't:** giải thích thêm; recap = nhớ nhanh

### T15 · CTA Diagnostic

- **Purpose:** Lead to worksheet/quiz as learning continuation.
- **Slots:** problem statement (left), 4 numbered items (right), CTA button
- **Keep:** tone learning-first — "hiểu rồi nhưng vào đề vẫn phân vân?"
- **Don't:** salesy ("Mua ngay!" / "Giới hạn!") — Lucida là teaching brand

### T16 · Form Table

- **Purpose:** Prevent form errors by isolating connection rules.
- **Slots:** pattern hero, connection table (4 rows: dạng đi trước, ví dụ, bổ sung), 1 common mistake (strike + correct), tip
- **Keep:** mistake panel phải có strike-through wrong form + correct form + WHY VN learners mắc
- **Don't:** dạy lại nghĩa; T16 chỉ về form. Pattern hero vẫn xuất hiện như reference, nhưng không giải thích.
- **Use when:** pattern có form irregular hoặc hay nhầm (V辞書形 vs Vた / な-adj nối な).

### T17 · Example Stack

- **Purpose:** Show range through 3 contexts sharing 1 logic.
- **Slots:** 3 example rows mỗi hàng có icon (社/学/家 hoặc khác), context tag, JP line, nuance VN; shared takeaway ở footer
- **Keep:** đúng 3 ví dụ (không 2, không 4). Mỗi ví dụ phải ở một register khác (formal / casual / personal)
- **Don't:** liệt kê ngẫu nhiên; mỗi ví dụ phải show một register khác
- **Use when:** pattern có nhiều sắc thái cần contrast theo context (formal/casual/personal)

### T18 · Section Divider

- **Purpose:** Break long video (>10 min) into navigable chapters.
- **Slots:** chapter number (Phần NN · Chapter NN), large chapter title, 1-line description
- **Keep:** title ở 140px hero scale, tối đa 2 dòng; description thật ngắn (1 dòng)
- **Don't:** thêm icon hoặc ảnh; section divider là visual reset, không decoration
- **Use when:** video > 8 phút hoặc có > 12 slides; chèn giữa các phase teaching

### T19 · Common Mistake

- **Purpose:** "Người Việt hay sai thế này" — branded misconception teaching moment.
- **Slots:** wrong example (red, strike-through), arrow, correct example (amber), why-VN-make-this-mistake panel
- **Keep:** VN flag badge ở đầu — đây là signature branded slide cho Lucida. Why panel phải chỉ ra cụ thể “tiếng Việt không phân biệt X và Y”.
- **Don't:** shame learner; tone phải empathetic ("hay sai" chứ không "sai rồi")
- **Use when:** có misconception đặc thù của người Việt (mạnh nhất ở cluster Wake, kai/gai cho temade-style)

### T20 · Outro

- **Purpose:** Recap one takeaway + tease next video + subscribe CTA.
- **Slots:** takeaway statement (80px display), next-episode card (left), subscribe card (right)
- **Keep:** 1 takeaway statement duy nhất — không list “3 điểm chính”. Next-episode card chỉ một pattern family + 1 line teaser.
- **Don't:** liệt kê lại toàn bộ bài; outro = 1 line + tease forward.
- **Use when:** mọi video cluster đều cần outro. Last slide.

---

## 5b. JLPT Exam-Prep Templates (T21–T25)

5 templates mô phỏng trực tiếp các dạng đề 言語知識 · 文法 của JLPT N2. Dùng để luyện đề trong bài giảng — người học thấy format thật thì bớt “đóng băng” khi vào phòng thi.

### T21 · JLPT Item Card

- **Purpose:** Mô phỏng dạng 文法形式の判断 (problem 1/12 trong N2 grammar section).
- **Slots:** qnum (問 X), qtype (文法形式), time hint (mục tiêu 45s), stem với blank đánh số, 4 options đánh số 1/2/3/4 (không phải A/B/C/D), answer strip ngắn
- **Keep:** numbering format JLPT chuẩn (1–4), có time hint, options trong circle. Layout grid 2×2.
- **Don't:** dùng A/B/C/D (đó là format quiz nội bộ T03); JLPT luôn 1–4.
- **Use when:** muốn cho người học làm thử 1 câu JLPT thật; hoặc giới thiệu format đề.

### T22 · Sentence Assembly (文の組み立て)

- **Purpose:** Dạng sắp xếp 4 mảnh + chọn mảnh nào vào vị trí ★ (dạng đặc thù N2/N1).
- **Slots:** stem với 4 frag-slot, slot thứ 3 có .star (hào quang ★), 4 fragment options, solution panel show thứ tự đúng + chỉ rõ mảnh nào là ★
- **Keep:** ★ marker trên slot focus, frag option highlighted khi tương ứng với ★; chỉ chọn số từ 1–4 (không chọn chữ)
- **Don't:** show thứ tự đúng ngay trên stem; phải để người học tự sắp rồi reveal trong solution panel
- **Use when:** dạy dạng N2 文の組み立て (mỗi đề N2 có ~4 câu dạng này).

### T23 · Passage Grammar (文章の文法)

- **Purpose:** Dạng điền vào blank trong đoạn văn liên kết — quyết định dựa vào mạch trước/sau, không chỉ dựa vào câu chứa blank.
- **Slots:** passage block với 3–4 blank đánh số, 1 blank có .focus (highlight), 4 options cho blank đó, key-note nhắc lưu mạch đoạn văn
- **Keep:** focus blank style amber + line-hạm tiễn; key-note phải nhắc “đọc mạch trước” (đây là teaching point chủ đạo của dạng này)
- **Don't:** show passage quá dài — tối đa 3–4 dòng; nếu dài phải bỏ bớt content không quan trọng cho blank
- **Use when:** dạy dạng 文章の文法 (last sub-section trong N2 grammar, ~4–5 blank/passage).

### T24 · Distractor Analysis

- **Purpose:** Phân tích 4 options + gắn trap-type chip (形違い / 似た意味 / 同じ機能 / 反対意味 / 部分一致).
- **Slots:** question card, grid 2×2 distractor cards mỗi cái có pattern + trap-chip + 1–2 dòng diagnosis, taxonomy strip liệt kê 5 loại
- **Keep:** trap-chip color-coded — wrong opts đều dùng red; correct opt dùng amber chip "正解"
- **Don't:** chỉ liệt kê "sai" — phải gắn tên loại bẫy; đây là teaching cốt lõi của slide này
- **Use when:** sau khi giải 1 câu JLPT — dùng để mời người học đọc trên kì bẫy trong các đề sau.

### T25 · Time Strategy

- **Purpose:** Budget thời gian cho section 言語知識・読解 (105 phút) + skip/invest rules.
- **Slots:** total budget hero (105 phút), progress bars cho 4 sub-section, 3 rule cards (45s/câu, skip rule, invest rule), mantra footer
- **Keep:** bar % phải match phân phối thời gian thật (読解 chiếm ~68%); rule cards icon ngắn (45s, 2', ★)
- **Don't:** chi tiết quá về dạng câu không liên quan; giữ strategy mức vĩ mô
- **Use when:** episode introduction của series luyện đề, hoặc slide cuối trước mô phỏng mock test

---

## 6. Teaching Conventions (non-negotiable)

1. **Never use English labels publicly.** Slides cho người học → "Ý nghĩa / Dạng / Cách dùng", không phải "Meaning / Form / Usage". Internal docs ok dùng English.
2. **Speaker-intent over translation.** Mỗi grammar card phải có 1 dòng trả lời "Ở câu này, người nói đang muốn nói gì?". Translation là kết quả, không phải xuất phát.
3. **Contrast axis must be explicit.** Minimal pair / comparison không được nói "khác nhau" mơ hồ. Phải có 1 trục so sánh cụ thể.
4. **Worked example includes trap elimination.** Không chỉ chốt đáp án đúng — phải giải thích vì sao B/C nghe có vẻ ổn mà sai.
5. **Diagnostic Practice attaches trap tag per wrong option.** Để worksheet/quiz có thể chẩn đoán learner đang sập bẫy loại nào.
6. **Recap is consolidation only.** Không có info mới.
7. **CTA is learning-first.** Worksheet = chẩn đoán bẫy, không phải PDF tóm tắt.

---

## 7. Reuse Workflow

Khi build deck cho cluster mới (ví dụ ばかり family, kai/gai/temade):

1. **Duplicate** `lucida-n2-slide-templates.html` → `<cluster>-deck.html`
2. **Audit skeleton** — cluster mới cần Master Teaching Skeleton trước (theo `lessons/templates/01-master-teaching-skeleton-template.md`)
3. **Replace JP content** trong từng `<section>` — giữ class names, `.tmpl-badge`, `.slide-num`, `.brand` nguyên
4. **Map patterns vào color slots** theo speaker-action (xem §3 — không theo JP alphabet)
5. **Rewrite speaker-intent lines** cho T07 — không copy paste Wake
6. **Validate** từng slide theo QA checklist `production/01-rules/slide-system/04-slide-framework-qa-checklist.md`
7. **Light mode pass** — print preview qua Tweaks → Print mode để kiểm tra worksheet variant

---

## 8. File Dependencies

```
lucida-n2-slide-templates.html
├─ deck-stage.js          slide shell (scaling, nav, print)
├─ tweaks-panel.jsx       Tweaks controls
└─ Google Fonts: Be Vietnam Pro · DM Sans · Manrope · Plus Jakarta Sans
                 Newsreader · Source Sans 3 · JetBrains Mono · Noto Sans JP
```

---

*Lucida · v1.0 · 15 slide templates · 1920×1080 · Be Vietnam Pro default*
