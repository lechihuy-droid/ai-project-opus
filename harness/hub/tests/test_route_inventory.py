"""Route inventory snapshot.

Guards the `server.py` router split (docs/BD-server-router-split.md): moving a
route group into `api/<module>.py` must not add, drop, rename, or reorder any
route. The rest of the suite exercises behaviour, but nothing else asserts that
the whole route table is still registered — a dropped endpoint would otherwise
pass.

The inventory comes from `app.openapi()`, not from walking `app.routes`.
FastAPI 0.138 stores `include_router()` as a single lazy `_IncludedRouter`
entry with no `.path`, so `app.routes` does not enumerate routes reached
through a router; the generated schema does. Mounts never appear in the schema,
so `/assets` is checked separately.

If this test fails, the refactor is wrong. Fix the code, never regenerate the
snapshot to make it green.
"""

from __future__ import annotations

import json
import warnings
from pathlib import Path

from starlette.routing import Mount

import server

SNAPSHOT = Path(__file__).parent / "fixtures" / "route_inventory.json"


def _inventory() -> list[list]:
    with warnings.catch_warnings():
        # api_vgov_proxy registers one function under four methods, which trips
        # the duplicate-operation-id warning. Pre-existing, unrelated to routing.
        warnings.simplefilter("ignore")
        spec = server.app.openapi()
    return sorted([path, sorted(method.upper() for method in operations)] for path, operations in spec["paths"].items())


def test_route_inventory_is_unchanged() -> None:
    expected = [[path, methods] for path, methods in json.loads(SNAPSHOT.read_text(encoding="utf-8"))]
    actual = _inventory()

    missing = [row for row in expected if row not in actual]
    added = [row for row in actual if row not in expected]
    assert not missing, f"routes disappeared: {missing}"
    assert not added, f"routes appeared: {added}"
    assert actual == expected


def test_static_assets_mount_survives() -> None:
    # Mounts are invisible to the OpenAPI schema, so the split could drop the
    # web-v3 asset mount without the inventory noticing.
    assert [route.path for route in server.app.routes if isinstance(route, Mount)] == ["/assets"]
