from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PITCH_DIR = ROOT / "automation" / "pitch"
DEFAULT_RULES = PITCH_DIR / "lucida_pitch_rules.json"
DEFAULT_PATTERNS = Path(__file__).with_name("lucida_jp_reading_patterns.json")

SLIDE_RE = re.compile(r"^# Slide (?P<num>\d{2})\b.*$", re.MULTILINE)
SCRIPT_RE = re.compile(
    r"\*\*Script:\*\*\s*(?P<script>.*?)(?=\n\*\*Speaker note:\*\*|\n\*\*Pause/Emphasis:\*\*|\Z)",
    flags=re.DOTALL,
)
JP_CHAR_RE = re.compile(r"[\u3041-\u30ff\u3400-\u9fff\uff00-\uffef]")
JP_RUN_RE = re.compile(r"[\u3041-\u30ff\u3400-\u9fff\uff00-\uffefA-Za-z0-9+ ＿_.・/]+")
BACKTICK_RE = re.compile(r"`([^`\n]*[\u3041-\u30ff\u3400-\u9fff\uff00-\uffef][^`\n]*)`")
JP_QUOTE_RE = re.compile(r"「([^」\n]+)」")
SENTENCE_MARKERS = "。？！"


LEGACY_WAKE_TERM_PRONUNCIATION_MAP = {
    "Vないわけにはいかない": "V nai quà kê ni qua i ca nai",
    "Vない + わけにはいかない": "V nai cộng quà kê ni qua i ca nai",
    "V辞書形 + わけにはいかない": "V thể từ điển cộng quà kê ni qua i ca nai",
    "普通形 + わけではない": "thể thường cộng quà kê đê qua nai",
    "普通形 + わけがない": "thể thường cộng quà kê ga nai",
    "普通形 + わけだ": "thể thường cộng quà kê đa",
    "わけにはいきません": "quà kê ni qua i ki ma sen",
    "わけにはいかない": "quà kê ni qua i ca nai",
    "わけではありません": "quà kê đê qua a ri ma sen",
    "わけじゃない": "quà kê ja nai",
    "わけではない": "quà kê đê qua nai",
    "わけがない": "quà kê ga nai",
    "わけですね": "quà kê đê su nê",
    "わけです": "quà kê đê su",
    "わけだ": "quà kê đa",
    "わけ": "quà kê",
}


@dataclass
class AuditItem:
    slide: int
    source_text: str
    category: str
    action: str
    predicted_reading: str
    needs_rule: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "slide": self.slide,
            "source_text": self.source_text,
            "category": self.category,
            "action": self.action,
            "predicted_reading": self.predicted_reading,
            "needs_rule": self.needs_rule,
        }


