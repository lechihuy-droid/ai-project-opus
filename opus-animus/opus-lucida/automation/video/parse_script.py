"""
parse_script.py — Parse slide scripts from a markdown script file.

Extracts the **Script:** section from each slide block.
[PAUSE Xs] markers are kept inline; tts_agent.py will handle them as silence.

Returns list of SlideScript(num, title, text, pauses)
where text is clean narration and pauses is [{pos_char, seconds}].

Usage (as module):
    from parse_script import load_slides
    slides = load_slides(Path("production/.../02-script.md"), slide_range=(1, 17))
"""

import re
from dataclasses import dataclass, field
from pathlib import Path


SLIDE_HEADER  = re.compile(r"^#\s+Slide\s+(\d+)\s+\S+\s+(.+)$", re.MULTILINE)
SCRIPT_SECTION = re.compile(r"\*\*Script:\*\*\s*\n(.*?)(?=\*\*[A-Z]|\Z)", re.DOTALL)
PAUSE_MARKER  = re.compile(r"\[PAUSE\s+(\d+(?:\.\d+)?)s\]", re.IGNORECASE)

# Named TTS pause markers (written by subagent script writers)
# Values in seconds — tune here to change pacing globally
_NAMED_PAUSE_MS: dict[str, float] = {
    "TTS_PAUSE_SHORT": 0.30,
    "TTS_PAUSE_MED":   0.60,
    "TTS_PAUSE_LONG":  1.20,
    "TTS_REVEAL":      0.80,
}
_NAMED_PAUSE_RE = re.compile(
    r"\[(" + "|".join(_NAMED_PAUSE_MS) + r")\]", re.IGNORECASE
)

# Chunk detection
_BLOCKQUOTE = re.compile(r"^>\s*(.+)$")
_PAUSE_LINE = re.compile(r"^\[PAUSE\s+(\d+(?:\.\d+)?)s\]$", re.IGNORECASE)
_NAMED_PAUSE_LINE = re.compile(
    r"^\[(" + "|".join(_NAMED_PAUSE_MS) + r")\]$", re.IGNORECASE
)
_JP_CHARS   = re.compile(r"[぀-ヿ一-鿿]")
EMPHASIS_MARKER = re.compile(r"\[NHẤN\][^\n]*\n?")
MD_BOLD = re.compile(r"\*\*(.+?)\*\*")
BACKTICK = re.compile(r"`([^`]+)`")


@dataclass
class PausePoint:
    pos_char: int   # character position in clean_text where pause goes
    seconds: float


@dataclass
class SlideScript:
    num: int
    title: str
    raw_text: str           # full script section as-is
    clean_text: str         # narration only, no markers/markdown
    pauses: list[PausePoint] = field(default_factory=list)


def _extract_script_section(slide_body: str) -> str:
    m = SCRIPT_SECTION.search(slide_body)
    if not m:
        return ""
    return m.group(1).strip()


def _parse_pauses_and_clean(raw: str) -> tuple[str, list[PausePoint]]:
    """Replace [PAUSE Xs] and named [TTS_PAUSE_*] markers with placeholder, record positions, then clean."""
    pauses: list[PausePoint] = []
    PLACEHOLDER = "\x00"
    pause_seconds: list[float] = []

    def replace_pause(m: re.Match) -> str:
        pause_seconds.append(float(m.group(1)))
        return PLACEHOLDER

    def replace_named(m: re.Match) -> str:
        pause_seconds.append(_NAMED_PAUSE_MS[m.group(1).upper()])
        return PLACEHOLDER

    text = PAUSE_MARKER.sub(replace_pause, raw)
    text = _NAMED_PAUSE_RE.sub(replace_named, text)

    # Strip [NHẤN] emphasis markers
    text = EMPHASIS_MARKER.sub("", text)

    # Strip markdown bold and backtick inline code (keep content)
    text = MD_BOLD.sub(r"\1", text)
    text = BACKTICK.sub(r"\1", text)

    # Strip leading # headings
    text = re.sub(r"^#+\s+", "", text, flags=re.MULTILINE)

    # Collapse extra blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = text.strip()

    # Now record pause positions against clean text
    idx = 0
    for sec in pause_seconds:
        pos = text.find(PLACEHOLDER, idx)
        if pos == -1:
            break
        clean_before = text[:pos].replace(PLACEHOLDER, "")
        pauses.append(PausePoint(pos_char=len(clean_before), seconds=sec))
        idx = pos + 1

    clean = text.replace(PLACEHOLDER, "")
    clean = re.sub(r" {2,}", " ", clean).strip()

    return clean, pauses


