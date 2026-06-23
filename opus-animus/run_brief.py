from __future__ import annotations

import sys
from collections.abc import Callable, Sequence
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


ANIMUS_DIR = Path(__file__).resolve().parent
for import_dir in (ANIMUS_DIR, ANIMUS_DIR / "opus-rector"):
    import_dir_text = str(import_dir)
    if import_dir_text not in sys.path:
        sys.path.insert(0, import_dir_text)

# Brief is Vietnamese; force UTF-8 stdout so it prints on Windows consoles (cp1252).
try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

JST = ZoneInfo("Asia/Tokyo")
NO_NEW_MESSAGE = "Không có gì mới cần ưu tiên thêm hôm nay. Brief sáng vẫn còn hiệu lực."

GenerateFn = Callable[[dict[str, Any]], tuple[str, list[dict[str, Any]]]]
GetExistingFn = Callable[[str], list[dict[str, Any]]]


def main(
    argv: Sequence[str] | None = None,
    *,
    today: str | None = None,
    generate: GenerateFn | None = None,
    get_existing: GetExistingFn | None = None,
) -> int:
    _ = argv
    brief_date = today or _today_jst()
    get_existing = get_existing or _load_get_existing()

    if get_existing(brief_date):
        print(NO_NEW_MESSAGE)
        return 0

    generate = generate or _load_generate()
    profile = _load_user_profile()
    brief_text, _items = generate(
        {
            "origin": "user",
            "expected_output": "proactive_item set",
            "date": brief_date,
            "profile": profile,
        }
    )
    print(brief_text)
    return 0


def _today_jst() -> str:
    return datetime.now(JST).date().isoformat()


def _load_generate() -> GenerateFn:
    from primus.brief import generate_brief

    return generate_brief


def _load_get_existing() -> GetExistingFn:
    from rector.proactive import get_proactive_set

    return get_proactive_set


def _load_user_profile() -> dict[str, Any]:
    from primus.profile import load_user_profile

    return load_user_profile()


if __name__ == "__main__":
    sys.exit(main())