class JsonRuleAdapter:
    def __init__(self, *, rules_path: Path = DEFAULT_RULES, patterns_path: Path = DEFAULT_PATTERNS):
        self.patterns_path = patterns_path
        self.patterns = json.loads(patterns_path.read_text(encoding="utf-8"))
        self.grammar_targets = sorted(self.patterns["grammar_targets"], key=len, reverse=True)
        self.reading_overrides = dict(self.patterns.get("reading_overrides", {}))
        self.metalanguage = dict(self.patterns["grammar_metalanguage_gloss"])
        self.vocab = dict(self.patterns["example_vocab_gloss"])

        try:
            import pykakasi
        except ModuleNotFoundError as exc:
            raise SystemExit(
                "Missing dependency: pykakasi is required for --pronunciation-profile json_rules. "
                "Install project requirements or run with the VieNeu-TTS venv that has pykakasi."
            ) from exc

        sys.path.insert(0, str(PITCH_DIR))
        try:
            from pitch_engine import LucidaPitchEngine
        except ModuleNotFoundError as exc:
            raise SystemExit(f"Cannot import LucidaPitchEngine from {PITCH_DIR}") from exc

        self.engine = LucidaPitchEngine(str(rules_path))
        self.kks = pykakasi.kakasi()

    def contains_japanese(self, text: str) -> bool:
        return bool(JP_CHAR_RE.search(text))

    def to_vromaji(self, text: str) -> str:
        romaji = "".join(item["hepburn"] for item in self.kks.convert(text))
        return self.engine.process_romaji(romaji)

    def classify_span(self, span: str, *, quoted: bool = False, backtick: bool = False) -> AuditItem:
        text = span.strip()
        category = "unknown_jp_short"
        action = "needs_review"
        predicted = ""
        needs_rule: str | None = "needs_classification"

        if not text or not self.contains_japanese(text):
            category = "ignore_metadata"
            action = "ignore"
            needs_rule = None
        elif quoted or any(mark in text for mark in SENTENCE_MARKERS):
            category = "full_sentence"
            action = "voice_ja"
            predicted = text
            needs_rule = None
        elif "＿＿" in text or "___" in text:
            category = "quiz_blank"
            action = "voice_ja"
            predicted = text
            needs_rule = None
        elif self._contains_metalanguage(text):
            category = "grammar_metalanguage"
            action = "vi_gloss_plus_json_rule"
            predicted = self.replace_short_jp(text)
            needs_rule = None if predicted != text else "needs_vi_gloss"
        elif text in self.vocab:
            category = "example_vocab"
            action = "vi_gloss"
            predicted = self.vocab[text]
            needs_rule = None
        elif self._looks_like_full_sentence(text):
            category = "full_sentence"
            action = "voice_ja"
            predicted = text
            needs_rule = None
        elif self._contains_grammar_target(text):
            category = "grammar_target"
            action = "json_rule"
            predicted = self.replace_short_jp(text)
            needs_rule = None if predicted != text else "needs_json_rule"

        return AuditItem(
            slide=0,
            source_text=text,
            category=category,
            action=action,
            predicted_reading=predicted,
            needs_rule=needs_rule,
        )

    def replace_short_jp(self, text: str) -> str:
        if text in self.reading_overrides:
            return self.reading_overrides[text]

        out = text
        for source, replacement in sorted(self.metalanguage.items(), key=lambda item: len(item[0]), reverse=True):
            if len(source) == 1:
                if out == source:
                    out = replacement
            else:
                out = out.replace(source, replacement)
        for source, replacement in sorted(self.vocab.items(), key=lambda item: len(item[0]), reverse=True):
            out = out.replace(source, replacement)
        for source in self.grammar_targets:
            if source in out:
                reading = self.reading_overrides.get(source) or self.to_vromaji(source)
                out = out.replace(source, f" {reading} ")
        out = out.replace("な", " na ")
        out = out.replace("+", " cộng ")
        out = re.sub(r"\s+", " ", out)
        return out.strip()

    def adapt_script_text(self, text: str) -> tuple[str, list[str]]:
        jp_tasks: list[str] = []

        def replace_quote(match: re.Match[str]) -> str:
            jp_tasks.append(match.group(1))
            return f"[VOICE_JA_{len(jp_tasks):02d}]"

        text = JP_QUOTE_RE.sub(replace_quote, text)

        def replace_backtick(match: re.Match[str]) -> str:
            content = match.group(1)
            item = self.classify_span(content, backtick=True)
            if item.category in {"full_sentence", "quiz_blank"}:
                jp_tasks.append(content)
                return f"[VOICE_JA_{len(jp_tasks):02d}]"
            return item.predicted_reading or content

        text = BACKTICK_RE.sub(replace_backtick, text)
        text = self._replace_raw_short_jp(text, jp_tasks)
        return text, jp_tasks

    def _replace_raw_short_jp(self, text: str, jp_tasks: list[str]) -> str:
        def replace_raw(match: re.Match[str]) -> str:
            content = match.group(0).strip()
            if not content or not self.contains_japanese(content):
                return match.group(0)
            item = self.classify_span(content)
            if item.category in {"full_sentence", "quiz_blank"}:
                jp_tasks.append(content)
                return f"[VOICE_JA_{len(jp_tasks):02d}]"
            if item.predicted_reading:
                return match.group(0).replace(content, item.predicted_reading)
            return match.group(0)

        return JP_RUN_RE.sub(replace_raw, text)

    def _contains_grammar_target(self, text: str) -> bool:
        return any(target in text for target in self.grammar_targets)

    def _contains_metalanguage(self, text: str) -> bool:
        return any((text == term if len(term) == 1 else term in text) for term in self.metalanguage)

    def _looks_like_full_sentence(self, text: str) -> bool:
        particles = ("は", "が", "を", "に", "で", "と", "から", "ので")
        if len(text) >= 10 and ("、" in text or "んだけど" in text):
            return True
        return len(text) >= 14 and any(p in text for p in particles)


def contains_japanese(text: str) -> bool:
    return bool(JP_CHAR_RE.search(text))


def apply_pronunciation_map(text: str, pronunciation_map: dict[str, str]) -> str:
    for source, replacement in sorted(pronunciation_map.items(), key=lambda item: len(item[0]), reverse=True):
        pattern = rf"(?<![\u3041-\u30ff\u3400-\u9fff\uff00-\uffef]){re.escape(source)}(?![\u3041-\u30ff\u3400-\u9fff\uff00-\uffef])"
        text = re.sub(pattern, replacement, text)
    return text


