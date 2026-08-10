from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import re
import shutil
import threading
import time
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

import config
from services import replay


try:
    import yaml  # type: ignore
except ImportError:  # pragma: no cover - optional dependency not installed
    yaml = None  # type: ignore


SKILL_PROMPT_MAX_CHARS = 12000
_SKILL_TOOL_NAME = "Skill"
_TELEMETRY_WINDOW_DAYS = 30
_TELEMETRY_CACHE_TTL_SECONDS = 30.0
_FINGERPRINT_CACHE_TTL_SECONDS = 1.0
_BOM = "\ufeff"
_FRONTMATTER_RE = re.compile(rf"^{_BOM}?---\s*\n(.*?\n)---\s*\n?", re.DOTALL)

_DEFAULT_SKILL_SOURCES: dict[str, Path] = {
    "hub_builtin": config.HUB_DIR / "skills",
    "codex_stack": config.ROOT / "harness" / "codex-stack" / "skills",
    "codex_project": config.ROOT / ".agents" / "skills",
    "claude_user": Path.home() / ".claude" / "skills",
    "claude_project": config.ROOT / ".claude" / "skills",
    "codex_user": Path.home() / ".codex" / "skills",
}

_INDEX_CACHE: dict[str, Any] = {
    "fingerprint": None,
    "fingerprint_expires": 0.0,
    "entries": [],
    "sources": None,
    "source_identities": None,
    "revision": 0,
}
_SKILL_NAMES_CACHE: dict[str, Any] = {"fingerprint": None, "names": set()}
_LOCK = threading.RLock()
_DEPLOY_LOCKS_LOCK = threading.RLock()
_DEPLOY_LOCKS: dict[str, threading.RLock] = {}
_EVIDENCE_LOCKS_LOCK = threading.RLock()
_EVIDENCE_LOCKS: dict[str, threading.RLock] = {}
_DEPLOY_LOCK_WAIT_SECONDS = 5.0
_DEPLOY_LOCK_RETRY_SECONDS = 0.05
_TELEMETRY_LOCK = threading.RLock()
_TELEMETRY_CACHE: dict[str, Any] = {"expires": 0.0, "fingerprint": None, "events": []}
_SAFE_SKILL_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]*$")
_CONTENT_HASH = re.compile(r"^sha256:[0-9a-f]{64}$")
_EXPECTED_TARGET_HASH_UNSET = object()


class SkillConflictError(RuntimeError):
    """Raised when a deployment would overwrite divergent source and target variants."""


class SkillPreconditionError(RuntimeError):
    """Raised when a target changed after the operator compared it."""


class SkillEvidenceError(RuntimeError):
    """Raised when a deployment cannot be durably recorded for audit."""


def _destination_lock(path: Path) -> threading.RLock:
    """Return the process-local lock for one exact deployment destination."""
    key = str(path.resolve(strict=False)).casefold()
    with _DEPLOY_LOCKS_LOCK:
        return _DEPLOY_LOCKS.setdefault(key, threading.RLock())


@contextmanager
def _filesystem_path_lock(lock_path: Path, timeout_error: RuntimeError) -> Iterator[None]:
    """Hold a bounded cross-process advisory lock for one stable lock file."""
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    handle = lock_path.open("a+b")
    acquired = False
    try:
        handle.seek(0, os.SEEK_END)
        if handle.tell() == 0:
            handle.write(b"0")
            handle.flush()
        deadline = time.monotonic() + _DEPLOY_LOCK_WAIT_SECONDS
        while not acquired:
            try:
                handle.seek(0)
                if os.name == "nt":
                    import msvcrt

                    msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
                else:  # pragma: no cover - Windows is the supported Hub runtime
                    import fcntl

                    fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                acquired = True
            except OSError:
                if time.monotonic() >= deadline:
                    raise timeout_error
                time.sleep(_DEPLOY_LOCK_RETRY_SECONDS)
        yield
    finally:
        try:
            if acquired:
                handle.seek(0)
                if os.name == "nt":
                    import msvcrt

                    msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
                else:  # pragma: no cover - Windows is the supported Hub runtime
                    import fcntl

                    fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
        finally:
            handle.close()


@contextmanager
def _filesystem_destination_lock(dest_path: Path) -> Iterator[None]:
    """Hold a bounded cross-process advisory lock for one destination path."""
    lock_path = dest_path.parent / f".{dest_path.name}.deploy.lock"
    with _filesystem_path_lock(lock_path, SkillPreconditionError("Deployment target is busy")):
        yield


def _evidence_lock(log_path: Path) -> threading.RLock:
    """Return the process-local lock for one shared deploy evidence log."""
    key = str(log_path.resolve(strict=False)).casefold()
    with _EVIDENCE_LOCKS_LOCK:
        return _EVIDENCE_LOCKS.setdefault(key, threading.RLock())


