from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any
from pathlib import Path

import config
from services import risk


MAX_RECENT = 50


def _now() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _default_state() -> dict[str, Any]:
    return {
        "degradation": 0,
        "clean_streak": 0,
        "recent_denials": [],
        "recent_findings": [],
        "folder_grants": [],
    }


def _load_state() -> dict[str, Any]:
    try:
        data = json.loads(config.GOVERNANCE_STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return _default_state()
    if not isinstance(data, dict):
        return _default_state()
    state = _default_state()
    state.update(data)
    try:
        state["degradation"] = max(0, min(4, int(state.get("degradation") or 0)))
    except (TypeError, ValueError):
        state["degradation"] = 0
    try:
        state["clean_streak"] = max(0, int(state.get("clean_streak") or 0))
    except (TypeError, ValueError):
        state["clean_streak"] = 0
    if not isinstance(state.get("recent_denials"), list):
        state["recent_denials"] = []
    if not isinstance(state.get("recent_findings"), list):
        state["recent_findings"] = []
    if not isinstance(state.get("folder_grants"), list):
        state["folder_grants"] = []
    return state


def _grant_path(path: str | Path) -> Path:
    return Path(path).resolve()


def list_folder_grants() -> list[dict[str, Any]]:
    return [dict(item) for item in _load_state()["folder_grants"] if isinstance(item, dict)]


def find_folder_grant(workflow_id: str, workspace_dir: str | Path) -> dict[str, Any] | None:
    try:
        requested = _grant_path(workspace_dir)
    except OSError:
        return None
    for grant in list_folder_grants():
        if str(grant.get("workflow_id") or "") != workflow_id:
            continue
        try:
            granted = _grant_path(str(grant.get("path") or ""))
            requested.relative_to(granted)
        except (OSError, ValueError):
            continue
        if str(granted) == str(grant.get("path")):
            return grant
    return None


def grant_folder(workflow_id: str, path: str | Path, granted_by: str = "ui") -> dict[str, Any]:
    resolved = _grant_path(path)
    if not resolved.exists() or not resolved.is_dir():
        raise ValueError(f"Folder does not exist: {resolved}")
    from services import fsbrowse
    if fsbrowse.is_denied(resolved) or resolved.parent == resolved:
        raise ValueError(f"Folder is denied: {resolved}")
    if resolved == Path.home().resolve():
        raise ValueError(f"Folder is denied: {resolved}")
    state = _load_state()
    grants = [item for item in state["folder_grants"] if not (isinstance(item, dict) and item.get("workflow_id") == workflow_id and item.get("path") == str(resolved))]
    grant = {"workflow_id": workflow_id, "path": str(resolved), "granted_at": _now(), "granted_by": str(granted_by)}
    state["folder_grants"] = [grant, *grants]
    _save_state(state)
    from services import audit
    audit.append("folder_grant_created", subject_id=workflow_id, context=grant)
    return grant


def revoke_folder_grant(workflow_id: str, path: str) -> bool:
    resolved = str(_grant_path(path))
    state = _load_state()
    before = len(state["folder_grants"])
    state["folder_grants"] = [item for item in state["folder_grants"] if not (isinstance(item, dict) and item.get("workflow_id") == workflow_id and item.get("path") == resolved)]
    changed = len(state["folder_grants"]) != before
    if changed:
        _save_state(state)
        from services import audit
        audit.append("folder_grant_revoked", subject_id=workflow_id, context={"path": resolved})
    return changed


def _save_state(state: dict[str, Any]) -> None:
    config.GOVERNANCE_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    config.GOVERNANCE_STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _base_blocked() -> set[str]:
    values = getattr(config, "JOB_BLOCKED_TIERS", ["destructive"])
    if not isinstance(values, list):
        return {"destructive"}
    return {str(item) for item in values if str(item) in risk.TIER_RANK}


def effective_blocked_tiers(level: int | None = None) -> list[str]:
    if level is None:
        level = int(_load_state().get("degradation") or 0)
    blocked = _base_blocked()
    if level >= 2:
        blocked.add("network")
    if level >= 3:
        blocked.add("execute")
    if level >= 4:
        blocked.update(tier for tier in risk.TIERS if tier != "read_only")
    return [tier for tier in risk.TIERS if tier in blocked]


def _trim(items: list[Any]) -> list[Any]:
    return items[:MAX_RECENT]


def record_findings(job_id: str, findings: list[dict[str, Any]]) -> dict[str, Any]:
    if not findings:
        return _load_state()
    state = _load_state()
    rows = [
        {
            "ts": _now(),
            "job_id": job_id,
            "pattern": str(item.get("pattern") or ""),
            "type": str(item.get("type") or ""),
            "offset": int(item.get("offset") or 0),
        }
        for item in findings
        if isinstance(item, dict)
    ]
    state["recent_findings"] = _trim([*reversed(rows), *state["recent_findings"]])
    _save_state(state)
    return state


def record_denial(job_id: str, reasons: list[str], escalate: bool = False) -> dict[str, Any]:
    state = _load_state()
    state["recent_denials"] = _trim(
        [
            {"ts": _now(), "job_id": job_id, "reasons": [str(reason) for reason in reasons]},
            *state["recent_denials"],
        ]
    )
    if escalate:
        state["degradation"] = min(4, int(state.get("degradation") or 0) + 1)
        state["clean_streak"] = 0
    _save_state(state)
    return state


def raise_degradation(job_id: str = "", reasons: list[str] | None = None) -> dict[str, Any]:
    if reasons:
        return record_denial(job_id, reasons, escalate=True)
    state = _load_state()
    state["degradation"] = min(4, int(state.get("degradation") or 0) + 1)
    state["clean_streak"] = 0
    _save_state(state)
    return state


def record_clean_job() -> dict[str, Any]:
    state = _load_state()
    if int(state.get("degradation") or 0) <= 0:
        state["clean_streak"] = 0
        _save_state(state)
        return state
    state["clean_streak"] = int(state.get("clean_streak") or 0) + 1
    if state["clean_streak"] >= int(config.GOV_RECOVERY_STEPS):
        state["degradation"] = max(0, int(state.get("degradation") or 0) - 1)
        state["clean_streak"] = 0
    _save_state(state)
    return state


def status() -> dict[str, Any]:
    state = _load_state()
    return {
        "degradation": int(state.get("degradation") or 0),
        "blocked_tiers": effective_blocked_tiers(int(state.get("degradation") or 0)),
        "recent_denials": list(state.get("recent_denials") or []),
        "recent_findings": list(state.get("recent_findings") or []),
    }