def clean_script(text: str) -> str:
    replacements = {
        "[TTS_PAUSE_SHORT]": "...",
        "[TTS_PAUSE_MED]": "... ...",
        "[TTS_PAUSE_LONG]": "... ... ...",
        "[TTS_REVEAL]": "",
    }
    for marker, value in replacements.items():
        text = text.replace(marker, value)

    text = text.replace("`", "")
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"^\s*[-*]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def extract_slide_scripts(markdown: str) -> list[tuple[int, str]]:
    matches = list(SLIDE_RE.finditer(markdown))
    slides: list[tuple[int, str]] = []

    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(markdown)
        script_match = SCRIPT_RE.search(markdown[start:end])
        if script_match:
            slides.append((int(match.group("num")), clean_script(script_match.group("script"))))

    return slides


def iter_script_blocks(markdown: str) -> list[tuple[int, str]]:
    blocks: list[tuple[int, str]] = []
    matches = list(SLIDE_RE.finditer(markdown))
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(markdown)
        script_match = SCRIPT_RE.search(markdown[start:end])
        if script_match:
            blocks.append((int(match.group("num")), script_match.group("script")))
    return blocks


def collect_audit_items(markdown: str, adapter: JsonRuleAdapter) -> list[AuditItem]:
    items: list[AuditItem] = []
    seen: set[tuple[int, str, str]] = set()

    for slide, script in iter_script_blocks(markdown):
        spans: list[tuple[str, bool, bool]] = []
        spans.extend((m.group(1), False, True) for m in BACKTICK_RE.finditer(script))
        spans.extend((m.group(1), True, False) for m in JP_QUOTE_RE.finditer(script))

        masked = BACKTICK_RE.sub(" ", JP_QUOTE_RE.sub(" ", script))
        for raw in JP_RUN_RE.findall(masked):
            span = raw.strip(" \t\r\n,.;:()[]{}=-")
            if adapter.contains_japanese(span):
                spans.append((span, False, False))

        for span, quoted, backtick in spans:
            item = adapter.classify_span(span, quoted=quoted, backtick=backtick)
            item.slide = slide
            key = (item.slide, item.source_text, item.category)
            if key not in seen and item.category != "ignore_metadata":
                items.append(item)
                seen.add(key)

    return items


