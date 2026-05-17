"""
tts_pipeline.py — Language Router for Lucida script slides.

Splits slide text into two streams:

  [JP_INLINE]  backtick `...`  → pitch_engine → V-Romaji → merged into VI text
  [JP_FULL]    「...」           → collected as japanese_audio_tasks (Azure JP queue)
  [VI]         everything else → passed through unchanged

Public API:
    engine, kks = load_engine()
    vi_text, jp_tasks = route_text(raw_text, engine, kks)

CLI preview (dry-run on any text block):
    python tts_pipeline.py <script_md> [--rules lucida_pitch_rules.json]
"""

import json
import re
import sys
from pathlib import Path

import pykakasi

sys.path.insert(0, str(Path(__file__).parent))
from pitch_engine import LucidaPitchEngine

_HAS_JP = re.compile(r"[　-鿿＀-￯]")

# Combined router: group 1 = single-line backtick with JP, group 2 = 「」
_ROUTER = re.compile(r"`([^`\n]*[　-鿿＀-￯][^`\n]*)`|「([^」\n]+)」")


def load_engine(rules_path: str | None = None) -> tuple[LucidaPitchEngine, object]:
    if rules_path is None:
        rules_path = str(Path(__file__).parent / "lucida_pitch_rules.json")
    return LucidaPitchEngine(rules_path), pykakasi.kakasi()


def _to_vromaji(engine: LucidaPitchEngine, kks, content: str) -> str:
    """Backtick content (romaji or kana) → V-Romaji string."""
    if _HAS_JP.search(content):
        romaji = "".join(item["hepburn"] for item in kks.convert(content))
    else:
        romaji = content  # user pre-converted kanji → romaji in backtick
    return engine.process_romaji(romaji)


def route_text(text: str, engine: LucidaPitchEngine, kks) -> tuple[str, list[str]]:
    """Route one slide's text through the language router.

    Returns:
        vi_text   — VI-clean text: inline JP replaced by V-Romaji,
                    full-sentence JP removed (replaced by silence marker)
        jp_tasks  — ordered list of raw JP sentences from 「」 for Azure JP TTS
    """
    vi_parts: list[str] = []
    jp_tasks: list[str] = []
    last_end = 0

    for m in _ROUTER.finditer(text):
        # carry plain VI text before this match
        if m.start() > last_end:
            vi_parts.append(text[last_end : m.start()])

        inline, full = m.group(1), m.group(2)

        if inline is not None:
            # Group 1 — backtick: route through pitch engine
            vi_parts.append(_to_vromaji(engine, kks, inline))
        else:
            # Group 2 — 「」: queue for JP TTS, insert silence placeholder
            jp_tasks.append(full)
            vi_parts.append(f"[SILENCE_{len(jp_tasks)}]")

        last_end = m.end()

    if last_end < len(text):
        vi_parts.append(text[last_end:])

    return "".join(vi_parts), jp_tasks


# ── CLI preview ───────────────────────────────────────────────────────────────

def _preview_script(script_path: Path, engine: LucidaPitchEngine, kks) -> None:
    text = script_path.read_text(encoding="utf-8")
    vi_text, jp_tasks = route_text(text, engine, kks)

    print("=== VI stream (Azure VN) ===")
    print(vi_text[:2000], "..." if len(vi_text) > 2000 else "")
    print()
    if jp_tasks:
        print(f"=== JP tasks ({len(jp_tasks)}) → Azure JP TTS ===")
        for i, t in enumerate(jp_tasks, 1):
            print(f"  [{i}] {t}")
    else:
        print("(no 「」 sentences found)")


def main() -> None:
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("script_md")
    ap.add_argument("--rules", default=None)
    ap.add_argument("--json", dest="out_json", action="store_true",
                    help="Dump jp_tasks as JSON to stdout")
    args = ap.parse_args()

    engine, kks = load_engine(args.rules)
    script_path = Path(args.script_md)
    text = script_path.read_text(encoding="utf-8")
    vi_text, jp_tasks = route_text(text, engine, kks)

    if args.out_json:
        print(json.dumps(jp_tasks, ensure_ascii=False, indent=2))
    else:
        _preview_script(script_path, engine, kks)


if __name__ == "__main__":
    main()
