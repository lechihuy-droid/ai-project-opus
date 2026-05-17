"""
pitch_scanner.py — Scan / route a Lucida script.md for JP text in backticks.

Output modes:
  (default)  preview table: JP | Romaji | V-Romaji
  --json     JSON array for downstream processing
  --patch    substitution pairs: `JP` -> V-Romaji
  --replace  emit full script with JP backticks replaced by V-Romaji (TTS-ready)

Usage:
    python pitch_scanner.py <script_md> [--rules lucida_pitch_rules.json]
    python pitch_scanner.py <script_md> --replace > routed_script.txt
"""

import argparse
import json
import re
import sys
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import pykakasi

# Adjust import path when running from project root
sys.path.insert(0, str(Path(__file__).parent))
from pitch_engine import LucidaPitchEngine

# Match single-line backtick spans containing at least one CJK/kana character
_JP_BACKTICK = re.compile(r"`([^`\n]*[　-鿿＀-￯][^`\n]*)`")

# Detect if a string is pure Japanese (no Latin) — skip romaji-only spans
_HAS_JP = re.compile(r"[　-鿿＀-￯]")


def _jp_to_vromaji(engine: LucidaPitchEngine, kks, jp_text: str) -> tuple[str, str]:
    items = kks.convert(jp_text)
    romaji = "".join(item["hepburn"] for item in items)
    vromaji = engine.process_romaji(romaji)
    return romaji, vromaji


def route_script(text: str, engine: LucidaPitchEngine, kks) -> str:
    """Replace every `JP` backtick span in *text* with its V-Romaji equivalent.

    Non-JP backtick spans (code, romaji-only) are left untouched.
    """
    def _replace(m: re.Match) -> str:
        jp = m.group(1)
        if not _HAS_JP.search(jp):
            return m.group(0)
        _, vromaji = _jp_to_vromaji(engine, kks, jp)
        return vromaji

    return _JP_BACKTICK.sub(_replace, text)


def scan(script_path: Path, engine: LucidaPitchEngine) -> list[dict]:
    kks = pykakasi.kakasi()
    text = script_path.read_text(encoding="utf-8")
    seen: set[str] = set()
    results: list[dict] = []

    for match in _JP_BACKTICK.finditer(text):
        jp = match.group(1)
        if jp in seen or not _HAS_JP.search(jp):
            continue
        seen.add(jp)
        romaji, vromaji = _jp_to_vromaji(engine, kks, jp)
        results.append({"jp": jp, "romaji": romaji, "vromaji": vromaji})

    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script_md")
    ap.add_argument("--rules", default=str(Path(__file__).parent / "lucida_pitch_rules.json"))
    ap.add_argument("--json", dest="out_json", action="store_true")
    ap.add_argument("--patch", action="store_true", help="Output substitution pairs")
    ap.add_argument("--replace", action="store_true", help="Emit full routed script (TTS-ready)")
    args = ap.parse_args()

    engine = LucidaPitchEngine(args.rules)
    kks = pykakasi.kakasi()
    script_path = Path(args.script_md)

    if args.replace:
        text = script_path.read_text(encoding="utf-8")
        print(route_script(text, engine, kks))
        return

    results = scan(script_path, engine)

    if args.out_json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    elif args.patch:
        for r in results:
            print(f"`{r['jp']}` -> {r['vromaji']}")
    else:
        col = (40, 35, 0)
        header = f"{'JP':<{col[0]}} {'Romaji':<{col[1]}} V-Romaji"
        print(header)
        print("-" * (col[0] + col[1] + 20))
        for r in results:
            print(f"{r['jp']:<{col[0]}} {r['romaji']:<{col[1]}} {r['vromaji']}")

    print(f"\n[scanner] {len(results)} unique JP spans in {script_path.name}", file=sys.stderr)


if __name__ == "__main__":
    main()