@contextmanager
def _filesystem_evidence_lock(log_path: Path) -> Iterator[None]:
    """Serialize readers and writers of a deploy log across threads and processes."""
    lock_path = log_path.parent / f".{log_path.name}.lock"
    with _evidence_lock(log_path):
        with _filesystem_path_lock(lock_path, SkillEvidenceError("Deployment evidence is busy")):
            yield


def _sources() -> dict[str, Path]:
    sources = getattr(config, "SKILL_SOURCES", None)
    if isinstance(sources, dict) and sources:
        return {str(key): Path(value) for key, value in sources.items()}
    return dict(_DEFAULT_SKILL_SOURCES)


def _source_identities() -> tuple[tuple[str, str], ...]:
    """Return configured source identity without filesystem metadata access."""
    return tuple(sorted((source, str(root)) for source, root in _sources().items()))


def _deploy_log_path() -> Path:
    path = getattr(config, "SKILL_DEPLOY_LOG", None)
    if isinstance(path, Path):
        return path
    return config.HUB_DIR / ".cache" / "skill_deploy_log.jsonl"


def _clear_cache() -> None:
    with _LOCK:
        _INDEX_CACHE.update({
            "fingerprint": None,
            "fingerprint_expires": 0.0,
            "entries": [],
            "sources": None,
            "source_identities": None,
        })
        _SKILL_NAMES_CACHE.update({"fingerprint": None, "names": set()})


def create_skill(payload: dict[str, Any]) -> dict[str, Any]:
    name, source, content = payload.get("name"), payload.get("source"), payload.get("content")
    if not isinstance(name, str) or not _SAFE_SKILL_NAME.fullmatch(name): raise ValueError("Invalid skill name")
    if not isinstance(source, str) or source not in _sources(): raise ValueError("Unknown skill source")
    if not isinstance(content, str) or not content.strip(): raise ValueError("content is required")
    root = _sources()[source]; path = root / name
    if path.exists(): raise ValueError("Skill already exists")
    path.mkdir(parents=True); (path / "SKILL.md").write_text(content, encoding="utf-8"); _clear_cache()
    return get_skill(f"{source}/{name}")