def write_audit_reports(items: list[AuditItem], audit_dir: Path) -> None:
    audit_dir.mkdir(parents=True, exist_ok=True)
    (audit_dir / "pattern_audit.json").write_text(
        json.dumps([item.as_dict() for item in items], ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    lines = [
        "# Japanese Pattern Audit",
        "",
        "| Slide | Source | Category | Action | Predicted reading | Needs rule |",
        "|---:|---|---|---|---|---|",
    ]
    for item in items:
        source = item.source_text.replace("|", "\\|")
        predicted = item.predicted_reading.replace("|", "\\|")
        lines.append(
            f"| {item.slide:02d} | `{source}` | {item.category} | {item.action} | {predicted} | {item.needs_rule or ''} |"
        )
    (audit_dir / "pattern_audit.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def adapt_markdown_json_rules(markdown: str, adapter: JsonRuleAdapter) -> tuple[str, dict[str, list[str]]]:
    tasks_by_slide: dict[str, list[str]] = {}
    output: list[str] = []
    last_end = 0
    slide_matches = list(SLIDE_RE.finditer(markdown))

    for index, slide_match in enumerate(slide_matches):
        block_start = slide_match.end()
        block_end = slide_matches[index + 1].start() if index + 1 < len(slide_matches) else len(markdown)
        output.append(markdown[last_end:block_start])
        block = markdown[block_start:block_end]
        script_match = SCRIPT_RE.search(block)
        if not script_match:
            output.append(block)
            last_end = block_end
            continue

        adapted_script, jp_tasks = adapter.adapt_script_text(script_match.group("script"))
        slide_key = f"slide-{int(slide_match.group('num')):02d}"
        if jp_tasks:
            tasks_by_slide[slide_key] = jp_tasks
        output.append(block[: script_match.start("script")])
        output.append(adapted_script)
        output.append(block[script_match.end("script") :])
        last_end = block_end

    output.append(markdown[last_end:])
    return "".join(output), tasks_by_slide


def adapt_markdown_for_tts(markdown: str, *, profile: str, adapter: JsonRuleAdapter | None = None) -> tuple[str, dict[str, list[str]]]:
    if profile in {"wake_vi", "wake_vi_terms"}:
        return apply_pronunciation_map(markdown, LEGACY_WAKE_TERM_PRONUNCIATION_MAP), {}
    if profile == "wake_vi_all":
        raise SystemExit("wake_vi_all is legacy/debug only and is blocked for production. Use json_rules or wake_vi_terms.")
    if profile == "json_rules":
        if adapter is None:
            adapter = JsonRuleAdapter()
        return adapt_markdown_json_rules(markdown, adapter)
    return markdown, {}


def choose_voice(tts, voice_id: str | None):
    voices = tts.list_preset_voices()
    if voice_id:
        return voice_id, tts.get_preset_voice(voice_id)
    if voices:
        return voices[0][1], tts.get_preset_voice(voices[0][1])
    return "default", None


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate VieNeu-TTS audio from Lucida slide script.")
    parser.add_argument("--script", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    parser.add_argument("--mode", default="turbo")
    parser.add_argument("--voice-id")
    parser.add_argument("--ref-audio", type=Path, help="Reference audio to encode as the voice for this run.")
    parser.add_argument(
        "--pronunciation-profile",
        choices=["none", "wake_vi", "wake_vi_terms", "wake_vi_all", "json_rules"],
        default="none",
        help="json_rules uses lucida_pitch_rules.json plus classification/gloss patterns.",
    )
    parser.add_argument("--rules", type=Path, default=DEFAULT_RULES, help="Lucida pitch rules JSON.")
    parser.add_argument("--patterns", type=Path, default=DEFAULT_PATTERNS, help="JP classification/gloss JSON.")
    parser.add_argument("--audit-patterns", action="store_true", help="Audit Japanese reading patterns and write reports.")
    parser.add_argument("--audit-dir", type=Path, help="Directory for pattern_audit.json/md. Defaults to out-dir/audit.")
    parser.add_argument("--approve-unresolved-rules", action="store_true", help="Allow generation despite unresolved audit items.")
    parser.add_argument("--write-tts-script", type=Path, help="Write a pronunciation-adapted script and exit.")
    parser.add_argument("--slide", type=int, action="append", help="Only generate a specific slide number. Can repeat.")
    parser.add_argument("--text-only", action="store_true", help="Only write cleaned slide text files.")
    args = parser.parse_args()

    markdown = args.script.read_text(encoding="utf-8")
    adapter: JsonRuleAdapter | None = None
    jp_tasks_by_slide: dict[str, list[str]] = {}

    if args.pronunciation_profile == "json_rules" or args.audit_patterns:
        adapter = JsonRuleAdapter(rules_path=args.rules, patterns_path=args.patterns)
        audit_items = collect_audit_items(markdown, adapter)
        audit_dir = args.audit_dir or args.out_dir / "audit"
        write_audit_reports(audit_items, audit_dir)
        unresolved = [item for item in audit_items if item.needs_rule]
        print(f"Wrote pattern audit reports to {audit_dir}")
        if unresolved and not args.approve_unresolved_rules:
            unresolved_labels = ", ".join(f"slide-{item.slide:02d}:{item.source_text}" for item in unresolved[:8])
            raise SystemExit(f"Pattern audit has {len(unresolved)} unresolved item(s): {unresolved_labels}")
        if args.audit_patterns and args.pronunciation_profile != "json_rules" and not args.write_tts_script and args.text_only is False:
            return 0

    markdown, jp_tasks_by_slide = adapt_markdown_for_tts(markdown, profile=args.pronunciation_profile, adapter=adapter)

    if args.write_tts_script:
        args.write_tts_script.parent.mkdir(parents=True, exist_ok=True)
        args.write_tts_script.write_text(markdown, encoding="utf-8")
        if jp_tasks_by_slide:
            args.write_tts_script.with_suffix(".voice-ja.json").write_text(
                json.dumps(jp_tasks_by_slide, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
        print(f"Wrote TTS script to {args.write_tts_script}")
        return 0

    slides = extract_slide_scripts(markdown)
    if args.slide:
        wanted = set(args.slide)
        slides = [(num, text) for num, text in slides if num in wanted]

    if not slides:
        raise SystemExit("No slide scripts found.")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    text_dir = args.out_dir / "text"
    text_dir.mkdir(exist_ok=True)

    for num, text in slides:
        (text_dir / f"slide-{num:02d}.txt").write_text(text + "\n", encoding="utf-8")

    if jp_tasks_by_slide:
        (args.out_dir / "voice_ja_tasks.json").write_text(
            json.dumps(jp_tasks_by_slide, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    if args.text_only:
        print(f"Wrote {len(slides)} cleaned text files to {text_dir}")
        return 0

    from vieneu import Vieneu

    print(f"Loading VieNeu mode={args.mode}")
    tts = Vieneu(mode=args.mode)
    if args.ref_audio:
        selected_voice_id = args.ref_audio.stem
        voice_data = tts.encode_reference(str(args.ref_audio))
    else:
        selected_voice_id, voice_data = choose_voice(tts, args.voice_id)
    print(f"Using voice={selected_voice_id}")

    try:
        for num, text in slides:
            out = args.out_dir / f"slide-{num:02d}.wav"
            print(f"Generating slide-{num:02d}: {len(text)} chars")
            audio = tts.infer(text=text, voice=voice_data) if voice_data is not None else tts.infer(text=text)
            tts.save(audio, str(out))
            print(f"Saved {out}")
    finally:
        tts.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
