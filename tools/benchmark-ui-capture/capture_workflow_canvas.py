"""Benchmark-only capture harness for target workflow-canvas-v1.

Reproduces the canonical UI state described in
docs/benchmarks/design-skills/workflow-canvas-v1.manifest.json against a
running harness/hub/web-v3 instance and captures a 1440x900 screenshot.

Isolated tool: uses the already-installed Python `playwright` package and
the system Edge executable. Does not touch harness/hub/web-v3/package.json
or its lockfile, and is not part of the application's dependency graph.

Usage:
    # Canonical baseline (only path allowed to update the frozen manifest):
    BENCHMARK_HUB_TOKEN=<token> python tools/benchmark-ui-capture/capture_workflow_canvas.py --baseline --update-manifest

    # Candidate capture (never touches the baseline PNG or the manifest):
    BENCHMARK_HUB_TOKEN=<token> python tools/benchmark-ui-capture/capture_workflow_canvas.py --output docs/benchmarks/design-skills/screenshots/workflow-canvas-v1-hallmark.png

Exactly one of --output/--baseline is required; there is no default output path,
so a bare invocation can never silently overwrite the canonical baseline.

Prerequisites (started externally, NOT by this script):
    Backend:  python harness/hub/server.py           (with HUB_TOKEN=<token> in its env)
    Frontend: pnpm dev                                (from harness/hub/web-v3)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_JSON = REPO_ROOT / "docs" / "benchmarks" / "design-skills" / "workflow-canvas-v1.manifest.json"
MANIFEST_MD = REPO_ROOT / "docs" / "benchmarks" / "design-skills" / "workflow-canvas-v1.manifest.md"
SCREENSHOT_DIR = REPO_ROOT / "docs" / "benchmarks" / "design-skills" / "screenshots"
SCREENSHOT_PATH = SCREENSHOT_DIR / "workflow-canvas-v1-baseline.png"

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
FRONTEND_ORIGIN = "http://127.0.0.1:5173"


class CaptureFailure(RuntimeError):
    """Raised for any condition that must abort before a screenshot is taken."""


def load_manifest() -> dict:
    with MANIFEST_JSON.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def require_token() -> str:
    token = os.environ.get("BENCHMARK_HUB_TOKEN")
    if not token:
        raise CaptureFailure(
            "BENCHMARK_HUB_TOKEN is not set. Export it before running this script; "
            "the value must match the HUB_TOKEN the backend was started with. "
            "The token is never printed by this script."
        )
    return token


def require_frontend_reachable() -> None:
    try:
        urllib.request.urlopen(FRONTEND_ORIGIN, timeout=5)
    except (urllib.error.URLError, OSError) as error:
        raise CaptureFailure(
            f"{FRONTEND_ORIGIN} is not reachable ({error}).\n"
            "Start both services first, from the repository root / harness/hub/web-v3:\n"
            "  Backend:  python harness/hub/server.py   (HUB_TOKEN=<token> set in its env)\n"
            "  Frontend: pnpm dev\n"
            "This script does not start servers on its own."
        ) from error


def redacted(url: str, token: str) -> str:
    return url.replace(token, "<redacted>")


def run_capture(manifest: dict, token: str, output_path: Path) -> None:
    from playwright.sync_api import sync_playwright

    state = manifest["state"]
    fixture = manifest["fixture"]
    viewport = manifest["viewport"]
    workflow_id = fixture["id"]
    node_id = state["selected_node"]
    expected_node_count = fixture["node_count"]

    # Real query string (before the hash) is what src/lib/api.ts reads via
    # `new URL(...).searchParams` — a `k=` placed after the `#` fragment
    # would NOT be captured by that code, so the token must precede `#`.
    bootstrap_url = f"{FRONTEND_ORIGIN}/?k={token}#/workflows"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=EDGE_PATH)
        try:
            context = browser.new_context(viewport={"width": viewport["width"], "height": viewport["height"]})
            page = context.new_page()

            print(f"Navigating to {redacted(bootstrap_url, token)}")
            page.goto(bootstrap_url, wait_until="domcontentloaded")

            # 1. Workflow API completion: sidebar rows only render once /api/workflows resolves.
            try:
                page.wait_for_selector('[data-region-name="workflow sidebar"] button', timeout=15000)
            except Exception as error:
                raise CaptureFailure(
                    "Sidebar workflow list never rendered. Likely causes: wrong/expired "
                    "BENCHMARK_HUB_TOKEN (backend returns 403 to every /api/* call), or the "
                    "backend is not reachable through the Vite proxy."
                ) from error

            if "#/workflows" not in page.url:
                raise CaptureFailure(f"Unexpected route after load: {page.url}")

            # 2. Explicitly select the canonical workflow (never rely on rows[0]/API order).
            sidebar_item = page.locator('[data-region-name="workflow sidebar"] button', has_text=workflow_id).first
            if sidebar_item.count() == 0:
                raise CaptureFailure(f"Workflow '{workflow_id}' not found in sidebar list.")
            sidebar_item.click()

            # 3. Wait for the *persisted* layout (not the fallback grid formula) to apply,
            #    by polling the canonical node's inline `left` style against the known
            #    layout.json coordinate for that node.
            layout_path = REPO_ROOT / fixture["layout"].replace("/", os.sep)
            with layout_path.open("r", encoding="utf-8") as handle:
                layout_json = json.load(handle)
            node_pos = layout_json.get("nodes", {}).get(node_id)
            if not node_pos:
                raise CaptureFailure(f"Node '{node_id}' has no entry in {layout_path.name}.")
            expected_left = f"{node_pos['x']}px"
            expected_top = f"{node_pos['y']}px"

            node_selector = f'[data-node-id="{node_id}"]'
            try:
                page.wait_for_function(
                    """([selector, left, top]) => {
                        const el = document.querySelector(selector);
                        return !!el && el.style.left === left && el.style.top === top;
                    }""",
                    arg=[node_selector, expected_left, expected_top],
                    timeout=10000,
                )
            except Exception as error:
                raise CaptureFailure(
                    f"Node '{node_id}' never reached its persisted layout position "
                    f"({expected_left}, {expected_top}). It may still be at the client-side "
                    "fallback grid position, indicating the layout fetch failed or the "
                    "workflow selection did not take effect."
                ) from error

            # 4. Let fit()'s own requestAnimationFrame scheduling complete, then require two
            #    more animation frames of stability before treating pan/zoom as settled.
            page.evaluate("() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))")
            surface = page.locator("[data-viewport-surface]")
            before = surface.evaluate("el => el.style.transform")
            page.evaluate("() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))")
            after = surface.evaluate("el => el.style.transform")
            if before != after:
                # Documented fallback: one bounded real-time wait, not used as the primary
                # synchronization mechanism (deterministic waits above already gate on it).
                page.wait_for_timeout(250)

            # 5. Explicitly select the canonical node.
            node = page.locator(node_selector)
            if node.count() == 0:
                raise CaptureFailure(f"Node '{node_id}' does not exist in the rendered canvas.")
            node.click()
            page.wait_for_function(
                """(selector) => document.querySelector(selector)?.getAttribute('aria-selected') === 'true'""",
                arg=node_selector,
                timeout=5000,
            )

            # 6. Inspector must reflect the selected node before we read its state.
            page.wait_for_selector('[data-region-name="workflow inspector"]', timeout=5000)

            # Remove any scripted focus ring; selection state lives in React state, not DOM focus.
            page.evaluate("() => { if (document.activeElement) document.activeElement.blur() }")
            # Move the pointer off the canvas so no hover-only affordance (edge connect
            # handles, etc.) is visible in the capture.
            page.mouse.move(20, 20)

            assertions = run_assertions(page, workflow_id, node_id, expected_node_count)
            failed = [name for name, ok in assertions.items() if ok is False]
            if failed:
                raise CaptureFailure(f"Pre-screenshot assertions failed: {', '.join(failed)}")

            output_path.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(output_path), full_page=False)
            print(f"Captured {output_path}")
            print_assertions(assertions)
        finally:
            browser.close()


def run_assertions(page, workflow_id: str, node_id: str, expected_node_count: int) -> dict:
    results: dict[str, object] = {}

    grid = page.locator("[data-mode][data-inspector]").first
    results["design_mode"] = grid.get_attribute("data-mode") == "design"
    results["inspector_open"] = grid.get_attribute("data-inspector") == "open"

    results["sidebar_open"] = page.locator('[data-region-name="workflow sidebar"]').count() > 0

    selected_sidebar_item = page.locator(
        '[data-region-name="workflow sidebar"] button', has_text=workflow_id
    ).first
    results["workflow_selected"] = "border-accent" in (selected_sidebar_item.get_attribute("class") or "")

    node_locator = page.locator(f'[data-node-id="{node_id}"]')
    results["node_exists"] = node_locator.count() == 1
    results["node_selected"] = node_locator.get_attribute("aria-selected") == "true"

    mode_tab = page.get_by_role("tab", name="Design")
    results["mode_tab_selected"] = mode_tab.count() > 0 and mode_tab.get_attribute("aria-selected") == "true"

    inspector_tab = page.get_by_role("tab", name="Overview")
    results["inspector_overview_active"] = (
        inspector_tab.count() > 0 and inspector_tab.get_attribute("aria-selected") == "true"
    )

    run_log_toggle = page.get_by_role("button", name="Expand run log")
    results["run_log_collapsed"] = run_log_toggle.count() > 0

    minimap = page.locator('[data-region-name="workflow canvas"] [role="presentation"]')
    results["minimap_present"] = minimap.count() > 0

    node_count = page.locator("[data-node-id]").count()
    results["node_count_matches"] = node_count == expected_node_count
    results["_node_count_actual"] = node_count

    viewport = page.viewport_size
    results["viewport_correct"] = viewport == {"width": 1440, "height": 900}

    return results


def print_assertions(assertions: dict) -> None:
    for name, value in assertions.items():
        if name.startswith("_"):
            continue
        status = "PASS" if value else "FAIL"
        print(f"  [{status}] {name}")


def update_manifests_on_success() -> None:
    manifest = load_manifest()
    manifest["screenshot"] = {
        "status": "captured",
        "path": "docs/benchmarks/design-skills/screenshots/workflow-canvas-v1-baseline.png",
        "automation": "python_playwright_system_edge",
        "required_viewport": {"width": 1440, "height": 900},
    }
    with MANIFEST_JSON.open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")

    md_text = MANIFEST_MD.read_text(encoding="utf-8")
    old_block = (
        "- status: `not_yet_captured`\n"
        "- path: `null`\n"
        "- automation availability: unavailable (no Playwright/Puppeteer/e2e tooling exists for this app; none installed per instructions)\n"
        "- required viewport: 1440x900"
    )
    new_block = (
        "- status: `captured`\n"
        "- path: `docs/benchmarks/design-skills/screenshots/workflow-canvas-v1-baseline.png`\n"
        "- automation: `python_playwright_system_edge`\n"
        "- required viewport: 1440x900"
    )
    if old_block not in md_text:
        raise CaptureFailure(
            "Markdown manifest's Screenshot section did not match the expected "
            "not_yet_captured block; refusing to auto-edit to avoid corrupting the file. "
            "Update docs/benchmarks/design-skills/workflow-canvas-v1.manifest.md by hand."
        )
    md_text = md_text.replace(old_block, new_block)
    MANIFEST_MD.write_text(md_text, encoding="utf-8")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Capture the workflow-canvas-v1 canonical UI state as a screenshot.",
    )
    target = parser.add_mutually_exclusive_group(required=True)
    target.add_argument(
        "--output",
        type=Path,
        help="Write the screenshot to this path (candidate capture). Never touches the manifest.",
    )
    target.add_argument(
        "--baseline",
        action="store_true",
        help=f"Write to the canonical baseline path ({SCREENSHOT_PATH}). Only path allowed with --update-manifest.",
    )
    parser.add_argument(
        "--update-manifest",
        action="store_true",
        help="Update workflow-canvas-v1.manifest.{json,md} screenshot fields after a successful capture. "
        "Only permitted together with --baseline.",
    )
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args(sys.argv[1:])
    if args.update_manifest and not args.baseline:
        print(
            "CAPTURE FAILED: --update-manifest is only permitted with --baseline. "
            "Candidate captures (--output) must never modify the frozen manifest.",
            file=sys.stderr,
        )
        return 1

    output_path = SCREENSHOT_PATH if args.baseline else args.output.resolve()

    try:
        manifest = load_manifest()
        token = require_token()
        require_frontend_reachable()
        run_capture(manifest, token, output_path)
        if args.update_manifest:
            update_manifests_on_success()
    except CaptureFailure as error:
        print(f"CAPTURE FAILED: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
