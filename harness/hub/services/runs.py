from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import config
from services.boundary import resolve_in_root


CACHE_TTL_SECONDS = 5.0
_RUNS_CACHE: dict[str, Any] = {"expires": 0.0, "base": None, "items": []}


def _read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object: {path}")
    return data


def _as_checks(summary: dict[str, Any]) -> list[dict[str, Any]]:
    results = summary.get("results", [])
    return results if isinstance(results, list) else []


def _duration_seconds(summary: dict[str, Any]) -> float:
    duration = summary.get("duration_seconds")
    if isinstance(duration, int | float):
        return round(float(duration), 3)
    total = 0.0
    for check in _as_checks(summary):
        if isinstance(check, dict) and isinstance(check.get("duration_seconds"), int | float):
            total += float(check["duration_seconds"])
    return round(total, 3)


def _run_summary(summary: dict[str, Any], path: Path) -> dict[str, Any]:
    checks = _as_checks(summary)
    passed = summary.get("passed")
    failed = summary.get("failed")
    total = summary.get("total")
    if not isinstance(passed, int):
        passed = sum(1 for check in checks if isinstance(check, dict) and check.get("status") == "pass")
    if not isinstance(failed, int):
        failed = sum(1 for check in checks if isinstance(check, dict) and check.get("status") != "pass")
    if not isinstance(total, int):
        total = len(checks)

    return {
        "run_id": summary.get("run_id") or path.parent.name,
        "suite": summary.get("suite"),
        "suite_name": summary.get("suite_name") or summary.get("suite"),
        "status": summary.get("status") or ("pass" if failed == 0 else "fail"),
        "passed": passed,
        "failed": failed,
        "total": total,
        "started_at": summary.get("started_at"),
        "finished_at": summary.get("finished_at"),
        "duration_seconds": _duration_seconds(summary),
    }


def _sort_time(item: dict[str, Any]) -> str:
    value = item.get("finished_at") or item.get("started_at") or ""
    return str(value)


def list_runs() -> list[dict[str, Any]]:
    base = config.RUNS_DIR.resolve()
    now = time.monotonic()
    if _RUNS_CACHE["base"] == base and _RUNS_CACHE["expires"] > now:
        return list(_RUNS_CACHE["items"])

    items: list[dict[str, Any]] = []
    if config.RUNS_DIR.exists():
        for summary_path in config.RUNS_DIR.glob("*/summary.json"):
            try:
                resolved = resolve_in_root(summary_path, config.RUNS_DIR)
                items.append(_run_summary(_read_json(resolved), resolved))
            except (OSError, ValueError, PermissionError, json.JSONDecodeError):
                continue

    items.sort(key=_sort_time, reverse=True)
    _RUNS_CACHE.update({"base": base, "expires": now + CACHE_TTL_SECONDS, "items": items})
    return list(items)


def _run_dir(run_id: str) -> Path:
    if not run_id or Path(run_id).name != run_id:
        raise FileNotFoundError(f"Run not found: {run_id}")
    path = resolve_in_root(run_id, config.RUNS_DIR)
    if not path.is_dir():
        raise FileNotFoundError(f"Run not found: {run_id}")
    return path


def _artifact_rel(path: Path, run_dir: Path) -> str:
    return path.resolve().relative_to(run_dir.resolve()).as_posix()


def _list_artifacts(run_dir: Path) -> list[str]:
    artifacts: list[str] = []
    for path in run_dir.rglob("*"):
        if not path.is_file():
            continue
        try:
            resolved = resolve_in_root(path, run_dir)
        except PermissionError:
            continue
        artifacts.append(_artifact_rel(resolved, run_dir))
    return sorted(artifacts)


def _log_rel(value: Any, run_dir: Path) -> str | None:
    if not isinstance(value, str) or not value:
        return None

    path = Path(value)
    candidates = [path]
    if run_dir.name in path.parts:
        index = path.parts.index(run_dir.name)
        suffix = path.parts[index + 1 :]
        if suffix:
            candidates.append(run_dir.joinpath(*suffix))
    if not path.is_absolute():
        candidates.append(config.ROOT / path)

    for candidate in candidates:
        try:
            resolved = resolve_in_root(candidate, run_dir)
        except PermissionError:
            continue
        if resolved.is_file():
            return _artifact_rel(resolved, run_dir)
    return None


def _checks_with_logs(summary: dict[str, Any], run_dir: Path) -> list[dict[str, Any]]:
    checks: list[dict[str, Any]] = []
    for raw in _as_checks(summary):
        if not isinstance(raw, dict):
            continue
        check = dict(raw)
        evidence = check.get("evidence")
        logs: list[str] = []
        if isinstance(evidence, dict):
            for key, value in evidence.items():
                if not key.endswith("_log"):
                    continue
                rel = _log_rel(value, run_dir)
                if rel:
                    logs.append(rel)
        check["logs"] = logs
        checks.append(check)
    return checks


def get_run(run_id: str) -> dict[str, Any]:
    run_dir = _run_dir(run_id)
    summary_path = resolve_in_root("summary.json", run_dir)
    if not summary_path.is_file():
        raise FileNotFoundError(f"Run summary not found: {run_id}")

    summary = _read_json(summary_path)
    report_path = resolve_in_root("report.md", run_dir)
    report_md = report_path.read_text(encoding="utf-8") if report_path.is_file() else ""

    return {
        "summary": _run_summary(summary, summary_path),
        "checks": _checks_with_logs(summary, run_dir),
        "report_md": report_md,
        "artifacts": _list_artifacts(run_dir),
    }


def read_artifact(run_id: str, rel: str) -> str:
    run_dir = _run_dir(run_id)
    path = resolve_in_root(rel, run_dir)
    if not path.is_file():
        raise FileNotFoundError(f"Artifact not found: {rel}")
    return path.read_text(encoding="utf-8", errors="replace")


def _check_key(check: dict[str, Any]) -> str | None:
    value = check.get("id")
    return value if isinstance(value, str) and value else None


def _diff_check(check: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": check.get("id"),
        "type": check.get("type"),
        "status": check.get("status"),
        "message": check.get("message"),
        "hint": check.get("hint"),
    }


def compare_runs(a: str, b: str) -> dict[str, Any]:
    left = get_run(a)
    right = get_run(b)
    left_summary = left["summary"]
    right_summary = right["summary"]
    if left_summary.get("suite") != right_summary.get("suite"):
        raise ValueError("Runs must belong to the same suite")

    left_checks = {_check_key(check): check for check in left["checks"] if _check_key(check)}
    right_checks = {_check_key(check): check for check in right["checks"] if _check_key(check)}
    left_ids = set(left_checks)
    right_ids = set(right_checks)

    added = [_diff_check(right_checks[check_id]) for check_id in sorted(right_ids - left_ids)]
    removed = [_diff_check(left_checks[check_id]) for check_id in sorted(left_ids - right_ids)]
    changed: list[dict[str, Any]] = []
    for check_id in sorted(left_ids & right_ids):
        before = left_checks[check_id]
        after = right_checks[check_id]
        if before.get("status") == after.get("status"):
            continue
        changed.append(
            {
                "id": check_id,
                "type": after.get("type") or before.get("type"),
                "from_status": before.get("status"),
                "to_status": after.get("status"),
                "from_message": before.get("message"),
                "to_message": after.get("message"),
                "before": _diff_check(before),
                "after": _diff_check(after),
            }
        )

    return {
        "a": left_summary,
        "b": right_summary,
        "added": added,
        "removed": removed,
        "changed": changed,
    }
