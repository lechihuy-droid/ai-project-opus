"""
pipeline.py — End-to-end video pipeline for Lucida HTML decks.

Steps:
  0. deck_generator     → <topic>-deck.html   (--generate to enable)
  1. screenshot_slides  → frames/slide-XX.png
  2. tts_agent          → audio/slide-XX.mp3
  3. assembly_agent     → video/raw-<topic>.mp4

Usage:
    python pipeline.py <topic>
    python pipeline.py <topic> --generate          # also regenerate HTML deck
    python pipeline.py <topic> --skip-screenshot   # reuse existing frames
    python pipeline.py <topic> --skip-tts          # reuse existing audio
    python pipeline.py <topic> --skip-rvc          # skip voice conversion

Topic config maps topic name -> deck HTML + script md + slide range.
Add new topics to TOPICS dict.
"""

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

BASE = Path(__file__).resolve().parents[2] / "production" / "00-active"


@dataclass
class TopicConfig:
    deck_html: Path
    script_md: Path
    slide_range: tuple[int, int]
    slide_deck_md: Path | None = None   # 03-slide-deck.md for --generate
    topic_label: str = "JLPT N2"
    lang: str = "vi"


TOPICS: dict[str, TopicConfig] = {
    "wake-cluster": TopicConfig(
        deck_html=BASE / "wake-cluster" / "wake-cluster-deck.html",
        script_md=BASE / "wake-cluster" / "02-script.md",
        slide_range=(1, 17),
        slide_deck_md=BASE / "wake-cluster" / "03-slide-deck.md",
        topic_label="JLPT N2 · 4 mau wake",
        lang="vi",
    ),
}


def run_pipeline(
    topic: str,
    generate: bool = False,
    skip_screenshot: bool = False,
    skip_tts: bool = False,
    skip_rvc: bool = False,
) -> None:
    if topic not in TOPICS:
        print(f"ERROR: unknown topic '{topic}'. Available: {list(TOPICS)}", file=sys.stderr)
        sys.exit(1)

    cfg = TOPICS[topic]
    work_dir = cfg.deck_html.parent

    frames_dir = work_dir / "frames"
    audio_dir  = work_dir / "audio"
    rvc_dir    = work_dir / "audio-rvc"
    video_dir  = work_dir / "video"
    output_mp4 = video_dir / f"raw-{topic}.mp4"

    print(f"\n{'='*60}")
    print(f" Lucida Video Pipeline — {topic}")
    print(f"{'='*60}")

    # Step 0 — Generate HTML deck
    if generate:
        if cfg.slide_deck_md is None:
            print("[step 0] WARNING: no slide_deck_md configured for this topic — skipping generate")
        else:
            print(f"\n[step 0] Generate deck  {cfg.slide_deck_md.name} -> {cfg.deck_html.name}")
            from deck_generator import parse_slide_deck, generate_html
            md = cfg.slide_deck_md.read_text(encoding="utf-8")
            slides = parse_slide_deck(md)
            html = generate_html(slides, cfg.topic_label)
            cfg.deck_html.write_text(html, encoding="utf-8")
            print(f"         {len(slides)} slides written")
    else:
        print("\n[step 0] skipping deck generate (pass --generate to rebuild HTML)")

    # Step 1 — Screenshots
    if skip_screenshot:
        print("\n[step 1] skipping screenshots (--skip-screenshot)")
    else:
        print(f"\n[step 1] Screenshots  {cfg.deck_html.name}")
        from screenshot_slides import screenshot_deck
        screenshot_deck(cfg.deck_html, frames_dir)

    # Step 2 — TTS audio
    if skip_tts:
        print("\n[step 2] skipping TTS (--skip-tts)")
    else:
        print(f"\n[step 2] TTS audio  slides {cfg.slide_range[0]}-{cfg.slide_range[1]}  lang={cfg.lang}")
        from tts_agent import run as tts_run
        tts_run(cfg.script_md, audio_dir, cfg.slide_range, cfg.lang)

    # Step 2.5 — RVC voice conversion
    assembly_audio_dir = audio_dir   # default: use raw TTS audio
    if skip_rvc:
        print("\n[step 2.5] skipping RVC (--skip-rvc)")
    else:
        import os
        from dotenv import load_dotenv
        load_dotenv(Path(__file__).resolve().parents[2] / ".env")
        if not os.getenv("GRADIO_API_URL", "").strip():
            print("\n[step 2.5] skipping RVC — GRADIO_API_URL not set in .env")
        else:
            print(f"\n[step 2.5] RVC conversion -> {rvc_dir.name}/")
            from rvc_agent import convert_dir
            convert_dir(audio_dir, rvc_dir)
            assembly_audio_dir = rvc_dir

    # Step 3 — Assembly
    print(f"\n[step 3] Assembly -> {output_mp4.name}")
    from assembly_agent import assemble
    assemble(frames_dir, assembly_audio_dir, output_mp4)

    print(f"\n{'='*60}")
    print(f" Done: {output_mp4}")
    print(f"{'='*60}\n")


def main():
    ap = argparse.ArgumentParser(description="Lucida video pipeline")
    ap.add_argument("topic", help="Topic name, e.g. wake-cluster")
    ap.add_argument("--generate", action="store_true", help="Regenerate HTML deck from 03-slide-deck.md")
    ap.add_argument("--skip-screenshot", action="store_true", help="Reuse existing frames/")
    ap.add_argument("--skip-tts", action="store_true", help="Reuse existing audio/")
    ap.add_argument("--skip-rvc", action="store_true", help="Skip RVC, use raw TTS audio for assembly")
    args = ap.parse_args()

    run_pipeline(args.topic, generate=args.generate, skip_screenshot=args.skip_screenshot, skip_tts=args.skip_tts, skip_rvc=args.skip_rvc)


if __name__ == "__main__":
    main()
