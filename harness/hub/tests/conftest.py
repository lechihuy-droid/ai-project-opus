from __future__ import annotations

import os
import sys
from pathlib import Path


HUB_DIR = Path(__file__).resolve().parents[1]
if str(HUB_DIR) not in sys.path:
    sys.path.insert(0, str(HUB_DIR))

# Deterministic token for the whole test session, so tests don't depend on
# (or write) a real hub-token file under the runtime store.
os.environ.setdefault("HUB_TOKEN", "test-hub-token-0123456789abcdef")

import pytest
from fastapi.testclient import TestClient

import config


@pytest.fixture(autouse=True)
def _hub_auth_header(monkeypatch: pytest.MonkeyPatch) -> None:
    """P0.1 gates every request behind config.HUB_TOKEN. Existing tests build
    TestClient instances that only send the old, now-removed CSRF client
    header; default every TestClient to a valid token so those tests keep
    exercising their original behavior instead of tripping the auth guard.
    Tests that specifically assert on missing/invalid-token behavior override
    the X-Hub-Token header on the individual request itself.

    CAUTION: because of this fixture, every TestClient in this suite is
    authenticated by default - a new test will NOT exercise the "no token" /
    "wrong token" path unless it opts out explicitly. To test unauthenticated
    behavior, pass an explicit X-Hub-Token header on the request or client
    (e.g. headers={"X-Hub-Token": ""} or a bogus value); dict.setdefault below
    only fills in the header when the caller omitted it, so an explicit value
    - including "" - always wins over this default. See test_auth_guard.py
    for the pattern.
    """
    real_init = TestClient.__init__

    def patched_init(self, *args, **kwargs):
        headers = dict(kwargs.get("headers") or {})
        headers.setdefault("X-Hub-Token", config.HUB_TOKEN)
        kwargs["headers"] = headers
        real_init(self, *args, **kwargs)

    monkeypatch.setattr(TestClient, "__init__", patched_init)