def _split_into_slide_blocks(content: str) -> dict[int, tuple[str, str]]:
    """Return {slide_num: (title, body_text)} for all Slide XX headers found."""
    matches = list(SLIDE_HEADER.finditer(content))
    blocks: dict[int, tuple[str, str]] = {}
    for i, m in enumerate(matches):
        num = int(m.group(1))
        title = m.group(2).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        blocks[num] = (title, content[start:end])
    return blocks


def load_slides(
    script_path: Path,
    slide_range: tuple[int, int] | None = None,
) -> list[SlideScript]:
    """
    Load and parse slides from a markdown script file.

    Args:
        script_path: path to the .md script file
        slide_range: (first, last) inclusive, e.g. (1, 17). None = all slides.

    Returns:
        List of SlideScript sorted by slide number.
    """
    content = script_path.read_text(encoding="utf-8-sig")
    blocks = _split_into_slide_blocks(content)

    if slide_range:
        first, last = slide_range
        nums = [n for n in sorted(blocks) if first <= n <= last]
    else:
        nums = sorted(blocks)

    slides: list[SlideScript] = []
    for num in nums:
        title, body = blocks[num]
        raw = _extract_script_section(body)
        clean, pauses = _parse_pauses_and_clean(raw)
        slides.append(SlideScript(num=num, title=title, raw_text=raw, clean_text=clean, pauses=pauses))

    return slides


if __name__ == "__main__":
    import sys

    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
        "production/00-active/wake-cluster/02-script.md"
    )
    slides = load_slides(path, slide_range=(1, 17))
    for s in slides:
        print(f"\n=== Slide {s.num:02d} – {s.title} ===")
        print(s.clean_text[:300] + ("..." if len(s.clean_text) > 300 else ""))
        if s.pauses:
            print(f"  pauses: {[(p.pos_char, p.seconds) for p in s.pauses]}")


# ── Chunk types (used by tts_agent) ──────────────────────────────────────────

@dataclass
class Chunk:
    type: str       # 'VN_TEXT' | 'JP_BLOCK' | 'PAUSE_TAG'
    text: str
    pause_sec: float = 0.0


def chunk_slide(slide: SlideScript) -> list[Chunk]:
    """Break a slide's raw Script section into typed audio chunks."""
    chunks: list[Chunk] = []
    vn_buf: list[str] = []

    def flush_vn():
        text = "\n".join(vn_buf).strip()
        if text:
            chunks.append(Chunk(type="VN_TEXT", text=text))
        vn_buf.clear()

    for line in slide.raw_text.split("\n"):
        stripped = line.strip()

        # PAUSE_TAG — explicit [PAUSE Xs]
        pm = _PAUSE_LINE.match(stripped)
        if pm:
            flush_vn()
            chunks.append(Chunk(type="PAUSE_TAG", text="", pause_sec=float(pm.group(1))))
            continue

        # PAUSE_TAG — named markers [TTS_PAUSE_SHORT/MED/LONG] [TTS_REVEAL]
        npm = _NAMED_PAUSE_LINE.match(stripped)
        if npm:
            flush_vn()
            chunks.append(Chunk(type="PAUSE_TAG", text="", pause_sec=_NAMED_PAUSE_MS[npm.group(1).upper()]))
            continue

        # JP_BLOCK: blockquote line containing Japanese characters
        bm = _BLOCKQUOTE.match(stripped)
        if bm and _JP_CHARS.search(bm.group(1)):
            flush_vn()
            chunks.append(Chunk(type="JP_BLOCK", text=bm.group(1).strip()))
            continue

        # Everything else → VN_TEXT buffer
        vn_buf.append(line)

    flush_vn()

    # Merge consecutive VN_TEXT chunks
    merged: list[Chunk] = []
    for c in chunks:
        if merged and merged[-1].type == "VN_TEXT" and c.type == "VN_TEXT":
            merged[-1] = Chunk(type="VN_TEXT", text=merged[-1].text + "\n\n" + c.text)
        else:
            merged.append(c)
    return merged
