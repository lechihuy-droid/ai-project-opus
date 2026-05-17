"""
tts_agent.py — Code-switching TTS pipeline (Vietnamese + Japanese).

Chunk routing:
  VN_TEXT  → edge-tts vi-VN-HoaiMyNeural (-10% rate)
  JP_BLOCK → Voicevox localhost:50021, Shikoku Metan (speaker=2)
  JP_INLINE backticks in VN_TEXT → pykakasi romaji → Viet-style → edge-tts
  PAUSE_TAG → pydub silence (exact ms)

Between VI↔JP transitions: 600ms breath pause injected automatically.
Voicevox fallback: if not running, JP_BLOCK → pykakasi romaji → edge-tts.

Requires:
  pip install edge-tts pykakasi pydub aiohttp imageio-ffmpeg
  Voicevox app running at http://localhost:50021

Usage:
  python tts_agent.py <script_md> <out_dir> [--slides 1-17]
"""

import argparse
import asyncio
import io
import re
import subprocess
import sys
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import aiohttp
import edge_tts
import imageio_ffmpeg
import pykakasi
from pydub import AudioSegment

from parse_script import Chunk, SlideScript, chunk_slide, load_slides

# ── Pitch engine (automation/pitch/) ─────────────────────────────────────────
_PITCH_DIR = Path(__file__).parent.parent / "pitch"
sys.path.insert(0, str(_PITCH_DIR))
from pitch_engine import LucidaPitchEngine          # noqa: E402
from tts_pipeline import route_text as _route_text  # noqa: E402

_pitch_engine: LucidaPitchEngine | None = None

def _get_engine() -> LucidaPitchEngine:
    global _pitch_engine
    if _pitch_engine is None:
        _pitch_engine = LucidaPitchEngine(str(_PITCH_DIR / "lucida_pitch_rules.json"))
    return _pitch_engine

# ── Config ────────────────────────────────────────────────────────────────────

VI_VOICE         = "vi-VN-HoaiMyNeural"
VI_RATE          = "+20%"
VOICEVOX_URL     = "http://localhost:50021"
VOICEVOX_SPEAKER = 16         # 九州そら, style: Normal
BREATH_MS        = 420        # pause between VI↔JP transitions
NORM_TARGET_DBFS = -18.0      # output volume normalization

_ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
AudioSegment.converter = _ffmpeg
AudioSegment.ffmpeg    = _ffmpeg


def _mp3_bytes_to_segment(mp3_bytes: bytes) -> AudioSegment:
    """Convert MP3 bytes → AudioSegment via ffmpeg pipe (no ffprobe needed)."""
    cmd = [_ffmpeg, "-y", "-i", "pipe:0", "-f", "wav", "-ar", "24000", "-ac", "1", "pipe:1"]
    r = subprocess.run(cmd, input=mp3_bytes, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg pipe failed: {r.stderr.decode()[:200]}")
    return AudioSegment.from_wav(io.BytesIO(r.stdout))

# ── Japanese → Viet-style romaji ─────────────────────────────────────────────

_kks = pykakasi.kakasi()

# Longer patterns first to avoid partial replacements
_VIET_MAP = [
    ("shi", "xi"),  ("sha", "xa"),  ("sho", "xô"), ("shu", "xu"),
    ("chi", "chi"), ("cha", "cha"), ("cho", "chô"), ("chu", "chu"),
    ("tsu", "chư"),
    ("tchi", "chi"),
    ("ji", "di"),   ("ja", "gia"), ("ju", "du"),   ("jo", "dô"),
    ("wa", "oa"),   ("wi", "uy"),  ("wo", "o"),
    ("ya", "ia"),   ("yu", "du"),  ("yo", "iô"),
    ("fu", "phu"),
    ("zu", "du"),   ("ze", "dê"),  ("za", "da"),   ("zo", "dô"),
    ("ke", "kê"),   ("ki", "ki"),  ("ko", "kô"),   ("ku", "ku"),  ("ka", "ka"),
    ("ge", "ghê"),  ("gi", "ghi"), ("go", "gô"),   ("gu", "gu"),  ("ga", "ga"),
    ("me", "mê"),   ("mi", "mi"),  ("mo", "mô"),   ("mu", "mu"),  ("ma", "ma"),
    ("ne", "nê"),   ("ni", "ni"),  ("no", "nô"),   ("nu", "nu"),  ("na", "na"),
    ("re", "rê"),   ("ri", "ri"),  ("ro", "rô"),   ("ru", "ru"),  ("ra", "ra"),
    ("se", "xê"),   ("so", "xô"),  ("su", "xu"),   ("sa", "xa"),
    ("te", "tê"),   ("to", "tô"),  ("ta", "ta"),
    ("de", "đê"),   ("do", "đô"),  ("da", "đa"),
    ("he", "hê"),   ("hi", "hi"),  ("ho", "hô"),   ("ha", "ha"),
    ("pe", "pê"),   ("pi", "pi"),  ("po", "pô"),   ("pu", "pu"),  ("pa", "pa"),
    ("be", "bê"),   ("bi", "bi"),  ("bo", "bô"),   ("bu", "bu"),  ("ba", "ba"),
]

_JP_INLINE_RE   = re.compile(r"`([^`]*[぀-ヿ一-鿿][^`]*)`")
_JP_SENT_RE     = re.compile(r"`([^`]*[。？！][^`]*)`")   # full sentence in backtick → Voicevox
_ROMAJI_BT_RE   = re.compile(r"`([a-z]+)`")               # pure ASCII backtick → Viet phoneme map


def jp_to_viet_romaji(jp_text: str) -> str:
    result = _kks.convert(jp_text)
    romaji = "".join(item["hepburn"] for item in result)
    for hepburn, viet in _VIET_MAP:
        romaji = romaji.replace(hepburn, viet)
    return romaji


def _clean_vn(text: str) -> str:
    """Normalize VI text for TTS: single \\n → space, collapse spaces."""
    text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)   # single newline → space
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def _apply_viet_map(romaji: str) -> str:
    for hepburn, viet in _VIET_MAP:
        romaji = romaji.replace(hepburn, viet)
    return romaji


