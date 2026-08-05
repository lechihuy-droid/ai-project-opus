"""Route inventory snapshot.

Guards the `server.py` router split (docs/BD-server-router-split.md): moving a
route group into `api/<module>.py` must not add, drop, rename, or reorder any
route. The rest of the suite exercises behaviour, but nothing else asserts that
all 106 routes are still registered — a dropped endpoint would otherwise pass.

If this test fails, the refactor is wrong. Fix the code, never regenerate the
snapshot to make it green.
"""

from __future__ import annotations

import json
from pathlib import Path

import server

SNAPSHOT = Path(__file__).parent / "fixtures" / "route_inventory.json"


def _inventory() -> list[list]:
    rows = []
    for route in server.app.routes:
        methods = sorted(getattr(route, "methods", []) or [])
        rows.append([route.path, methods])
    return sorted(rows)


def test_route_inventory_is_unchanged() -> None:
    expected = [[path, methods] for path, methods in json.loads(SNAPSHOT.read_text(encoding="utf-8"))]
    actual = _inventory()

    missing = [row for row in expected if row not in actual]
    added = [row for row in actual if row not in expected]
    assert not missing, f"routes disappeared: {missing}"
    assert not added, f"routes appeared: {added}"
    assert actual == expected
