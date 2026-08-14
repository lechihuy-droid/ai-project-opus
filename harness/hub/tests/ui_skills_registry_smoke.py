"""Rendered acceptance smoke for the Skills registry governance surface.

Run with ``HARNESS_UI_URL`` through webapp-testing's ``with_server.py``.
The test intentionally makes no deployment or other mutation requests.
"""
from __future__ import annotations

import os
import time
from typing import Any

from playwright.sync_api import Page, expect, sync_playwright


BASE_URL = os.environ.get("HARNESS_UI_URL", "http://127.0.0.1:8799").rstrip("/")


def _install_optional_request_gate(page: Page) -> None:
    """Hold optional governance fetches until the test releases each class."""
    page.add_init_script(
        """
        (() => {
          const originalFetch = window.fetch.bind(window);
          const queues = { telemetry: [], target: [] };
          const seen = { telemetry: 0, target: 0 };
          window.__skillsOptional = { queues, seen, enabled: true };
          window.__releaseSkillsOptional = (kind) => {
            const item = queues[kind].shift();
            if (item) item.resolve(originalFetch(item.input, item.init));
            return Boolean(item);
          };
          window.fetch = (input, init) => {
            const url = typeof input === 'string' ? input : input.url;
            const kind = url.includes('/api/skill-library/telemetry')
              ? 'telemetry'
              : url.includes('/api/skill-library/target-status') ? 'target' : null;
            if (!kind || !window.__skillsOptional.enabled) return originalFetch(input, init);
            seen[kind] += 1;
            return new Promise((resolve, reject) => queues[kind].push({ input, init, resolve, reject }));
          };
        })();
        """
    )


def _release(page: Page, kind: str) -> bool:
    return bool(page.evaluate("kind => window.__releaseSkillsOptional(kind)", kind))


def _optional_seen(page: Page) -> dict[str, int]:
    return page.evaluate("() => ({ ...window.__skillsOptional.seen })")


def _set_optional_gate(page: Page, enabled: bool) -> None:
    page.evaluate("enabled => { window.__skillsOptional.enabled = enabled }", enabled)


def _status_pairs(page: Page, target: str) -> list[dict[str, Any]]:
    return page.evaluate(
        """async target => {
          const response = await fetch(`/api/skill-library/target-status?target=${encodeURIComponent(target)}`);
          return (await response.json()).items;
        }""",
        target,
    )


def _target_options(page: Page) -> list[str]:
    return page.locator('select[aria-label="Deployment target"] option').all_text_contents()


def _select_pair(page: Page) -> tuple[str, dict[str, Any]]:
    """Choose a real source/target pair that can render bounded compare content."""
    for target in _target_options(page):
        items = _status_pairs(page, target)
        candidate = next((item for item in items if item.get("target_skill_id") and item["source"] != target), None)
        if candidate:
            return target, candidate
    raise AssertionError("fixture has no cross-source skill pair available for compare")


def _has_stale_current_target_get(requests: list[tuple[str, str]], target_skill_id: str) -> bool:
    current_gets = [url for method, url in requests if method == "GET" and url.endswith(f"/api/skill-library/{target_skill_id}")]
    return len(current_gets) > 1


