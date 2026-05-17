"""
deck_generator.py — Generate <topic>-deck.html from 03-slide-deck.md.

MVP: 1 final-state frame per slide (all reveals shown at once).
08-production-frame-map.md drives HTML design intent; screenshot_slides.py
exports 1 PNG per slide for the current assembly pipeline.

Future upgrade: parse reveal states → multi-frame export (slide-14-01.png etc.)

Usage:
    python automation/video/deck_generator.py \\
        production/00-active/wake-cluster/03-slide-deck.md \\
        production/00-active/wake-cluster/wake-cluster-deck.html

    # With topic label:
    python automation/video/deck_generator.py \\
        production/00-active/wake-cluster/03-slide-deck.md \\
        production/00-active/wake-cluster/wake-cluster-deck.html \\
        --topic "JLPT N2 · 4 mẫu わけ"
"""

import argparse
import re
import sys
from html import escape
from pathlib import Path

# ── Layout hints (slide_number → layout class) ────────────────────────────────
# Grammar slides: big pattern name + breakdown
# Quiz slides: centered choice list
# Comparison: rows of pattern → action
# Default: left-aligned body text
LAYOUT_MAP = {
    1:  "quote",
    2:  "quiz",
    3:  "promise",
    4:  "story",
    5:  "framework",
    6:  "grammar",
    7:  "grammar",
    8:  "grammar",
    9:  "grammar",
    10: "comparison",
    11: "comparison",
    12: "comparison",
    13: "clue",
    14: "quiz",
    15: "quiz",
    16: "comparison",
    17: "cta",
}

DISPLAY_TITLE_MAP = {
    1: "Tình huống mở đầu",
    2: "Thử chọn nhanh",
    3: "Bài này giúp gì?",
    4: "Tình huống thực tế",
    5: "Cách nhìn để phân biệt",
    6: "Mẫu 1: đính chính",
    7: "Mẫu 2: ràng buộc",
    8: "Mẫu 3: kết luận",
    9: "Mẫu 4: bác bỏ mạnh",
    10: "Nhìn nhanh cả nhóm",
    11: "Cặp dễ nhầm 1",
    12: "Cặp dễ nhầm 2",
    13: "Bản đồ dấu hiệu",
    14: "Giải đề từng bước",
    15: "Luyện chẩn đoán",
    16: "Tổng kết nhanh",
    17: "Worksheet & quiz",
}

FOOTER_CUE_MAP = {
    1: "Người nói đang muốn nói gì?",
    2: "Bạn sẽ chọn đáp án nào?",
    3: "Học xong bạn sẽ đỡ nhầm ở đâu?",
    4: "Không phải không muốn, mà là không thể",
    5: "Đừng nhìn chữ わけ vội",
    6: "Chỗ này đang đính chính lại điều gì?",
    7: "Muốn cũng không làm được vì sao?",
    8: "Nghe đến đây thì hiểu ra điều gì?",
    9: "Người nói đang bác bỏ mạnh điều gì?",
    10: "Bốn mẫu này khác nhau ở đâu?",
    11: "Hai mẫu này dễ nhầm ở chỗ nào?",
    12: "Đừng nhầm không thể với không có khả năng",
    13: "Nhìn dấu hiệu nào để chọn đúng?",
    14: "Gặp câu này thì nên nghĩ theo bước nào?",
    15: "Bạn đang nhầm ở kiểu nào?",
    16: "Chốt lại từng mẫu trong một câu",
    17: "Luyện tiếp để bớt phân vân khi làm bài",
}

JP_RE = re.compile(r"[　-鿿＀-￯]")

# Longest first so partial matches don't fire early
WAKE_PATTERNS = [
    "わけにはいかない",
    "わけではない",
    "わけがない",
    "わけだ",
]


# ── Markdown parser ───────────────────────────────────────────────────────────

def parse_slide_deck(md_text: str) -> list[dict]:
    slide_re = re.compile(r"^## Slide (\d+) - (.+)$", re.MULTILINE)
    matches = list(slide_re.finditer(md_text))

    slides = []
    for i, m in enumerate(matches):
        num = int(m.group(1))
        title = m.group(2).strip()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(md_text)
        section = md_text[m.end():end]
        slides.append({"num": num, "title": title, "onscreen": _extract_onscreen(section)})

    return slides


