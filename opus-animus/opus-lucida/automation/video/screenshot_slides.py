"""
screenshot_slides.py — Screenshot each slide in an HTML deck using Playwright.

Usage:
    python screenshot_slides.py <deck_html> <out_dir> [--count N]

Example:
    python screenshot_slides.py production/00-active/wake-cluster/wake-cluster-deck.html \
        production/00-active/wake-cluster/frames
"""

import argparse
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright


def screenshot_deck(html_path: Path, out_dir: Path, count: int | None = None) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1920, "height": 1080})

        url = "file:///" + str(html_path.resolve()).replace("\\", "/")
        page.goto(url)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(800)  # let fonts/images paint

        total = page.evaluate("document.querySelector('deck-stage')?.length ?? 0")
        if total == 0:
            raise RuntimeError("deck-stage not found or has 0 slides")

        n = min(count, total) if count else total
        print(f"[screenshot] {n}/{total} slides -> {out_dir}")

        paths: list[Path] = []
        for i in range(n):
            page.evaluate(f"document.querySelector('deck-stage').goTo({i})")
            page.wait_for_timeout(400)
            out = out_dir / f"slide-{i+1:02d}.png"
            page.screenshot(
                path=str(out),
                clip={"x": 0, "y": 0, "width": 1920, "height": 1080},
            )
            paths.append(out)
            print(f"  slide-{i+1:02d}.png")

        browser.close()

    return paths


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("deck_html")
    ap.add_argument("out_dir")
    ap.add_argument("--count", type=int, default=None, help="Max slides to capture")
    args = ap.parse_args()

    html = Path(args.deck_html)
    if not html.exists():
        print(f"ERROR: {html} not found", file=sys.stderr)
        sys.exit(1)

    paths = screenshot_deck(html, Path(args.out_dir), args.count)
    print(f"[screenshot] done — {len(paths)} frames saved")


if __name__ == "__main__":
    main()
