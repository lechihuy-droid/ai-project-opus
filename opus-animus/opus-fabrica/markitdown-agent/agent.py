"""
Markitdown Agent — file converter tool for personal-agent input pipeline.

Modes:
  standalone:  watch input/ → output/  (original behavior)
  integrated:  watch personal-agent/raw/inbox/ → route to raw/articles|papers|notes/

Usage:
  python agent.py                    # use config.yaml mode
  python agent.py --mode standalone  # force standalone
  python agent.py --mode integrated  # force integrated
"""

import sys
import time
import logging
import argparse
import shutil
from pathlib import Path

import yaml
from markitdown import MarkItDown
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

md = MarkItDown()

CONFIG_FILE = Path(__file__).parent / "config.yaml"


def load_config(mode_override: str | None = None) -> dict:
    with open(CONFIG_FILE, encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    mode = mode_override or cfg.get("mode", "standalone")
    return {**cfg[mode], "mode": mode}


def route_output_dir(src: Path, routing: dict, output_base: Path) -> Path:
    ext = src.suffix.lower()
    for category, extensions in routing.items():
        if ext in extensions:
            d = output_base / category
            d.mkdir(parents=True, exist_ok=True)
            return d
    d = output_base / "articles"
    d.mkdir(parents=True, exist_ok=True)
    return d


def resolve_output_path(dest_dir: Path, stem: str) -> Path:
    dest = dest_dir / (stem + ".md")
    counter = 2
    while dest.exists():
        dest = dest_dir / f"{stem}_{counter}.md"
        counter += 1
    return dest


def convert(src: Path, cfg: dict):
    SUPPORTED_EXT = {
        ".pdf", ".docx", ".doc", ".pptx", ".ppt",
        ".xlsx", ".xls", ".csv",
        ".html", ".htm", ".txt", ".rtf", ".xml", ".json",
        ".png", ".jpg", ".jpeg", ".gif", ".webp",
        ".mp3", ".wav", ".m4a",
        ".zip",
    }

    if src.suffix.lower() not in SUPPORTED_EXT:
        log.warning("Skipped (unsupported): %s", src.name)
        return

    if cfg["mode"] == "integrated":
        output_base = Path(cfg["output_base"]).resolve()
        dest_dir = route_output_dir(src, cfg.get("routing", {}), output_base)
    else:
        dest_dir = Path(cfg["output_dir"]).resolve()
        dest_dir.mkdir(parents=True, exist_ok=True)

    dest = resolve_output_path(dest_dir, src.stem)

    try:
        result = md.convert(str(src))
        dest.write_text(result.text_content, encoding="utf-8")
        log.info("OK  %s  →  %s/%s", src.name, dest_dir.name, dest.name)
    except Exception as e:
        log.error("FAIL %s: %s", src.name, e)
        return

    if cfg["mode"] == "integrated":
        processed_dir = Path(cfg.get("processed_dir", str(Path(cfg["watched_dir"]) / "processed"))).resolve()
        processed_dir.mkdir(parents=True, exist_ok=True)
        dest_moved = processed_dir / src.name
        counter = 2
        while dest_moved.exists():
            dest_moved = processed_dir / f"{src.stem}_{counter}{src.suffix}"
            counter += 1
        shutil.move(str(src), str(dest_moved))
        log.info("Moved  %s  →  processed/", src.name)


class Handler(FileSystemEventHandler):
    def __init__(self, cfg: dict):
        self.cfg = cfg

    def on_created(self, event):
        if event.is_directory:
            return
        path = Path(event.src_path)
        if path.parent.name == "processed":
            return
        time.sleep(0.5)
        convert(path, self.cfg)

    def on_moved(self, event):
        if event.is_directory:
            return
        path = Path(event.dest_path)
        if path.parent.name == "processed":
            return
        convert(path, self.cfg)


def main():
    parser = argparse.ArgumentParser(description="Markitdown Agent")
    parser.add_argument("--mode", choices=["standalone", "integrated"], help="Override config mode")
    args = parser.parse_args()

    cfg = load_config(args.mode)
    watched = Path(cfg["watched_dir"]).resolve()
    watched.mkdir(parents=True, exist_ok=True)

    observer = Observer()
    observer.schedule(Handler(cfg), str(watched), recursive=False)
    observer.start()

    log.info("Mode:     %s", cfg["mode"])
    log.info("Watching: %s", watched)
    if cfg["mode"] == "integrated":
        log.info("Routing → %s", Path(cfg["output_base"]).resolve())
    else:
        log.info("Output  → %s", Path(cfg["output_dir"]).resolve())
    log.info("Press Ctrl+C to stop.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