def filter_slides(slides: list[dict], start: int | None, end: int | None) -> list[dict]:
    if start is None and end is None:
        return slides

    lo = start if start is not None else slides[0]["num"]
    hi = end if end is not None else slides[-1]["num"]
    return [s for s in slides if lo <= s["num"] <= hi]


def _display_title(slide: dict) -> str:
    return DISPLAY_TITLE_MAP.get(slide["num"], slide["title"])


def _footer_cue(slide: dict) -> str:
    return FOOTER_CUE_MAP.get(slide["num"], "Phân biệt 4 mẫu わけ")


def _extract_onscreen(section: str) -> str:
    """Return final-state on-screen text. Prefer 'after reveal' block."""
    for pattern in [
        r"\*\*On-screen after reveal:\*\*\s*```text\s*(.*?)```",
        r"\*\*On-screen:\*\*\s*```text\s*(.*?)```",
    ]:
        m = re.search(pattern, section, re.DOTALL | re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return ""


# ── Line rendering ────────────────────────────────────────────────────────────

def _hl_patterns(text: str) -> str:
    for p in WAKE_PATTERNS:
        text = text.replace(p, f'<span class="hl-amber">{p}</span>')
    return text


def _render_line(raw: str) -> str:
    if not raw.strip():
        return '<div class="gap"></div>'

    safe = _hl_patterns(escape(raw.strip()))
    is_jp = bool(JP_RE.search(raw))
    stripped = raw.strip()

    if stripped[:2] in ("A.", "B.", "C.", "D."):
        return f'<div class="choice">{safe}</div>'
    if stripped.startswith(("- ", "• ")):
        bullet_text = _hl_patterns(escape(stripped[2:].strip()))
        return f'<div class="bullet"><span class="bullet-dot"></span><span class="bullet-text">{bullet_text}</span></div>'
    if stripped.startswith("→") or stripped.startswith("= "):
        return f'<div class="arrow">{safe}</div>'
    if stripped.startswith(("Trap", "Bonus", "答え")):
        return f'<div class="label">{safe}</div>'
    if is_jp and len(stripped) > 22:
        return f'<div class="jp-long">{safe}</div>'
    if is_jp:
        return f'<div class="jp-short">{safe}</div>'
    return f'<div class="text">{safe}</div>'


def _render_grammar_body(onscreen: str) -> str:
    """Grammar slides: first JP line becomes pattern headline."""
    lines = onscreen.split("\n")
    parts: list[str] = []
    headline_done = False

    for line in lines:
        s = line.strip()
        if not s:
            parts.append('<div class="gap"></div>')
            continue
        if not headline_done and JP_RE.search(s) and len(s) < 20:
            safe = _hl_patterns(escape(s))
            parts.append(f'<div class="pattern-headline">{safe}</div>')
            headline_done = True
            continue
        parts.append(_render_line(line))

    return "\n".join(parts)


def _render_promise_body(onscreen: str) -> str:
    lines = [line.strip() for line in onscreen.split("\n")]
    lines = [line for line in lines if line]

    if len(lines) < 10:
        return "\n".join(_render_line(l) for l in onscreen.split("\n"))

    title = escape(lines[0])
    patterns = [_hl_patterns(escape(line)) for line in lines[1:5]]
    subhead = escape(lines[5])
    left_title = escape(lines[6])
    left_body = escape(lines[7].lstrip("→").strip())
    right_title = escape(lines[8])
    right_body = escape(" ".join([lines[9].lstrip("→").strip(), *lines[10:]]).strip())

    pattern_html = "".join(
        f'<span class="promise-pattern">{pattern}</span>' for pattern in patterns
    )

    return f"""\
<div class="promise-hero">{title}</div>
<div class="promise-pattern-row">{pattern_html}</div>
<div class="promise-subhead">{subhead}</div>
<div class="promise-grid">
  <div class="promise-card">
    <div class="promise-card-title">{left_title}</div>
    <div class="promise-card-body">{left_body}</div>
  </div>
  <div class="promise-card">
    <div class="promise-card-title">{right_title}</div>
    <div class="promise-card-body">{right_body}</div>
  </div>
</div>"""


def _render_story_body(onscreen: str) -> str:
    lines = [line.strip() for line in onscreen.split("\n") if line.strip()]
    if len(lines) < 2:
        return "\n".join(_render_line(l) for l in onscreen.split("\n"))

    invite = escape(lines[0])
    constraint = escape(lines[1])
    return f"""\
<div class="story-kicker">Tình huống này nghe rất quen khi vừa học vừa đi làm.</div>
<div class="story-grid">
  <div class="story-card story-card-invite">
    <div class="story-card-label">Lời rủ</div>
    <div class="story-card-body">{invite}</div>
  </div>
  <div class="story-card story-card-constraint">
    <div class="story-card-label">Việc đang giữ lại</div>
    <div class="story-card-body">{constraint}</div>
  </div>
</div>
<div class="story-tension">
  Không phải là không muốn đi.
  <span class="story-tension-strong">Chỉ là tối nay không thể đi được.</span>
</div>"""


def _render_framework_body(onscreen: str) -> str:
    lines = [line.strip() for line in onscreen.split("\n") if line.strip()]
    if len(lines) < 6:
        return "\n".join(_render_line(l) for l in onscreen.split("\n"))

    headline = escape(lines[0])
    triad = escape(lines[1])
    meaning = escape(lines[2].split(":", 1)[1].strip()) if ":" in lines[2] else escape(lines[2])
    form = escape(lines[3].split(":", 1)[1].strip()) if ":" in lines[3] else escape(lines[3])
    usage = escape(lines[4].split(":", 1)[1].strip()) if ":" in lines[4] else escape(lines[4])
    mantra_1 = escape(lines[5])
    mantra_2 = escape(lines[6]) if len(lines) > 6 else ""

    return f"""\
<div class="framework-headline">{headline}</div>
<div class="framework-triad">{triad}</div>
<div class="framework-grid">
  <div class="framework-card">
    <div class="framework-card-title">Nghĩa</div>
    <div class="framework-card-body">{meaning}</div>
  </div>
  <div class="framework-card">
    <div class="framework-card-title">Hình</div>
    <div class="framework-card-body">{form}</div>
  </div>
  <div class="framework-card">
    <div class="framework-card-title">Dụng</div>
    <div class="framework-card-body">{usage}</div>
  </div>
</div>
<div class="framework-mantra">
  <div class="framework-mantra-line">{mantra_1}</div>
  <div class="framework-mantra-line strong">{mantra_2}</div>
</div>"""


def _render_body(slide: dict) -> str:
    layout = LAYOUT_MAP.get(slide["num"], "default")
    onscreen = slide["onscreen"]

    if layout == "grammar":
        return _render_grammar_body(onscreen)
    if layout == "promise":
        return _render_promise_body(onscreen)
    if layout == "story":
        return _render_story_body(onscreen)
    if layout == "framework":
        return _render_framework_body(onscreen)

    return "\n".join(_render_line(l) for l in onscreen.split("\n"))


# ── HTML rendering ────────────────────────────────────────────────────────────

_TOTAL = 17  # updated automatically from parse result


def _slide_html(slide: dict, total: int) -> str:
    num = slide["num"]
    layout = LAYOUT_MAP.get(num, "default")
    body = _render_body(slide)
    display_title = _display_title(slide)
    footer_cue = _footer_cue(slide)
    return f"""\
<div class="slide layout-{layout}" data-n="{num}">
  <div class="topbar">
    <div class="slide-head">
      <span class="slide-num">{num:02d}</span>
      <span class="slide-title">{escape(display_title)}</span>
    </div>
    <span class="topic-tag">4 mẫu わけ trong N2</span>
  </div>
  <div class="body">
{body}
  </div>
  <div class="footer">
    <span class="brand">Phân biệt 4 mẫu わけ</span>
    <span class="footer-cue">{escape(footer_cue)}</span>
    <span class="counter">{num} / {total}</span>
  </div>
</div>"""


_CSS = """
@font-face {
  font-family: "SF Pro Display Local";
  src: url("../../02-assets/fonts/sf-pro/payload-extract/Library/Fonts/SF-Pro-Display-Regular.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: "SF Pro Display Local";
  src: url("../../02-assets/fonts/sf-pro/payload-extract/Library/Fonts/SF-Pro-Display-Semibold.otf") format("opentype");
  font-weight: 600;
  font-style: normal;
}
@font-face {
  font-family: "SF Pro Display Local";
  src: url("../../02-assets/fonts/sf-pro/payload-extract/Library/Fonts/SF-Pro-Display-Bold.otf") format("opentype");
  font-weight: 700;
  font-style: normal;
}
@font-face {
  font-family: "SF Pro Display Local";
  src: url("../../02-assets/fonts/sf-pro/payload-extract/Library/Fonts/SF-Pro-Display-Heavy.otf") format("opentype");
  font-weight: 800;
  font-style: normal;
}
@font-face {
  font-family: "SF Pro Text Local";
  src: url("../../02-assets/fonts/sf-pro/payload-extract/Library/Fonts/SF-Pro-Text-Regular.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: "SF Pro Text Local";
  src: url("../../02-assets/fonts/sf-pro/payload-extract/Library/Fonts/SF-Pro-Text-Medium.otf") format("opentype");
  font-weight: 500;
  font-style: normal;
}
@font-face {
  font-family: "SF Pro Text Local";
  src: url("../../02-assets/fonts/sf-pro/payload-extract/Library/Fonts/SF-Pro-Text-Semibold.otf") format("opentype");
  font-weight: 600;
  font-style: normal;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --phi:     1.618;
  --size--1: calc(18px / var(--phi));
  --size-0:  18px;
  --size-1:  calc(var(--size-0) * var(--phi));
  --size-2:  calc(var(--size-1) * var(--phi));
  --size-3:  calc(var(--size-2) * var(--phi));
  --ink:     #17191c;
  --ink-2:   #2b2f34;
  --muted:   rgba(43,47,52,.68);
  --soft:    rgba(43,47,52,.46);
  --paper:   #fbfbf8;
  --silver:  #eef1f4;
  --silver-2:#e3e8ee;
  --amber:   #b08a57;
  --amber-soft: rgba(176,138,87,.14);
  --blue:    #6f8296;
  --blue-soft: rgba(111,130,150,.14);
  --red:     #9a514b;
  --green:   #6f8b6b;
  --border:  rgba(23,25,28,.10);
  --border-soft: rgba(23,25,28,.06);
  --stage-width: 1236px;
  --f-ui:    "SF Pro Text Local", "Segoe UI", Arial, sans-serif;
  --f-ui-display: "SF Pro Display Local", "SF Pro Text Local", "Segoe UI", Arial, sans-serif;
  --f-jp:    "Noto Sans JP", "BIZ UDPGothic", Meiryo, sans-serif;
  --f-serif: "Source Serif 4", Georgia, serif;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #dde3ea 0%, #edf1f5 24%, #f6f8fa 100%);
}

/* ── deck-stage ─────────────────────── */
.viewport {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

deck-stage {
  display: block;
  width: 1920px;
  height: 1080px;
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: top left;
}

/* ── slide ──────────────────────────── */
.slide {
  display: none;
  position: absolute;
  inset: 0;
  width: 1920px;
  height: 1080px;
  grid-template-rows: 76px 1fr 58px;
  justify-items: center;
  gap: 0;
  padding: 44px 72px 32px;
  color: var(--ink);
  font-family: var(--f-ui);
  background:
    radial-gradient(ellipse at 50% -8%, rgba(255,255,255,.98) 0%, rgba(255,255,255,.78) 18%, transparent 42%),
    radial-gradient(ellipse at 50% 118%, rgba(208,216,226,.32) 0%, transparent 42%),
    radial-gradient(circle at 8% 2%, rgba(162,174,190,.12) 0%, transparent 24%),
    radial-gradient(circle at 92% 2%, rgba(162,174,190,.12) 0%, transparent 24%),
    linear-gradient(135deg, rgba(255,255,255,.34) 0%, rgba(255,255,255,0) 38%),
    linear-gradient(180deg, #fbfcfd 0%, #f3f6f9 28%, #e7edf2 64%, #dbe2e9 100%);
}

.slide.active { display: grid; }

/* ── topbar ─────────────────────────── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
  max-width: var(--stage-width);
  margin: 0 auto 18px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 18px;
}

.slide-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.slide-num {
  font-size: 22px;
  font-weight: 800;
  color: var(--amber);
  letter-spacing: .02em;
  min-width: 34px;
  font-family: var(--f-ui-display);
  flex: 0 0 auto;
}

.slide-title {
  font-size: var(--size-1);
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -.01em;
  line-height: 1.15;
  flex: 1;
  min-width: 0;
  font-family: var(--f-ui-display);
}

.topic-tag {
  font-size: 14px;
  color: var(--amber);
  letter-spacing: .01em;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(176,138,87,.22);
  background: rgba(255,255,255,.62);
  white-space: nowrap;
  font-family: var(--f-ui);
  flex: 0 0 auto;
}

/* ── footer ─────────────────────────── */
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: var(--stage-width);
  margin: 0 auto;
  border-top: 1px solid var(--border-soft);
  padding-top: 12px;
  gap: 18px;
}

.brand {
  font-family: var(--f-serif);
  font-size: var(--size-0);
  color: var(--soft);
}

.footer-cue {
  flex: 1;
  text-align: center;
  font-size: var(--size-0);
  color: var(--muted);
  font-family: var(--f-ui);
}

.counter {
  font-size: var(--size--1);
  color: var(--soft);
}

/* ── slide body ─────────────────────── */
.body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  max-width: var(--stage-width);
  margin: 0 auto;
  width: 100%;
  overflow: hidden;
  min-height: 764px;
  padding: 46px 50px;
  border-radius: 30px;
  background: linear-gradient(180deg, rgba(255,255,255,.80), rgba(255,255,255,.62));
  border: 1px solid var(--border);
  box-shadow: 0 1px 0 rgba(255,255,255,.92) inset, 0 24px 52px rgba(98,114,132,.10);
}

/* ── line types ─────────────────────── */
.text {
  font-size: var(--size-1);
  line-height: 1.5;
  color: var(--ink-2);
  font-family: var(--f-ui);
}

.jp-long {
  font-family: var(--f-jp);
  font-size: var(--size-2);
  font-weight: 700;
  line-height: 1.38;
}

.jp-short {
  font-family: var(--f-jp);
  font-size: var(--size-2);
  font-weight: 700;
  line-height: 1.4;
}

.arrow {
  font-size: var(--size-1);
  line-height: 1.55;
  color: var(--muted);
  padding-left: 24px;
  font-family: var(--f-ui);
}

.choice {
  font-size: var(--size-1);
  line-height: 1.65;
  color: var(--ink-2);
  padding: 18px 22px;
  border-radius: 18px;
  border: 1px solid var(--border-soft);
  background: rgba(255,255,255,.58);
  box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 10px 28px rgba(92,108,128,.08);
  font-family: var(--f-ui);
}

.bullet {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-family: var(--f-ui);
  color: var(--ink-2);
  font-size: var(--size-1);
  line-height: 1.5;
}

.bullet-dot {
  width: 10px;
  height: 10px;
  margin-top: 12px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(176,138,87,.95), rgba(176,138,87,.72));
  box-shadow: 0 0 0 4px rgba(176,138,87,.10);
  flex: 0 0 auto;
}

.bullet-text {
  flex: 1;
  min-width: 0;
}

.label {
  font-size: var(--size-0);
  font-weight: 600;
  color: var(--amber);
  margin-top: 6px;
  font-family: var(--f-ui-display);
}

.gap { height: 16px; }

.hl-amber {
  color: var(--amber);
  font-weight: 700;
}

/* ── pattern headline (grammar slides) ─ */
.pattern-headline {
  font-family: var(--f-jp);
  font-size: var(--size-3);
  font-weight: 800;
  line-height: 1.1;
  color: var(--amber);
  margin-bottom: 12px;
}

/* ── layout: quote (slide 01) ────────── */
.layout-quote .jp-long {
  font-size: var(--size-2);
  line-height: 1.42;
}

.layout-quote .body {
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.layout-quote .jp-short,
.layout-quote .jp-long,
.layout-quote .text {
  width: 100%;
  padding: 8px 6px;
}

/* ── layout: quiz ────────────────────── */
.layout-quiz .body {
  align-items: center;
  gap: 10px;
}

.layout-quiz .jp-long {
  font-size: var(--size-2);
  margin-bottom: 4px;
}

.layout-quiz .jp-short {
  font-size: var(--size-2);
  margin-bottom: 4px;
}

.layout-quiz .jp-short,
.layout-quiz .jp-long {
  width: 100%;
  padding: 6px 4px;
}

.layout-quiz .choice {
  font-size: var(--size-1);
  padding: 14px 18px;
}

/* ── layout: comparison ─────────────── */
.layout-comparison .body {
  gap: 14px;
}

.layout-comparison .jp-short {
  font-size: var(--size-2);
}

/* ── layout: story (slide 04) ────────── */
.layout-story .body {
  justify-content: center;
  gap: 22px;
}

.story-kicker {
  width: 100%;
  text-align: center;
  font-family: var(--f-ui);
  font-size: 22px;
  line-height: 1.45;
  color: var(--muted);
}

.story-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.story-card {
  min-height: 240px;
  padding: 28px 30px;
  border-radius: 28px;
  border: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(255,255,255,.84), rgba(255,255,255,.66));
  box-shadow: 0 1px 0 rgba(255,255,255,.92) inset, 0 18px 40px rgba(98,114,132,.08);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.story-card-label {
  font-family: var(--f-ui-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--amber);
}

.story-card-body {
  font-family: var(--f-ui-display);
  font-size: 34px;
  line-height: 1.25;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -.02em;
}

.story-tension {
  width: 100%;
  padding: 18px 24px;
  border-radius: 22px;
  background: rgba(255,255,255,.58);
  border: 1px solid rgba(176,138,87,.14);
  font-family: var(--f-ui);
  font-size: 24px;
  line-height: 1.5;
  color: var(--ink-2);
  text-align: center;
}

.story-tension-strong {
  display: block;
  margin-top: 6px;
  font-family: var(--f-ui-display);
  font-weight: 700;
  color: var(--ink);
}

/* ── layout: promise (slide 03) ──────── */
.layout-promise .body {
  justify-content: center;
  align-items: center;
  gap: 18px;
  min-height: 764px;
}

.promise-hero {
  width: 100%;
  text-align: center;
  font-family: var(--f-jp);
  font-size: var(--size-2);
  font-weight: 700;
  line-height: 1.22;
  color: var(--ink);
}

.promise-pattern-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.promise-pattern {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.72);
  box-shadow: 0 1px 0 rgba(255,255,255,.9) inset;
  font-family: var(--f-jp);
  font-size: 22px;
  font-weight: 700;
  color: var(--ink);
}

.promise-subhead {
  width: 100%;
  text-align: center;
  font-family: var(--f-ui-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  margin-top: 6px;
  position: relative;
  padding-bottom: 18px;
}

.promise-subhead::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 132px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(176,138,87,0) 0%, rgba(176,138,87,.95) 50%, rgba(176,138,87,0) 100%);
}

.promise-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 6px;
}

.promise-card {
  min-height: 220px;
  padding: 26px 28px;
  border-radius: 28px;
  border: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(255,255,255,.82), rgba(255,255,255,.64));
  box-shadow: 0 1px 0 rgba(255,255,255,.92) inset, 0 18px 40px rgba(98,114,132,.08);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.promise-card-title {
  font-family: var(--f-ui-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--amber);
  letter-spacing: -.01em;
}

.promise-card-body {
  font-family: var(--f-ui);
  font-size: 24px;
  line-height: 1.55;
  color: var(--ink-2);
}

/* ── layout: framework (slide 05) ────── */
.layout-framework .body {
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.framework-headline {
  width: 100%;
  text-align: center;
  font-family: var(--f-ui-display);
  font-size: 34px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -.02em;
}

.framework-triad {
  width: 100%;
  text-align: center;
  font-family: var(--f-ui-display);
  font-size: 26px;
  font-weight: 700;
  color: var(--amber);
}

.framework-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.framework-card {
  min-height: 250px;
  padding: 26px 24px;
  border-radius: 28px;
  border: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(255,255,255,.84), rgba(255,255,255,.66));
  box-shadow: 0 1px 0 rgba(255,255,255,.92) inset, 0 18px 40px rgba(98,114,132,.08);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.framework-card-title {
  font-family: var(--f-ui-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--amber);
}

.framework-card-body {
  font-family: var(--f-ui);
  font-size: 22px;
  line-height: 1.55;
  color: var(--ink-2);
}

.framework-mantra {
  width: 100%;
  padding: 20px 24px;
  border-radius: 22px;
  background: rgba(255,255,255,.58);
  border: 1px solid rgba(176,138,87,.14);
  text-align: center;
}

.framework-mantra-line {
  font-family: var(--f-ui);
  font-size: 22px;
  line-height: 1.45;
  color: var(--ink-2);
}

.framework-mantra-line.strong {
  margin-top: 6px;
  font-family: var(--f-ui-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--ink);
}

/* ── layout: grammar ─────────────────── */
.layout-grammar .body {
  gap: 12px;
}

/* ── layout: cta ─────────────────────── */
.layout-cta .body {
  justify-content: center;
  align-items: flex-start;
  gap: 14px;
}

.layout-cta .text {
  font-size: var(--size-1);
}
"""

_JS = """
class DeckStage extends HTMLElement {
  constructor() {
    super();
    this.index = 0;
    this.timer = null;
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  get length() {
    return this.querySelectorAll('.slide').length;
  }

  goTo(i) {
    this.index = Math.max(0, Math.min(i, this.length - 1));
    this.querySelectorAll('.slide').forEach((s, idx) => {
      s.classList.toggle('active', idx === this.index);
    });
  }

  next() {
    this.goTo(Math.min(this.index + 1, this.length - 1));
  }

  prev() {
    this.goTo(Math.max(this.index - 1, 0));
  }

  play(ms) {
    this.stop();
    this.timer = window.setInterval(() => {
      if (this.index >= this.length - 1) {
        this.stop();
        return;
      }
      this.next();
    }, ms);
  }

  stop() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  handleKeydown(e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      this.next();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      this.prev();
    }
  }

  handleResize() {
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    const x = (window.innerWidth - 1920 * scale) / 2;
    const y = (window.innerHeight - 1080 * scale) / 2;
    this.style.left = `${x}px`;
    this.style.top = `${y}px`;
    this.style.transform = `scale(${scale})`;
  }

  connectedCallback() {
    this.goTo(0);
    this.handleResize();
    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('resize', this.handleResize);

    const params = new URLSearchParams(window.location.search);
    const autoplay = params.get('autoplay');
    const ms = Number(params.get('ms') || '2500');
    if (autoplay === '1' || autoplay === 'true') {
      this.play(Number.isFinite(ms) && ms > 0 ? ms : 2500);
    }
  }

  disconnectedCallback() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('resize', this.handleResize);
  }
}
customElements.define('deck-stage', DeckStage);
"""


def generate_html(slides: list[dict], topic: str) -> str:
    total = len(slides)
    slides_html = "\n".join(_slide_html(s, total) for s in slides)
    return f"""\
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1920, initial-scale=1" />
  <title>{escape(topic)}</title>
  <style>{_CSS}</style>
</head>
<body>
<div class="viewport">
<deck-stage>
{slides_html}
</deck-stage>
</div>
<script>{_JS}</script>
</body>
</html>
"""


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(description="Generate HTML deck from slide-deck.md")
    ap.add_argument("src", help="Path to 03-slide-deck.md")
    ap.add_argument("dst", help="Output HTML path")
    ap.add_argument("--start", type=int, help="First slide number to include")
    ap.add_argument("--end", type=int, help="Last slide number to include")
    ap.add_argument("--topic", default="JLPT N2 · 4 mẫu わけ", help="Topic label for title/tag")
    args = ap.parse_args()

    src = Path(args.src)
    if not src.exists():
        print(f"ERROR: {src} not found", file=sys.stderr)
        sys.exit(1)

    md = src.read_text(encoding="utf-8")
    slides = parse_slide_deck(md)

    if not slides:
        print("ERROR: no slides parsed — check ## Slide XX - Title headings", file=sys.stderr)
        sys.exit(1)

    if args.start is not None and args.end is not None and args.start > args.end:
        print("ERROR: --start cannot be greater than --end", file=sys.stderr)
        sys.exit(1)

    slides = filter_slides(slides, args.start, args.end)
    if not slides:
        print("ERROR: no slides remain after applying --start/--end filter", file=sys.stderr)
        sys.exit(1)

    html = generate_html(slides, args.topic)

    dst = Path(args.dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(html, encoding="utf-8")

    print(f"[deck_generator] {len(slides)} slides -> {dst}")


if __name__ == "__main__":
    main()


