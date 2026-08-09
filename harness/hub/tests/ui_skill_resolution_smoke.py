"""Browser acceptance smoke for the Workflows skill-resolution preview.

Run through webapp-testing's with_server.py using a Python environment that
provides Playwright. This is intentionally a user-visible contract test rather
than a component implementation test.
"""
from __future__ import annotations

import os
import re

from playwright.sync_api import expect, sync_playwright


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 960})
        console_errors: list[str] = []
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)

        page.goto(f"{os.environ.get('HARNESS_UI_URL', 'http://127.0.0.1:8799')}/#/workflows")
        page.wait_for_load_state("networkidle")
        page.get_by_text("software-delivery", exact=True).first.click()
        page.get_by_role("button", name="Node implement").click()
        page.get_by_role("tab", name="Run", exact=True).click()
        page.get_by_placeholder(re.compile(r"^Run objective")).fill("Build a dashboard for requirements")

        preview_button = page.get_by_role("button", name="Resolution preview")
        expect(preview_button).to_be_enabled()
        preview_button.click()

        expect(page.get_by_role("heading", name="Skill resolution preview")).to_be_visible()
        expect(page.get_by_role("dialog", name="Skill resolution preview")).to_be_focused()
        expect(page.get_by_text("Mode: shadow", exact=True)).to_be_visible()
        expect(page.get_by_text(re.compile("Shadow preview does not change"))).to_be_visible()
        expect(page.get_by_text("hub_builtin/frontend-app-builder", exact=True).first).to_be_visible()
        expect(page.locator("body")).not_to_contain_text("FRONTEND_APP_BODY_DO_NOT_LEAK")
        assert not console_errors, f"browser console errors: {console_errors}"

        page.keyboard.press("Escape")
        expect(page.get_by_role("heading", name="Skill resolution preview")).not_to_be_visible()
        expect(preview_button).to_be_focused()
        browser.close()


if __name__ == "__main__":
    main()
