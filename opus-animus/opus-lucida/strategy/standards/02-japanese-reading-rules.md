# Standard: Japanese Reading Rules for Audio Generation
**Version:** 1.0
**Date:** 2026-05-01
**Scope:** All Lucida scripts containing mixed Vietnamese + Japanese text

---

## Purpose

Defines how the audio agent classifies and reads Japanese text in teaching scripts.
Rules apply to `parse_script.py` chunking and `tts_agent.py` routing.

---

## Classification Rules

### Type 1: JP_BLOCK — Full Japanese sentence/phrase

**Signal (any one of):**
- Blockquote line: `> 行きたくないわけではありません。`
- Standalone line ending with Japanese punctuation `。` `？` `！`
- Full example sentence presented for student to study

**Action:** → **Voicevox** (Shikoku Metan, ID: 2, style: Normal)

**Rationale:** Student must hear native pitch-accent for grammar study. Metan's clear
enunciation matches JLPT CD audio style. No transliteration — raw Japanese text passed
directly to Voicevox.

**Example in script:**
```
> 行きたくないわけではありません。
> 今日は行くわけにはいきません。
```

---

### Type 2: JP_INLINE — Short Japanese term embedded in Vietnamese sentence

**Signal (any one of):**
- Backtick inline: `` `わけ` ``, `` `飲み会` ``, `` `締切` ``
- Japanese characters appearing mid-sentence within Vietnamese paragraph
- Term is a vocabulary word, not a grammar example sentence

**Action:** → **pykakasi** (local, offline) → romaji → **edge-tts** (vi-VN-HoaiMyNeural)

**Rationale:** Cutting to a different voice mid-sentence creates jarring pacing break.
N2 students recognize these terms as loanwords/context vocabulary — native pitch-accent
is not the learning goal here; flow continuity is.

**Romaji post-processing:** Standard Hepburn romaji from pykakasi is sufficient.
No need to Vietnamize (e.g., "shi-mê-ki-ri") — keep as "shimekiri".

**Example in script:**
```
Trong công ty Nhật, `締切` là thứ không thể bỏ qua.
→ edge-tts reads: "Trong công ty Nhật, shimekiri là thứ không thể bỏ qua."
```

---

### Type 3: PAUSE_TAG — Explicit pause marker

**Signal:** `[PAUSE Xs]` in script

**Action:** → ffmpeg silence of exactly X seconds

---

## Decision Tree for Script Writers

```
Có tiếng Nhật trong script?
├── Câu hoàn chỉnh / blockquote / ví dụ ngữ pháp
│   └── → JP_BLOCK → dùng blockquote: > 文
└── Từ đơn / thuật ngữ chêm trong câu tiếng Việt
    └── → JP_INLINE → dùng backtick: `単語`
```

---

## Voicevox Voice Reference

| Character | ID | Style | Use case |
|---|---|---|---|
| Shikoku Metan | 2 | Normal | JP_BLOCK — primary voice |
| Shikoku Metan | 0 | Amai | Alternative if Normal too flat |
| Zundamon | 3 | Normal | Not recommended for N2 academic content |

---

## What Script Writers Must NOT Do

- ❌ Do not write JP example sentences inline in a paragraph — use blockquote
- ❌ Do not write romaji manually in script — agent handles conversion
- ❌ Do not mix `[PAUSE Xs]` inside a Japanese blockquote line
- ❌ Do not use `**bold**` inside backtick JP_INLINE terms