def main() -> None:
    console_errors: list[str] = []
    requests: list[tuple[str, str]] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page(viewport={"width": 1440, "height": 960})
            _install_optional_request_gate(page)
            page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
            page.on("request", lambda request: requests.append((request.method, request.url)))

            started = time.perf_counter()
            page.goto(f"{BASE_URL}/#/skills", wait_until="domcontentloaded")
            expect(page.get_by_role("heading", name="Skills")).to_be_visible()
            expect(page.get_by_role("table")).to_be_visible()
            expect(page.get_by_role("row").nth(1)).to_be_visible()
            first_table_ms = round((time.perf_counter() - started) * 1000)
            expect(page.get_by_text("Deployment target", exact=True)).to_be_visible()
            target_diagnostic = page.locator("section details > summary").first
            expect(target_diagnostic).to_have_text("Checking")
            page.wait_for_function("() => window.__skillsOptional.seen.telemetry >= 1 && window.__skillsOptional.seen.target >= 1")

            seen_before_release = _optional_seen(page)
            assert seen_before_release["telemetry"] >= 1, seen_before_release
            assert seen_before_release["target"] >= 1, seen_before_release
            assert _release(page, "telemetry"), "telemetry request was not held"
            expect(target_diagnostic).to_have_text("Checking")
            assert _release(page, "target"), "target-status request was not held"
            expect(target_diagnostic).not_to_have_text("Checking")

            # Use only public responses to select a real compareable source/target pair.
            _set_optional_gate(page, False)
            pair_target, pair = _select_pair(page)
            target_select = page.locator('select[aria-label="Deployment target"]')
            if target_select.input_value() != pair_target:
                _set_optional_gate(page, True)
                target_select.select_option(label=pair_target)
                expect(target_diagnostic).to_have_text("Checking")
                assert _release(page, "target"), "changed target request was not held"
                expect(target_diagnostic).not_to_have_text("Checking")
                _set_optional_gate(page, False)

            page.locator('select[aria-label="Source"]').select_option(label=pair["source"])
            page.get_by_role("searchbox", name="Search skills").fill(pair["name"])
            row = page.get_by_role("row").filter(has_text=pair["skill_id"].split("/", 1)[-1]).filter(has_text=pair["source"]).first
            inspect = row.get_by_role("button", name="Inspect")
            expect(inspect).to_be_visible()
            inspect.click()
            dialog = page.get_by_role("dialog", name=f"Skill inspector for {pair['name']}")
            expect(dialog).to_be_visible()
            assert page.evaluate("dialog => dialog.contains(document.activeElement)", dialog.element_handle())

            request_count_before_compare = len(requests)
            with page.expect_response(lambda response: response.request.method == "GET" and response.url.endswith(f"/api/skill-library/{pair['target_skill_id']}")) as target_detail_response:
                page.get_by_role("button", name="Compare changes").click()
            initial_target_detail = target_detail_response.value
            assert initial_target_detail.ok, initial_target_detail.status
            initial_target_body = initial_target_detail.json()
            assert initial_target_body["id"] == pair["target_skill_id"]
            assert isinstance(initial_target_body["content"], str) and initial_target_body["content"]
            target_compare_pre = dialog.locator("pre").nth(2)
            expect(target_compare_pre).to_have_text(initial_target_body["content"])
            compare_requests = requests[request_count_before_compare:]
            assert compare_requests, "compare did not request the selected target detail"
            assert all(method == "GET" and "/api/skill-library/" in url for method, url in compare_requests), compare_requests
            assert not any("/deploy" in url or method in {"POST", "PUT", "PATCH", "DELETE"} for method, url in compare_requests), compare_requests

            # If another target offers this source skill, change target while compare stays open.
            alternatives: list[tuple[str, dict[str, Any]]] = []
            for candidate_target in _target_options(page):
                if candidate_target == pair_target:
                    continue
                candidate = next((item for item in _status_pairs(page, candidate_target) if item["skill_id"] == pair["skill_id"] and item.get("target_skill_id") and item.get("target_hash") != pair.get("target_hash")), None)
                if candidate:
                    alternatives.append((candidate_target, candidate))
                    break
            if alternatives:
                next_target, next_pair = alternatives[0]
                _set_optional_gate(page, True)
                target_select.select_option(label=next_target)
                with page.expect_response(lambda response: response.request.method == "GET" and response.url.endswith(f"/api/skill-library/{next_pair['target_skill_id']}")) as next_target_detail_response:
                    assert _release(page, "target"), "alternate target request was not held"
                next_target_detail = next_target_detail_response.value
                assert next_target_detail.ok, next_target_detail.status
                next_target_body = next_target_detail.json()
                assert next_target_body["id"] == next_pair["target_skill_id"]
                assert isinstance(next_target_body["content"], str) and next_target_body["content"]
                assert next_target_body["content"] != initial_target_body["content"], "alternate target body must distinguish stale rendered content"
                expect(target_compare_pre).to_have_text(next_target_body["content"])
                expect(target_compare_pre).not_to_have_text(initial_target_body["content"])
                assert not _has_stale_current_target_get(requests, next_pair["target_skill_id"]), requests

            page.keyboard.press("Escape")
            expect(dialog).not_to_be_visible()
            expect(inspect).to_be_focused()
            assert not console_errors, f"browser console errors: {console_errors}"
            print(
                "skills-registry smoke: "
                f"viewport=1440x960 first_table_ms={first_table_ms} "
                f"optional_before_release={seen_before_release} "
                f"compare_requests={len(compare_requests)} alternatives={len(alternatives)}"
            )
        finally:
            browser.close()


if __name__ == "__main__":
    main()
