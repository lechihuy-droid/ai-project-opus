from __future__ import annotations

import argparse
import os
import sys
from collections.abc import Callable, Sequence
from datetime import datetime, time
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


ANIMUS_DIR = Path(__file__).resolve().parent
for import_dir in (ANIMUS_DIR, ANIMUS_DIR / "opus-rector"):
    import_dir_text = str(import_dir)
    if import_dir_text not in sys.path:
        sys.path.insert(0, import_dir_text)

# Brief text is Vietnamese; force UTF-8 stdout on Windows consoles (cp1252).
try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

JST = ZoneInfo("Asia/Tokyo")
DEFAULT_QUIET_HOURS = {"start": "06:00", "end": "22:00"}
TRACE_SOURCE = "run_push_brief.py"

GenerateFn = Callable[[dict[str, Any]], tuple[str, list[dict[str, Any]]]]
GetExistingFn = Callable[[str], list[dict[str, Any]]]
SendFn = Callable[[str], bool]
ProfileFn = Callable[[], dict[str, Any]]


def main(
    argv: Sequence[str] | None = None,
    *,
    now: datetime | None = None,
    generate: GenerateFn | None = None,
    get_existing: GetExistingFn | None = None,
    send: SendFn | None = None,
    profile: dict[str, Any] | ProfileFn | None = None,
) -> int:
    args = _parse_args([] if argv is None else argv)
    _apply_rank_mode(args)
    now_jst = _coerce_jst(now)
    today = now_jst.date().isoformat()
    user_profile = _resolve_profile(profile)

    if not _inside_delivery_window(now_jst, user_profile):
        _log_delivery_trace(today, now_jst, "suppressed_quiet")
        return 0

    get_existing = get_existing or _load_get_existing()
    if get_existing(today):
        _log_delivery_trace(today, now_jst, "suppressed_ratelimited")
        return 0

    generate = generate or _load_generate()
    brief_text, items = generate(
        {
            "origin": "proactive_trigger",
            "expected_output": "proactive_item set",
            "date": today,
            "profile": user_profile,
        }
    )

    if not items:
        _log_delivery_trace(today, now_jst, "suppressed_empty")
        return 0

    if args.dry_run:
        print(brief_text)
        _log_delivery_trace(today, now_jst, "pushed", note="dry_run")
        return 0

    if send is None and not _load_creds_present()():
        print(brief_text)
        _log_delivery_trace(today, now_jst, "pushed", note="missing_creds_dry_run")
        return 0

    send = send or _load_send()
    if send(brief_text):
        _log_delivery_trace(today, now_jst, "pushed", send_attempts=1)
        return 0

    if send(brief_text):
        _log_delivery_trace(today, now_jst, "pushed", send_attempts=2)
        return 0

    _log_delivery_trace(today, now_jst, "send_failed", send_attempts=2)
    return 0


def _parse_args(argv: Sequence[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Push the Primus morning brief to Telegram.")
    parser.add_argument("--dry-run", action="store_true", help="Generate and print the brief without sending.")
    parser.add_argument(
        "--use-llm",
        action="store_true",
        help="Use the external LLM ranker. Default for unattended push is the deterministic heuristic ranker.",
    )
    return parser.parse_args(argv)


def _apply_rank_mode(args: argparse.Namespace) -> None:
    """Default the unattended push to the deterministic heuristic ranker.

    The scheduled job runs without a person watching, so LLM ranker hiccups would
    silently degrade or drop the brief. Force the heuristic path unless the caller
    explicitly opts into the LLM (``--use-llm``) or has already set the env var.
    """

    if args.use_llm:
        os.environ.pop("ANIMUS_BRIEF_NO_LLM", None)
        return
    os.environ.setdefault("ANIMUS_BRIEF_NO_LLM", "1")


def _coerce_jst(now: datetime | None) -> datetime:
    if now is None:
        return datetime.now(JST)
    if now.tzinfo is None:
        return now.replace(tzinfo=JST)
    return now.astimezone(JST)


def _resolve_profile(profile: dict[str, Any] | ProfileFn | None) -> dict[str, Any]:
    if callable(profile):
        return profile()
    if isinstance(profile, dict):
        return profile
    return _load_user_profile()()


def _inside_delivery_window(now_jst: datetime, profile: dict[str, Any]) -> bool:
    quiet_hours = _quiet_hours(profile)
    start = _parse_hhmm(
        str(quiet_hours.get("start", DEFAULT_QUIET_HOURS["start"])),
        DEFAULT_QUIET_HOURS["start"],
    )
    end = _parse_hhmm(
        str(quiet_hours.get("end", DEFAULT_QUIET_HOURS["end"])),
        DEFAULT_QUIET_HOURS["end"],
    )
    current = now_jst.time().replace(second=0, microsecond=0)

    if start <= end:
        return start <= current < end
    return current >= start or current < end


def _quiet_hours(profile: dict[str, Any]) -> dict[str, str]:
    preferences = profile.get("preferences", {}) if isinstance(profile, dict) else {}
    raw = preferences.get("quiet_hours") if isinstance(preferences, dict) else None
    if not isinstance(raw, dict):
        raw = profile.get("quiet_hours") if isinstance(profile, dict) else None
    if not isinstance(raw, dict):
        return dict(DEFAULT_QUIET_HOURS)
    return {
        "start": str(raw.get("start", DEFAULT_QUIET_HOURS["start"])),
        "end": str(raw.get("end", DEFAULT_QUIET_HOURS["end"])),
    }


def _parse_hhmm(value: str, default: str) -> time:
    try:
        return datetime.strptime(value, "%H:%M").time()
    except ValueError:
        return datetime.strptime(default, "%H:%M").time()


def _log_delivery_trace(
    today: str,
    now_jst: datetime,
    output_kind: str,
    **extra: Any,
) -> None:
    from animus_core.trace import log_trace

    record = {
        "id": f"{today}-{now_jst:%H%M%S}-push",
        "ts": now_jst.isoformat(timespec="seconds"),
        "origin": "proactive_trigger",
        "user_input": "",
        "intent_type": "infra",
        "target_subsystem": "INFRA",
        "route_confidence": 1.0,
        "sources_loaded": [TRACE_SOURCE],
        "action_class": "draft",
        "output_kind": output_kind,
        "step_index": 0,
    }
    record.update(extra)
    log_trace(record)


def _load_generate() -> GenerateFn:
    from primus.brief import generate_brief

    return generate_brief


def _load_get_existing() -> GetExistingFn:
    from rector.proactive import get_proactive_set

    return get_proactive_set


def _load_send() -> SendFn:
    from primus.telegram import send_telegram

    return send_telegram


def _load_creds_present() -> Callable[[], bool]:
    from primus.telegram import creds_present

    return creds_present


def _load_user_profile() -> ProfileFn:
    from primus.profile import load_user_profile

    return load_user_profile


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