def substitute_jp_inline(text: str) -> str:
    """Replace backtick JP/romaji terms with Viet-style phonetics."""
    # 1. JP chars in backtick → pykakasi → viet map
    def replace_jp(m: re.Match) -> str:
        jp = m.group(1)
        if re.search(r"[。？！]", jp):
            return m.group(0)           # sentence → handled by _JP_SENT_RE
        return jp_to_viet_romaji(jp)
    text = _JP_INLINE_RE.sub(replace_jp, text)

    # 2. Pure ASCII romaji in backtick (e.g. `wake`, `nomikai`) → viet map
    text = _ROMAJI_BT_RE.sub(lambda m: _apply_viet_map(m.group(1)), text)

    return text


# ── Audio generation ──────────────────────────────────────────────────────────

async def _edge_segment(text: str, *_) -> AudioSegment:
    """Stream edge-tts → MP3 bytes → AudioSegment (no temp file, no ffprobe)."""
    mp3_bytes = b""
    tts = edge_tts.Communicate(text.strip(), VI_VOICE, rate=VI_RATE)
    async for chunk in tts.stream():
        if chunk["type"] == "audio":
            mp3_bytes += chunk["data"]
    return _mp3_bytes_to_segment(mp3_bytes)


async def _voicevox_segment(text: str, session: aiohttp.ClientSession) -> AudioSegment:
    async with session.post(
        f"{VOICEVOX_URL}/audio_query",
        params={"text": text, "speaker": VOICEVOX_SPEAKER},
    ) as r:
        r.raise_for_status()
        query = await r.json()

    async with session.post(
        f"{VOICEVOX_URL}/synthesis",
        params={"speaker": VOICEVOX_SPEAKER},
        json=query,
    ) as r:
        r.raise_for_status()
        wav_bytes = await r.read()

    return AudioSegment.from_wav(io.BytesIO(wav_bytes))


_SILENCE_RE = re.compile(r"\[SILENCE_(\d+)\]")