def update_skill(skill_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    entry = next((row for row in _scan_all_sources() if row["id"] == skill_id), None)
    if entry is None: raise FileNotFoundError(f"Skill not found: {skill_id}")
    content = payload.get("content")
    if not isinstance(content, str) or not content.strip(): raise ValueError("content is required")
    _skill_md_path(Path(entry["path"])).write_text(content, encoding="utf-8"); _clear_cache()
    return get_skill(skill_id)


def delete_skill(skill_id: str) -> None:
    entry = next((row for row in _scan_all_sources() if row["id"] == skill_id), None)
    if entry is None: raise FileNotFoundError(f"Skill not found: {skill_id}")
    path = Path(entry["path"])
    if path.is_dir(): shutil.rmtree(path)
    else: path.unlink()
    _clear_cache()


# --------------------------------------------------------------------------
# Discovery
# --------------------------------------------------------------------------


def _iter_skill_dirs(root: Path) -> list[tuple[str, Path]]:
    """Return (dirname, skill_path) pairs directly under one source root.

    A skill is either a subdir containing SKILL.md, or a standalone .md file
    (the codex-style single-file skill).
    """
    if not root.exists():
        return []
    items: list[tuple[str, Path]] = []
    try:
        entries = sorted(root.iterdir(), key=lambda p: p.name.lower())
    except OSError:
        return []
    for entry in entries:
        try:
            if entry.is_dir():
                if (entry / "SKILL.md").is_file():
                    items.append((entry.name, entry))
            elif entry.is_file() and entry.suffix.lower() == ".md":
                items.append((entry.stem, entry))
        except OSError:
            continue
    return items


def _skill_md_path(path: Path) -> Path:
    return path / "SKILL.md" if path.is_dir() else path


def _skill_files(path: Path) -> list[Path]:
    if not path.is_dir():
        return [path]
    try:
        return sorted((p for p in path.rglob("*") if p.is_file()), key=lambda p: p.relative_to(path).as_posix())
    except OSError:
        return []


def _content_hash(path: Path) -> str:
    digest = hashlib.sha256()
    for file_path in _skill_files(path):
        rel = file_path.relative_to(path).as_posix() if path.is_dir() else file_path.name
        digest.update(rel.encode("utf-8"))
        try:
            digest.update(file_path.read_bytes())
        except OSError:
            continue
    return f"sha256:{digest.hexdigest()}"


def _dir_mtime_ns(path: Path) -> int:
    """Return direct mtime; recursive walks are too costly on hot paths."""
    try:
        return path.stat().st_mtime_ns
    except OSError:
        return 0


def split_frontmatter(text: str) -> tuple[dict[str, str], str]:
    """Split a SKILL.md document into its frontmatter mapping and its body.

    Returns ({}, text) when the document has no parsable frontmatter block.
    """
    match = _FRONTMATTER_RE.match(text)
    if not match:
        return {}, text
    return _parse_block(match.group(1)), text[match.end():]


def _parse_frontmatter(text: str) -> dict[str, str]:
    return split_frontmatter(text)[0]


def _parse_block(block: str) -> dict[str, str]:
    if yaml is not None:
        try:
            data = yaml.safe_load(block)
        except Exception:
            data = None
        if isinstance(data, dict):
            return {str(key): str(value) for key, value in data.items() if value is not None}
    result: dict[str, str] = {}
    for line in block.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or ":" not in stripped:
            continue
        key, _, value = stripped.partition(":")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            result[key] = value
    return result


def _read_frontmatter(path: Path) -> dict[str, str]:
    try:
        text = _skill_md_path(path).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return {}
    return _parse_frontmatter(text)


def _read_summary_frontmatter(path: Path) -> dict[str, str]:
    """Read only a bounded frontmatter header for the catalog index."""
    try:
        with _skill_md_path(path).open("rb") as handle:
            header = handle.read(16 * 1024)
    except OSError:
        return {}
    return _parse_frontmatter(header.decode("utf-8", errors="replace"))


def _scan_source(source: str, root: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for dirname, path in _iter_skill_dirs(root):
        meta = _read_summary_frontmatter(path)
        name = meta.get("name") or dirname
        rows.append(
            {
                "id": f"{source}/{dirname}",
                "name": name,
                "description": meta.get("description", ""),
                "source": source,
                "path": str(path),
            }
        )
    return rows


def _source_roots() -> tuple[tuple[str, str, int], ...]:
    return tuple(sorted((source, str(root), _dir_mtime_ns(root)) for source, root in _sources().items()))


def _snapshot_sources() -> tuple[tuple[str, str, int, tuple[tuple[str, str, int], ...]], ...]:
    """Record source entries after a root change without recursing into skills."""
    rows: list[tuple[str, str, int, tuple[tuple[str, str, int], ...]]] = []
    for source, root in _sources().items():
        skills = tuple(
            (dirname, str(path), _dir_mtime_ns(_skill_md_path(path)))
            for dirname, path in _iter_skill_dirs(root)
        )
        rows.append((source, str(root), _dir_mtime_ns(root), skills))
    return tuple(sorted(rows))


def _fingerprint_sources() -> tuple[tuple[str, str, int, tuple[tuple[str, str, int], ...]], ...]:
    """Detect additions/deletions by source mtime and edits by SKILL.md mtime.

    Warm calls only stat source roots and known SKILL.md files.  This keeps
    runtime deploys visible on the next call without a recursive tree walk.
    """
    roots = _source_roots()
    cached = _INDEX_CACHE.get("sources")
    if not isinstance(cached, tuple) or tuple((source, path, mtime) for source, path, mtime, _ in cached) != roots:
        return _snapshot_sources()
    return tuple(
        (source, root, root_mtime, tuple(
            (dirname, path, _dir_mtime_ns(_skill_md_path(Path(path))))
            for dirname, path, _ in skills
        ))
        for source, root, root_mtime, skills in cached
    )


def _scan_all_sources() -> list[dict[str, Any]]:
    with _LOCK:
        now = time.monotonic()
        source_identities = _source_identities()
        if (
            _INDEX_CACHE.get("fingerprint") is not None
            and _INDEX_CACHE.get("source_identities") == source_identities
            and now < float(_INDEX_CACHE.get("fingerprint_expires", 0.0))
        ):
            return list(_INDEX_CACHE["entries"])

        fingerprint = _fingerprint_sources()
        expires = time.monotonic() + _FINGERPRINT_CACHE_TTL_SECONDS
        if _INDEX_CACHE["fingerprint"] == fingerprint:
            _INDEX_CACHE["fingerprint_expires"] = expires
            return list(_INDEX_CACHE["entries"])

        entries: list[dict[str, Any]] = []
        for source, root in _sources().items():
            entries.extend(_scan_source(source, root))

        _INDEX_CACHE.update({
            "fingerprint": fingerprint,
            "fingerprint_expires": expires,
            "entries": tuple(entries),
            "sources": fingerprint,
            "source_identities": source_identities,
            "revision": int(_INDEX_CACHE.get("revision", 0)) + 1,
        })
        return list(entries)


def list_skill_names() -> set[str]:
    """Return discovered skill names without collecting session-log telemetry."""
    return {str(entry["name"]) for entry in _scan_all_sources()}


# --------------------------------------------------------------------------
# Telemetry (best-effort, reuses the Claude session-log parser primitives
# already used by services/behavior.py — never modifies that module)
# --------------------------------------------------------------------------


def _parse_ts(value: Any) -> dt.datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.UTC)
    return parsed


def _skill_invocation_matches(invoked: str, name: str) -> bool:
    return invoked == name or invoked.endswith(f":{name}")


def _collect_skill_tool_events() -> list[dict[str, Any]]:
    """Single best-effort pass over Claude session logs for Skill-tool calls."""
    root = config.USAGE_SOURCES.get("claude")
    if not isinstance(root, Path) or not root.exists():
        return []

    events: list[dict[str, Any]] = []
    try:
        paths = list(root.glob("*/*.jsonl"))
    except OSError:
        return []

    for path in paths:
        try:
            for obj in replay._iter_jsonl(path):
                if obj.get("type") != "assistant":
                    continue
                message = obj.get("message") if isinstance(obj.get("message"), dict) else {}
                for block in replay._blocks(message.get("content")):
                    if not isinstance(block, dict) or block.get("type") != "tool_use":
                        continue
                    if block.get("name") != _SKILL_TOOL_NAME:
                        continue
                    input_data = block.get("input")
                    invoked = input_data.get("skill") if isinstance(input_data, dict) else None
                    if isinstance(invoked, str) and invoked:
                        events.append(
                            {"skill": invoked, "ts": replay.normalize_ts(obj.get("timestamp"), path)}
                        )
        except OSError:
            continue
    return events


def _telemetry_fingerprint() -> tuple[tuple[str, int, int], ...]:
    root = config.USAGE_SOURCES.get("claude")
    if not isinstance(root, Path) or not root.exists():
        return ()
    try:
        paths = root.glob("*/*.jsonl")
        return tuple(sorted((str(path), _dir_mtime_ns(path), path.stat().st_size) for path in paths))
    except OSError:
        return ()


def _safe_collect_skill_tool_events() -> list[dict[str, Any]]:
    try:
        with _TELEMETRY_LOCK:
            now = time.monotonic()
            if _TELEMETRY_CACHE["expires"] > now:
                return list(_TELEMETRY_CACHE["events"])
            fingerprint = _telemetry_fingerprint()
            if _TELEMETRY_CACHE["fingerprint"] == fingerprint:
                _TELEMETRY_CACHE["expires"] = now + _TELEMETRY_CACHE_TTL_SECONDS
                return list(_TELEMETRY_CACHE["events"])
            events = _collect_skill_tool_events()
            _TELEMETRY_CACHE.update({
                "expires": now + _TELEMETRY_CACHE_TTL_SECONDS,
                "fingerprint": fingerprint,
                "events": events,
            })
            return list(events)
    except Exception:
        return []


def _telemetry(name: str, tool_events: list[dict[str, Any]]) -> tuple[str | None, int | None]:
    matches = [event for event in tool_events if _skill_invocation_matches(event["skill"], name)]
    if not matches:
        return None, None
    timestamps: list[tuple[str, dt.datetime]] = []
    for event in matches:
        parsed = _parse_ts(event["ts"])
        if parsed is not None:
            timestamps.append((event["ts"], parsed))
    if not timestamps:
        return None, None
    cutoff = dt.datetime.now(dt.UTC) - dt.timedelta(days=_TELEMETRY_WINDOW_DAYS)
    use_count_30d = sum(1 for _raw, parsed in timestamps if parsed >= cutoff)
    return max(timestamps, key=lambda timestamp: timestamp[1])[0], use_count_30d


# --------------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------------


def list_skills() -> list[dict[str, Any]]:
    raw_entries = _scan_all_sources()

    by_name: dict[str, set[str]] = {}
    for entry in raw_entries:
        by_name.setdefault(entry["name"], set()).add(entry["source"])

    tool_events = _safe_collect_skill_tool_events()

    results: list[dict[str, Any]] = []
    for entry in raw_entries:
        last_used, use_count_30d = _telemetry(entry["name"], tool_events)
        content_hash = _content_hash(Path(str(entry["path"])))
        results.append(
            {
                "id": entry["id"],
                "name": entry["name"],
                "description": entry["description"],
                "source": entry["source"],
                "path": entry["path"],
                "content_hash": content_hash,
                "coverage": sorted(by_name[entry["name"]]),
                "last_used": last_used,
                "use_count_30d": use_count_30d,
            }
        )

    results.sort(key=lambda item: (str(item["name"]), str(item["source"])))
    return results


def list_skill_summary(
    *, query: str = "", source: str | None = None, offset: int = 0, limit: int = 100
) -> dict[str, Any]:
    """Return the public, metadata-only snapshot used for the first catalog table."""
    rows = _scan_all_sources()
    variants_count: dict[str, int] = {}
    for row in rows:
        name = str(row["name"])
        variants_count[name] = variants_count.get(name, 0) + 1
    needle = query.strip().lower()
    if source:
        rows = [row for row in rows if row["source"] == source]
    if needle:
        rows = [
            row for row in rows
            if (
                needle in str(row["name"]).lower()
                or needle in str(row["description"]).lower()
                or needle in str(row["source"]).lower()
            )
        ]
    rows.sort(key=lambda row: (str(row["name"]), str(row["source"])))
    items = [
        {
            **{key: row[key] for key in ("id", "name", "description", "source")},
            "variants_count": variants_count[str(row["name"])],
        }
        for row in rows[offset:offset + limit]
    ]
    return {
        "items": items,
        "total": len(rows),
        "offset": offset,
        "limit": limit,
        "revision": int(_INDEX_CACHE.get("revision", 0)),
        "status": "ready",
    }


def list_skill_telemetry() -> dict[str, Any]:
    """Return bulk cached telemetry for indexed logical skill names only."""
    names = sorted({str(entry["name"]) for entry in _scan_all_sources()})
    tool_events = _safe_collect_skill_tool_events()
    items = []
    for name in names:
        last_used, use_count_30d = _telemetry(name, tool_events)
        if last_used is not None:
            items.append({"name": name, "last_used": last_used, "use_count_30d": use_count_30d})
    return {"status": "ready", "items": items}


def _latest_baseline_hashes() -> dict[tuple[str, str], str]:
    """Return newest valid deploy baselines keyed by exact source variant and target."""
    lines = _read_deploy_log_lines()
    baselines: dict[tuple[str, str], str] = {}
    for line in reversed(lines):
        try:
            record = json.loads(line)
        except (json.JSONDecodeError, TypeError):
            continue
        baseline_hash = record.get("baseline_hash_after") if isinstance(record, dict) else None
        if (
            isinstance(record, dict)
            and isinstance(record.get("skill_id"), str)
            and isinstance(record.get("target"), str)
            and isinstance(baseline_hash, str)
            and _CONTENT_HASH.fullmatch(baseline_hash)
        ):
            baselines.setdefault((record["skill_id"], record["target"]), baseline_hash)
    return baselines


def _target_status_for_entry(
    entry: dict[str, Any],
    target: str,
    target_variants: dict[tuple[str, str], dict[str, Any]],
    baseline_hashes: dict[tuple[str, str], str],
    *,
    source_hash: str | None = None,
    target_hash: str | None = None,
    target_entry: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return the public comparison record for one exact namespaced source entry."""
    source = str(entry["source"])
    name = str(entry["name"])
    resolved_target = target_entry if target_entry is not None else target_variants.get((target, name))
    resolved_source_hash = source_hash if source_hash is not None else _content_hash(Path(str(entry["path"])))
    resolved_target_hash = target_hash
    if resolved_target_hash is None and resolved_target is not None:
        resolved_target_hash = _content_hash(Path(str(resolved_target["path"])))
    baseline_hash = baseline_hashes.get((str(entry["id"]), target))
    source_changed = bool(baseline_hash and resolved_source_hash != baseline_hash)
    target_changed = bool(baseline_hash and resolved_target_hash != baseline_hash)

    if source == target:
        status = "in_sync"
    elif resolved_target is None:
        status = "missing"
    elif resolved_source_hash == resolved_target_hash:
        status = "in_sync"
    elif baseline_hash and source_changed and target_changed:
        status = "conflict"
    else:
        status = "modified"

    return {
        "skill_id": entry["id"],
        "name": name,
        "source": source,
        "target": target,
        "target_skill_id": resolved_target["id"] if resolved_target else None,
        "status": status,
        "source_hash": resolved_source_hash,
        "target_hash": resolved_target_hash,
        "baseline_hash": baseline_hash,
        "source_changed": source_changed,
        "target_changed": target_changed,
    }


def target_status(target: str) -> dict[str, Any]:
    """Compare every namespaced skill variant against one registered target source."""
    if target not in _sources():
        raise ValueError("Unknown target")

    entries = _scan_all_sources()
    target_variants: dict[tuple[str, str], dict[str, Any]] = {}
    for entry in entries:
        target_variants.setdefault((str(entry["source"]), str(entry["name"])), entry)
    baseline_hashes = _latest_baseline_hashes()
    items: list[dict[str, Any]] = []
    for entry in entries:
        items.append(_target_status_for_entry(entry, target, target_variants, baseline_hashes))
    items.sort(key=lambda item: (str(item["name"]), str(item["source"])))
    return {"target": target, "items": items}


def list_skill_descriptors() -> list[dict[str, Any]]:
    """Return cached discovery descriptors without telemetry or prompt content."""
    return [dict(entry) for entry in _scan_all_sources()]


def list_skill_inventory_metadata() -> list[dict[str, Any]]:
    """Discover skill identities and sizes without reading SKILL.md content."""
    rows: list[dict[str, Any]] = []
    for source, root in _sources().items():
        for dirname, path in _iter_skill_dirs(root):
            skill_md = _skill_md_path(path)
            try:
                stat = skill_md.stat()
            except OSError:
                continue
            rows.append({
                "id": f"{source}/{dirname}", "name": dirname, "source": source,
                "path": str(path), "prompt_chars": stat.st_size,
                "modified_ns": stat.st_mtime_ns,
            })
    return rows


def skill_content_descriptor(skill_id: str) -> dict[str, str]:
    """Compute strong content metadata for one already-selected skill only."""
    entry = next((row for row in list_skill_inventory_metadata() if row["id"] == skill_id), None)
    if entry is None:
        raise FileNotFoundError(f"Skill not found: {skill_id}")
    path = Path(str(entry["path"]))
    meta = _read_frontmatter(path)
    return {"description": meta.get("description", ""), "content_hash": _content_hash(path)}


def get_skill(skill_id: str) -> dict[str, Any]:
    entry = next((row for row in _scan_all_sources() if row["id"] == skill_id), None)
    if entry is None:
        raise FileNotFoundError(f"Skill not found: {skill_id}")

    path = Path(entry["path"])
    try:
        content = _skill_md_path(path).read_text(encoding="utf-8", errors="replace")
    except OSError:
        content = ""

    files = sorted(
        file_path.relative_to(path).as_posix() if path.is_dir() else file_path.name
        for file_path in _skill_files(path)
    )

    return {
        "id": entry["id"],
        "name": entry["name"],
        "description": entry["description"],
        "source": entry["source"],
        "path": entry["path"],
        "content_hash": _content_hash(path),
        "content": content,
        "files": files,
    }


def read_skill_content(skill_name: str) -> str:
    """Read SKILL.md for a validated skill name without accepting a raw path."""
    for source, root in _sources().items():
        for dirname, path in _iter_skill_dirs(root):
            name = _read_frontmatter(path).get("name") or dirname
            if name != skill_name:
                continue
            try:
                return _skill_md_path(path).read_text(encoding="utf-8", errors="replace")
            except OSError as exc:
                raise FileNotFoundError(f"Skill not readable: {skill_name}") from exc
    raise FileNotFoundError(f"Skill not found: {skill_name}")


def pin_skill_prompt_contents(skill_names: list[str]) -> list[dict[str, str]]:
    """Resolve skills once, retaining their identity and exact prompt text for a run."""
    pins: list[dict[str, str]] = []
    for name in skill_names:
        entry = next((row for row in _scan_all_sources() if row["name"] == name), None)
        if entry is None:
            raise FileNotFoundError(f"Skill not found: {name}")
        try:
            content = _skill_md_path(Path(entry["path"])).read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            raise FileNotFoundError(f"Skill not readable: {name}") from exc
        pins.append({"source": str(entry["source"]), "name": name, "content_hash": _content_hash(Path(str(entry["path"]))), "content": content})
    return pins


def load_pinned_skill_prompt_contents(skill_pins: list[dict[str, Any]]) -> tuple[list[str], bool]:
    """Validate pinned identity against the live resolver, then return pinned text.

    A changed hash or a higher-priority same-name source is an execution error:
    using either live variant would make a run unreproducible.
    """
    entries = _scan_all_sources()
    contents: list[str] = []
    used = 0
    truncated = False
    for pin in skill_pins:
        name = str(pin.get("name") or "")
        resolved = next((row for row in entries if row["name"] == name), None)
        if resolved is None:
            raise ValueError(f"Pinned skill missing: {name}")
        if resolved["source"] != pin.get("source"):
            raise ValueError(f"Pinned skill source drift: {name}")
        if _content_hash(Path(str(resolved["path"]))) != pin.get("content_hash"):
            raise ValueError(f"Pinned skill content drift: {name}")
        content = pin.get("content")
        if not isinstance(content, str):
            raise ValueError(f"Pinned skill content missing: {name}")
        remaining = SKILL_PROMPT_MAX_CHARS - used
        if remaining <= 0:
            truncated = True
            break
        if len(content) > remaining:
            contents.append(content[:remaining])
            truncated = True
            break
        contents.append(content)
        used += len(content)
    return contents, truncated


def load_skill_prompt_contents(
    skill_names: list[str], *, skip_missing: bool = False
) -> tuple[list[str], bool, list[str]]:
    """Load skill instructions within the shared prompt budget.

    Missing skills are returned for callers that can safely continue with a
    stale profile reference. Interactive chat keeps its existing strict
    validation before calling this helper.
    """
    contents: list[str] = []
    missing: list[str] = []
    used = 0
    truncated = False
    for name in skill_names:
        try:
            content = read_skill_content(name)
        except FileNotFoundError:
            if not skip_missing:
                raise
            missing.append(name)
            continue
        remaining = SKILL_PROMPT_MAX_CHARS - used
        if remaining <= 0:
            truncated = True
            break
        if len(content) > remaining:
            contents.append(content[:remaining])
            truncated = True
            break
        contents.append(content)
        used += len(content)
    return contents, truncated, missing


def system_prompt_with_skills(system_prompt: str | None, contents: list[str]) -> str | None:
    """Append activated skill instructions in the common chat/workflow format."""
    if not contents:
        return system_prompt
    skills_prompt = "\n\n[Activated skills]\n" + "\n\n---\n\n".join(contents)
    return f"{system_prompt}{skills_prompt}" if system_prompt else skills_prompt.removeprefix("\n\n")


def drift() -> list[dict[str, Any]]:
    by_name: dict[str, list[dict[str, Any]]] = {}
    for entry in _scan_all_sources():
        by_name.setdefault(entry["name"], []).append(entry)

    results: list[dict[str, Any]] = []
    for name, group in by_name.items():
        variants: list[dict[str, Any]] = []
        for entry in sorted(group, key=lambda row: row["source"]):
            mtime_ns = _dir_mtime_ns(Path(entry["path"]))
            mtime = dt.datetime.fromtimestamp(mtime_ns / 1e9, tz=dt.UTC).isoformat() if mtime_ns else None
            variants.append(
                {
                    "id": entry["id"],
                    "source": entry["source"],
                    "path": entry["path"],
                    "content_hash": _content_hash(Path(str(entry["path"]))),
                    "mtime": mtime,
                }
            )
        hashes = {variant["content_hash"] for variant in variants}
        results.append({"name": name, "variants": variants, "in_sync": len(hashes) <= 1})

    results.sort(key=lambda item: (item["in_sync"], str(item["name"])))
    return results


def deploy_log(limit: int = 50) -> list[dict[str, Any]]:
    if limit <= 0:
        return []

    lines = _read_deploy_log_lines()

    rows: list[dict[str, Any]] = []
    for line in reversed(lines):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except (json.JSONDecodeError, TypeError):
            continue
        if isinstance(row, dict):
            rows.append(row)
        if len(rows) >= limit:
            break
    return rows


def _read_deploy_log_lines() -> list[str]:
    """Read a complete evidence snapshot; never parse a writer's partial record."""
    log_path = _deploy_log_path()
    try:
        with _filesystem_evidence_lock(log_path):
            try:
                return log_path.read_text(encoding="utf-8").splitlines()
            except FileNotFoundError:
                return []
    except OSError:
        return []


def deploy(
    skill_id: str,
    target: str,
    *,
    expected_target_hash: str | None | object = _EXPECTED_TARGET_HASH_UNSET,
    allow_conflict: bool = False,
) -> dict[str, Any]:
    sources = _sources()
    if target not in sources:
        raise ValueError(f"Unknown deploy target: {target}")

    entry = next((row for row in _scan_all_sources() if row["id"] == skill_id), None)
    if entry is None:
        raise FileNotFoundError(f"Skill not found: {skill_id}")
    if str(entry["source"]) == target:
        raise ValueError("Cannot deploy a skill to its own source")

    source_path = Path(entry["path"])
    target_root = sources[target]
    dest_path = target_root / source_path.name

    with _destination_lock(dest_path):
        with _filesystem_destination_lock(dest_path):
            source_hash = _content_hash(source_path)
            target_hash_before = _content_hash(dest_path) if dest_path.exists() else None
            entries = _scan_all_sources()
            target_variants: dict[tuple[str, str], dict[str, Any]] = {}
            for candidate in entries:
                target_variants.setdefault((str(candidate["source"]), str(candidate["name"])), candidate)
            current_target_entry = target_variants.get((target, str(entry["name"])))
            if dest_path.exists() and current_target_entry is None:
                current_target_entry = {"id": f"{target}/{source_path.name}", "path": str(dest_path)}
            comparison = _target_status_for_entry(
                entry,
                target,
                target_variants,
                _latest_baseline_hashes(),
                source_hash=source_hash,
                target_hash=target_hash_before,
                target_entry=current_target_entry,
            )
            if expected_target_hash is not _EXPECTED_TARGET_HASH_UNSET and expected_target_hash != target_hash_before:
                raise SkillPreconditionError("Target changed since comparison")
            if comparison["status"] == "conflict" and not allow_conflict:
                raise SkillConflictError("Conflict requires review")

            staging_path = _staging_path(dest_path)
            backup_path: Path | None = None
            published = False
            published_hash = source_hash
            baseline_hash_after: str | None = None
            try:
                _copy_to_staging(source_path, staging_path)
                if _content_hash(staging_path) != source_hash or _content_hash(source_path) != source_hash:
                    raise SkillPreconditionError("Source changed during deployment")

                if target_hash_before is not None:
                    backup_path = _backup_path(dest_path)
                    try:
                        _backup_target_atomically(dest_path, backup_path)
                    except FileNotFoundError as exc:
                        raise SkillPreconditionError("Target changed since comparison") from exc
                    if _content_hash(backup_path) != target_hash_before:
                        _rollback_deployment_target(dest_path, backup_path, published, published_hash)
                        raise SkillPreconditionError("Target changed since comparison")
                elif dest_path.exists():
                    raise SkillPreconditionError("Target changed since comparison")

                try:
                    _publish_staging_atomically(staging_path, dest_path)
                except FileExistsError as exc:
                    raise SkillPreconditionError("Target changed since comparison") from exc
                published = True
                baseline_hash_after = _content_hash(dest_path)
                if baseline_hash_after != source_hash or _content_hash(source_path) != source_hash:
                    raise SkillPreconditionError("Source changed during deployment")
            except Exception:
                _rollback_deployment_target(dest_path, backup_path, published, published_hash)
                raise
            finally:
                _remove_path(staging_path)

            try:
                _append_deploy_log(
                    skill_id,
                    target,
                    str(dest_path),
                    source_hash=source_hash,
                    target_hash_before=target_hash_before,
                    baseline_hash_after=baseline_hash_after,
                )
            except (OSError, SkillEvidenceError) as exc:
                _rollback_deployment_target(dest_path, backup_path, published, published_hash)
                raise SkillEvidenceError("Deployment evidence could not be recorded") from exc

            _clear_cache()
            return {
                "ok": True,
                "target": target,
                "path": str(dest_path),
                "status": "in_sync",
                "source_hash": source_hash,
                "target_hash_before": target_hash_before,
                "baseline_hash_after": baseline_hash_after,
            }


def _staging_path(dest_path: Path) -> Path:
    return dest_path.parent / f".{dest_path.name}.staging-{os.getpid()}-{uuid.uuid4().hex}"


def _backup_path(dest_path: Path) -> Path:
    timestamp = time.strftime("%Y%m%dT%H%M%S")
    backup_path = dest_path.parent / f"{dest_path.name}.bak-{timestamp}"
    suffix = 1
    while backup_path.exists():
        backup_path = dest_path.parent / f"{dest_path.name}.bak-{timestamp}-{suffix}"
        suffix += 1
    return backup_path


def _copy_to_staging(source_path: Path, staging_path: Path) -> None:
    if source_path.is_dir():
        shutil.copytree(source_path, staging_path)
    else:
        shutil.copy2(source_path, staging_path)


def _backup_target_atomically(dest_path: Path, backup_path: Path) -> None:
    dest_path.replace(backup_path)


def _publish_staging_atomically(staging_path: Path, dest_path: Path) -> None:
    os.rename(staging_path, dest_path)


def _remove_path(path: Path) -> None:
    if not path.exists():
        return
    if path.is_dir():
        shutil.rmtree(path)
    else:
        path.unlink()


def _rollback_deployment_target(
    dest_path: Path,
    backup_path: Path | None,
    published: bool,
    transaction_hash: str | None,
) -> None:
    """Restore our verified backup without overwriting content created by another writer."""
    try:
        destination_is_ours = bool(
            published and transaction_hash and dest_path.exists() and _content_hash(dest_path) == transaction_hash
        )
        if backup_path is not None and backup_path.exists():
            if dest_path.exists() and destination_is_ours:
                _remove_path(dest_path)
            if not dest_path.exists():
                backup_path.replace(dest_path)
        elif destination_is_ours:
            _remove_path(dest_path)
    finally:
        _clear_cache()


def _fsync_parent_directory(path: Path) -> None:
    """Best-effort directory sync for an atomic evidence-file replacement."""
    if os.name == "nt":
        return
    flags = os.O_RDONLY | getattr(os, "O_DIRECTORY", 0)
    try:  # pragma: no cover - Windows is the supported Hub runtime
        directory_fd = os.open(path.parent, flags)
    except OSError:
        return
    try:  # pragma: no cover - Windows is the supported Hub runtime
        os.fsync(directory_fd)
    except OSError:
        pass
    finally:  # pragma: no cover - Windows is the supported Hub runtime
        os.close(directory_fd)


def _append_deploy_log(
    skill_id: str,
    target: str,
    dest_path: str,
    *,
    source_hash: str,
    target_hash_before: str | None,
    baseline_hash_after: str,
) -> None:
    log_path = _deploy_log_path()
    record = {
        "ts": dt.datetime.now(dt.UTC).isoformat(),
        "skill_id": skill_id,
        "target": target,
        "path": dest_path,
        "source_hash": source_hash,
        "target_hash_before": target_hash_before,
        "baseline_hash_after": baseline_hash_after,
    }
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with _filesystem_evidence_lock(log_path):
        try:
            existing_bytes = log_path.read_bytes()
            existing_mode = log_path.stat().st_mode & 0o777
        except FileNotFoundError:
            existing_bytes = b""
            existing_mode = None

        record_bytes = (json.dumps(record, sort_keys=True) + "\n").encode("utf-8")
        separator = b"" if not existing_bytes or existing_bytes.endswith(b"\n") else b"\n"
        staging_path = log_path.parent / f".{log_path.name}.staging-{os.getpid()}-{uuid.uuid4().hex}"
        try:
            with staging_path.open("xb") as handle:
                handle.write(existing_bytes)
                handle.write(separator)
                handle.write(record_bytes)
                handle.flush()
                os.fsync(handle.fileno())
            if existing_mode is not None:
                os.chmod(staging_path, existing_mode)
            os.replace(staging_path, log_path)
            _fsync_parent_directory(log_path)
        finally:
            _remove_path(staging_path)