async def _process_vn(raw: str, session: aiohttp.ClientSession) -> AudioSegment:
    """
    Process a VN_TEXT chunk via language router:
      `...` backtick JP  → pitch_engine → V-Romaji → edge-tts VI
      「...」 full JP      → Voicevox (or edge-tts JP fallback)
      plain VI text      → edge-tts VI
    """
    combined = AudioSegment.empty()
    PARA_PAUSE = 280

    vi_text, jp_tasks = _route_text(raw, _get_engine(), _kks)

    # Split vi_text on [SILENCE_N] markers left by jp_tasks
    segments = _SILENCE_RE.split(vi_text)
    # segments = [vi_part, "1", vi_part, "2", ...]

    i = 0
    while i < len(segments):
        vi_part = segments[i]
        paragraphs = [p for p in re.split(r"\n{2,}", vi_part) if p.strip()]
        for j, para in enumerate(paragraphs):
            cleaned = _clean_vn(para)
            if cleaned:
                print(f"\n  [VI] {cleaned[:100]!r}")
                combined += await _edge_segment(cleaned)
                if j < len(paragraphs) - 1:
                    combined += AudioSegment.silent(duration=PARA_PAUSE)

        i += 1
        if i < len(segments):
            task_idx = int(segments[i]) - 1
            if task_idx < len(jp_tasks):
                jp_text = jp_tasks[task_idx]
                combined += AudioSegment.silent(duration=BREATH_MS)
                try:
                    print(f"\n  [JP-sent] {jp_text!r}")
                    combined += await _voicevox_segment(jp_text, session)
                except Exception:
                    romaji = jp_to_viet_romaji(jp_text)
                    print(f"\n  [JP-sent->romaji] {romaji!r}")
                    combined += await _edge_segment(romaji)
                combined += AudioSegment.silent(duration=BREATH_MS)
            i += 1

    return combined


async def _build_slide_async(slide: SlideScript) -> AudioSegment:
    chunks = chunk_slide(slide)
    combined = AudioSegment.empty()
    prev_type: str | None = None

    async with aiohttp.ClientSession() as session:
        for chunk in chunks:
            # Inject breath pause on VI↔JP boundary
            if (prev_type and chunk.type != "PAUSE_TAG"
                    and {prev_type, chunk.type} == {"VN_TEXT", "JP_BLOCK"}):
                combined += AudioSegment.silent(duration=BREATH_MS)

            if chunk.type == "PAUSE_TAG":
                print(f"\n  [PAUSE {chunk.pause_sec}s]")
                combined += AudioSegment.silent(duration=int(chunk.pause_sec * 1000))

            elif chunk.type == "VN_TEXT":
                combined += await _process_vn(chunk.text, session)

            elif chunk.type == "JP_BLOCK":
                try:
                    print(f"\n  [JP] {chunk.text!r}")
                    combined += await _voicevox_segment(chunk.text, session)
                except Exception as e:
                    romaji = jp_to_viet_romaji(chunk.text)
                    print(f"\n  [JP→romaji] {romaji!r}")
                    combined += await _edge_segment(romaji)

            prev_type = chunk.type if chunk.type != "PAUSE_TAG" else prev_type

    return combined.normalize(headroom=abs(NORM_TARGET_DBFS))


# ── Public API (called by pipeline.py) ───────────────────────────────────────

def build_slide_audio(slide: SlideScript, out: Path, **_) -> None:
    combined = asyncio.run(_build_slide_async(slide))
    combined.export(str(out), format="mp3")


# ── CLI ───────────────────────────────────────────────────────────────────────

def _parse_range(s: str) -> tuple[int, int]:
    if "-" in s:
        a, b = s.split("-", 1)
        return int(a), int(b)
    n = int(s)
    return n, n


def run(script_path: Path, out_dir: Path, slide_range: tuple[int, int], lang: str = "vi") -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    slides = load_slides(script_path, slide_range=slide_range)
    print(f"[tts] {len(slides)} slides -> {out_dir}  VI=EdgeTTS  JP=Voicevox(Metan)")

    paths: list[Path] = []
    for slide in slides:
        out = out_dir / f"slide-{slide.num:02d}.mp3"
        print(f"  slide-{slide.num:02d}...", end=" ", flush=True)
        build_slide_audio(slide, out)
        size_kb = out.stat().st_size // 1024
        print(f"{size_kb}KB")
        paths.append(out)

    return paths


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script_md")
    ap.add_argument("out_dir")
    ap.add_argument("--slides", default="1-17")
    ap.add_argument("--lang", default="vi")
    args = ap.parse_args()

    paths = run(Path(args.script_md), Path(args.out_dir), _parse_range(args.slides), args.lang)
    print(f"[tts] done -- {len(paths)} audio files")


if __name__ == "__main__":
    main()
