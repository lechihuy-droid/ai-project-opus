"""Research audit for Consilium's three-lane intake.

The audit is intentionally deterministic and conservative. It does not call an
LLM; it scores raw articles and wiki pages against the current research lanes,
then proposes or applies safe bookkeeping actions.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Iterable

from utils.config import personal_wiki_dir, raw_dir


TODAY = date.today().isoformat()
AUDIT_VERSION = "2026-05-30-three-lane-v1"

EXCLUDED_WIKI_FILES = {"SCHEMA.md", "INDEX.md", "log.md", "WIKI_HEALTH.md", "processed.txt"}
ACTIVE_TOPICS = {"AI", "Stock", "Personal", "Tech", "Research", "Business", "FDE"}
RAW_ARCHIVE_ROOT = Path("raw/archive/rejected")
WIKI_ARCHIVE_ROOT = Path("personal-wiki/_archive/rejected")

LANES = {
    "tech": {
        "label": "Tech Learning Research",
        "target_hubs": ["ai-trend-radar", "reskill-roadmap", "fde-adoption-radar"],
        "source_ids": {
            "openai-news", "anthropic-blog", "google-ai-blog", "aws-ml-blog", "nvidia-blog",
            "simon-willison", "hf-blog", "import-ai", "interconnects", "the-gradient",
            "arxiv-ai", "arxiv-lg", "hf-papers", "github-trending-ai",
        },
        "topics": {"AI", "Tech", "FDE"},
        "keywords": {
            "agent", "agents", "coding", "codex", "claude code", "workflow", "automation",
            "eval", "evaluation", "observability", "benchmark", "tool use", "tool-use",
            "sandbox", "memory", "context", "retrieval", "rag", "inference", "llm",
            "developer", "github", "repo", "open source", "model", "transformer",
        },
        "suppress": {"generic ai news", "minor paper", "pure technical interest"},
    },
    "ceo": {
        "label": "CEO Business Model Research",
        "target_hubs": [
            "competitor-business-model-radar", "fde-adoption-radar", "fde-model",
            "investment-theses", "open-questions",
        ],
        "source_ids": {
            "openai-news", "anthropic-blog", "google-ai-blog", "aws-ml-blog", "nvidia-blog",
            "techcrunch-ai", "venturebeat-ai", "nikkei-asia", "everest-group", "hfs-research",
        },
        "topics": {"AI", "Stock", "Business", "FDE", "JP_STOCK"},
        "keywords": {
            "budget", "pricing", "revenue", "bookings", "customer", "enterprise",
            "adoption", "roi", "market", "strategy", "offer", "product strategy",
            "regulation", "governance", "funding", "acquisition", "partnership",
            "vertical", "manufacturing", "finance", "public sector", "operating model",
            "investment", "capital", "japan", "sier", "outsourcing",
        },
        "suppress": {"pure technical detail", "no business implication"},
    },
    "competitor": {
        "label": "Competitor Intelligence Research",
        "target_hubs": [
            "competitor-business-model-radar", "fde-adoption-radar",
            "fde-japan-gap-analysis", "investment-theses",
        ],
        "source_ids": {
            "microsoft-official-blog", "microsoft-azure-blog", "itmedia-enterprise",
            "enterprisezine", "zdnet-japan", "monoist", "prtimes-it",
            "everest-group", "hfs-research",
        },
        "topics": {"COMPETITOR", "Business", "FDE"},
        "keywords": {
            "microsoft", "fujitsu", "ntt data", "ntt", "hitachi", "accenture",
            "capgemini", "ibm", "nec", "tis", "scsk", "nri", "sier",
            "consulting", "vendor", "competitor", "ai-sdlc", "sdlc", "legacy",
            "modernization", "cobol", "partnership", "alliance", "sovereign",
            "on-prem", "managed service", "delivery model", "roi", "bookings",
        },
        "suppress": {"vague ai hype"},
    },
}

PROMOTE_THRESHOLD = 10
INGEST_THRESHOLD = 10
DEPRIORITIZE_THRESHOLD = 5

KNOWN_REPEAT_SIGNALS = {
    "coding agents are increasing",
    "agent-first tooling is accelerating",
    "enterprise ai needs governance",
    "ai coding requires governance",
    "vibe coding creates quality risk",
    "skill-first remains necessary",
}


@dataclass
class AuditItem:
    item_type: str
    path: str
    title: str
    status: str
    topic: str
    source_id: str
    processed: bool
    referenced: bool
    orphan: bool
    stale: bool
    source_seed: bool
    lane_scores: dict[str, int]
    primary_lane: str
    decision: str
    reason: str
    target_hub: str
    action: str
    archive_path: str


def _repo_root() -> Path:
    return personal_wiki_dir().parent.resolve()


def _rel(path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(_repo_root()).as_posix()
    except ValueError:
        return str(resolved)


def _manifest_path(path: Path) -> str:
    return _rel(path)


def _resolve_manifest_path(path_text: str) -> Path:
    path = Path(path_text)
    return path if path.is_absolute() else _repo_root() / path


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def _parse_frontmatter(text: str) -> dict[str, str]:
    match = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return {}
    result: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            result[key.strip()] = value.strip().strip('"')
    return result


def _parse_raw_metadata(text: str) -> dict[str, str]:
    meta: dict[str, str] = {}
    title_match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    if title_match:
        meta["title"] = title_match.group(1).strip()
    for key in ("Source", "URL", "Published", "Topic", "Tier", "Source-Kind", "Goal-Score", "Relevance"):
        match = re.search(rf"^\*\*{re.escape(key)}:\*\*\s*(.+)$", text, re.MULTILINE)
        if match:
            meta[key.lower().replace("-", "_")] = match.group(1).strip()
    return meta


def _extract_wikilinks(text: str) -> list[str]:
    links = []
    for raw in re.findall(r"\[\[([^\]]+)\]\]", text):
        target = raw.split("|", 1)[0].split("#", 1)[0].strip().lower()
        if target:
            links.append(target)
    return links


@lru_cache(maxsize=8)
def _hub_links(hub_stem: str) -> set[str]:
    for page in _wiki_pages():
        if page.stem == hub_stem:
            return set(_extract_wikilinks(_read(page)))
    return set()


def _wiki_pages() -> list[Path]:
    wiki = personal_wiki_dir()
    return [
        p for p in sorted(wiki.rglob("*.md"))
        if p.name not in EXCLUDED_WIKI_FILES and "_archive" not in p.parts
    ]


def _inbound_stems(pages: Iterable[Path]) -> set[str]:
    inbound: set[str] = set()
    for page in pages:
        inbound.update(_extract_wikilinks(_read(page)))
    return inbound


def _processed_files() -> set[str]:
    path = personal_wiki_dir() / "processed.txt"
    if not path.exists():
        return set()
    processed = set()
    for line in _read(path).splitlines():
        line = line.strip()
        if not line:
            continue
        processed.add(line.split("#", 1)[0].strip())
    return processed


def _referenced_raw_files(pages: Iterable[Path]) -> set[str]:
    refs: set[str] = set()
    for page in pages:
        text = _read(page)
        for match in re.findall(r"raw/articles/([^\s`\"')|]+\.md)", text):
            refs.add(match.strip())
    return refs


def _token_hits(text: str, keywords: set[str]) -> int:
    lowered = text.lower()
    return sum(1 for kw in keywords if kw in lowered)


def _score_lanes(text: str, topic: str = "", source_id: str = "", source_kind: str = "", tags: str = "") -> dict[str, int]:
    haystack = f"{text}\n{topic}\n{source_id}\n{source_kind}\n{tags}".lower()
    scores: dict[str, int] = {}
    for lane_key, lane in LANES.items():
        score = 0
        if source_id and source_id in lane["source_ids"]:
            score += 2
        if topic and topic in lane["topics"]:
            score += 1
        if source_kind == "market_news" and lane_key in {"ceo", "competitor"}:
            score += 1
        score += min(_token_hits(haystack, lane["keywords"]), 8)
        if any(signal in haystack for signal in KNOWN_REPEAT_SIGNALS):
            score -= 2
        if source_id in {"arxiv-ai", "arxiv-lg", "hf-papers"} and lane_key == "tech":
            practical = {"workflow", "coding", "agent", "eval", "benchmark", "tool", "retrieval", "inference"}
            if _token_hits(haystack, practical) < 2:
                score -= 3
        scores[lane_key] = max(score, 0)
    return scores


def _primary_lane(scores: dict[str, int]) -> str:
    lane, score = max(scores.items(), key=lambda item: item[1])
    return lane if score >= DEPRIORITIZE_THRESHOLD else ""


def _target_hub(primary_lane: str, scores: dict[str, int]) -> str:
    if not primary_lane:
        return ""
    if primary_lane == "tech" and scores["competitor"] >= PROMOTE_THRESHOLD:
        return "competitor-business-model-radar"
    return LANES[primary_lane]["target_hubs"][0]


def _is_stale(fm: dict[str, str], days: int = 30) -> bool:
    updated = fm.get("updated", "")
    if not updated:
        return True
    try:
        return datetime.strptime(updated[:10], "%Y-%m-%d") < datetime.now() - timedelta(days=days)
    except ValueError:
        return True


def _wiki_item(page: Path, inbound: set[str], referenced_raw: set[str]) -> AuditItem:
    wiki = personal_wiki_dir()
    text = _read(page)
    fm = _parse_frontmatter(text)
    rel = _rel(page)
    topic = fm.get("topic") or (page.relative_to(wiki).parts[0] if len(page.relative_to(wiki).parts) > 1 else "root")
    tags = fm.get("tags", "")
    source_id = ""
    raw_sources = re.findall(r"raw/articles/([^\s`\"')|]+\.md)", text)
    if raw_sources:
        source_id_match = re.search(r"tags:\s*\[([^\]]+)\]", text)
        source_id = source_id_match.group(1).split(",")[-1].strip() if source_id_match else ""
    scores = _score_lanes(text, topic=topic, source_id=source_id, tags=tags)
    primary = _primary_lane(scores)
    status = fm.get("status", "")
    source_seed = "source-seed" in tags.lower()
    orphan = page.stem.lower() not in inbound
    stale = _is_stale(fm)
    title = fm.get("title", page.stem)
    target = _target_hub(primary, scores)
    top_score = max(scores.values()) if scores else 0
    already_promoted = (
        "promoted into [[" in text.lower()
        or "promoted to [[" in text.lower()
        or page.stem.lower() in _hub_links("ai-trend-radar")
        or page.stem.lower() in _hub_links("competitor-business-model-radar")
        or page.stem.lower() in _hub_links("fde-adoption-radar")
    )

    if status == "evergreen":
        if top_score < DEPRIORITIZE_THRESHOLD:
            decision = "deprioritize"
            reason = "evergreen page has weak match to current three-lane rubric; keep active but review"
            action = "mark-needs-review"
        else:
            decision = "keep"
            reason = "evergreen page still maps to an active research lane"
            action = "none"
    elif source_seed and already_promoted:
        decision = "keep"
        reason = "source-seed has already been promoted into a hub and is retained as evidence"
        action = "none"
    elif not status:
        decision = "deprioritize"
        reason = "missing status; mark needs-review before any archive decision"
        action = "mark-needs-review"
    elif source_seed and orphan and top_score < DEPRIORITIZE_THRESHOLD:
        decision = "archive"
        reason = "orphan source-seed with weak three-lane score"
        action = "archive-wiki-page"
    elif source_seed and orphan and top_score < PROMOTE_THRESHOLD:
        decision = "deprioritize"
        reason = "orphan source-seed has some lane signal but not enough for promotion"
        action = "mark-needs-review"
    elif status == "seed" and stale and top_score < DEPRIORITIZE_THRESHOLD and orphan:
        decision = "archive"
        reason = "stale orphan seed with weak three-lane score"
        action = "archive-wiki-page"
    elif status == "seed" and stale:
        decision = "deprioritize"
        reason = "stale seed still has lane signal or inbound links; mark needs-review"
        action = "mark-needs-review"
    elif top_score >= PROMOTE_THRESHOLD and source_seed:
        decision = "promote"
        reason = "source-seed has enough lane signal to be synthesized into a hub"
        action = "queue-promotion"
    else:
        decision = "keep"
        reason = "active page has acceptable lane fit or is not safe to archive automatically"
        action = "none"

    archive_path = ""
    if action == "archive-wiki-page":
        archive_path = (WIKI_ARCHIVE_ROOT / TODAY / page.relative_to(wiki)).as_posix()

    referenced = any(raw in referenced_raw for raw in raw_sources)
    return AuditItem(
        item_type="wiki",
        path=rel,
        title=title,
        status=status,
        topic=topic,
        source_id=source_id,
        processed=False,
        referenced=referenced,
        orphan=orphan,
        stale=stale,
        source_seed=source_seed,
        lane_scores=scores,
        primary_lane=primary,
        decision=decision,
        reason=reason,
        target_hub=target,
        action=action,
        archive_path=archive_path,
    )


def _raw_item(path: Path, processed: set[str], referenced_raw: set[str]) -> AuditItem:
    text = _read(path)
    meta = _parse_raw_metadata(text)
    source_id = meta.get("source", "")
    topic = meta.get("topic", "")
    source_kind = meta.get("source_kind", "")
    scores = _score_lanes(text, topic=topic, source_id=source_id, source_kind=source_kind)
    primary = _primary_lane(scores)
    top_score = max(scores.values()) if scores else 0
    is_processed = path.name in processed
    is_referenced = path.name in referenced_raw
    target = _target_hub(primary, scores)

    if is_referenced:
        decision = "keep"
        reason = "raw file is cited by an active wiki page"
        action = "none"
    elif is_processed:
        decision = "deprioritize"
        reason = "raw file is processed but not cited by active wiki; keep as evidence unless manually pruned"
        action = "none"
    elif top_score >= INGEST_THRESHOLD:
        decision = "ingest"
        reason = "unprocessed raw has strong lane fit and a clear target hub"
        action = "queue-ingest"
    elif top_score >= DEPRIORITIZE_THRESHOLD:
        decision = "deprioritize"
        reason = "unprocessed raw has weak or watchlist lane fit"
        action = "mark-processed-low-priority"
    else:
        decision = "archive"
        reason = "unprocessed raw has weak fit to all three research lanes"
        action = "archive-raw"

    archive_path = ""
    if action == "archive-raw":
        archive_path = _manifest_path(raw_dir() / "archive" / "rejected" / TODAY / path.name)

    return AuditItem(
        item_type="raw",
        path=_rel(path),
        title=meta.get("title", path.stem),
        status="processed" if is_processed else "unprocessed",
        topic=topic,
        source_id=source_id,
        processed=is_processed,
        referenced=is_referenced,
        orphan=False,
        stale=False,
        source_seed=False,
        lane_scores=scores,
        primary_lane=primary,
        decision=decision,
        reason=reason,
        target_hub=target,
        action=action,
        archive_path=archive_path,
    )


def collect_audit_items() -> list[AuditItem]:
    pages = _wiki_pages()
    inbound = _inbound_stems(pages)
    referenced_raw = _referenced_raw_files(pages)
    processed = _processed_files()
    items = [_wiki_item(page, inbound, referenced_raw) for page in pages]
    for raw_path in sorted(raw_dir("articles").glob("*.md")):
        items.append(_raw_item(raw_path, processed, referenced_raw))
    return items


def _summarize(items: list[AuditItem]) -> dict:
    summary: dict[str, object] = {
        "version": AUDIT_VERSION,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "total": len(items),
        "by_type": {},
        "by_decision": {},
        "by_lane": {},
    }
    for item in items:
        summary["by_type"][item.item_type] = summary["by_type"].get(item.item_type, 0) + 1
        summary["by_decision"][item.decision] = summary["by_decision"].get(item.decision, 0) + 1
        lane = item.primary_lane or "none"
        summary["by_lane"][lane] = summary["by_lane"].get(lane, 0) + 1
    return summary


def _write_manifest(items: list[AuditItem], applied: list[dict], out_dir: Path | None = None) -> Path:
    out_dir = out_dir or (_repo_root() / "audit" / "research" / datetime.now().strftime("%Y%m%d-%H%M%S"))
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = {
        "summary": _summarize(items),
        "applied": applied,
        "items": [asdict(item) for item in items],
    }
    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        "# Consilium Research Audit Manifest",
        "",
        f"- Generated: {manifest['summary']['generated_at']}",
        f"- Version: {AUDIT_VERSION}",
        f"- Total items: {manifest['summary']['total']}",
        f"- Decisions: {manifest['summary']['by_decision']}",
        f"- Applied actions: {len(applied)}",
        "",
        "## High-Signal Queues",
        "",
    ]
    for decision in ("ingest", "promote", "archive", "deprioritize"):
        selected = [item for item in items if item.decision == decision][:30]
        lines.append(f"### {decision}")
        if not selected:
            lines.append("- none")
        for item in selected:
            lane = item.primary_lane or "none"
            lines.append(f"- `{item.path}` -> {lane} / {item.action}: {item.reason}")
        lines.append("")
    (out_dir / "manifest.md").write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    return manifest_path


def _replace_frontmatter_value(text: str, key: str, value: str) -> str:
    if not text.startswith("---"):
        return text
    pattern = rf"(^---\s*\n.*?^){re.escape(key)}:\s*.*?$"
    replacement = rf"\1{key}: {value}"
    new_text, count = re.subn(pattern, replacement, text, count=1, flags=re.DOTALL | re.MULTILINE)
    if count:
        return new_text
    return text.replace("---\n", f"---\n{key}: {value}\n", 1)


def _append_processed(filename: str, marker: str) -> None:
    path = personal_wiki_dir() / "processed.txt"
    existing = _processed_files()
    line = f"{filename} # {marker}"
    if filename not in existing and line not in existing:
        with path.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")


def _remove_from_index(stem: str) -> None:
    index_path = personal_wiki_dir() / "INDEX.md"
    if not index_path.exists():
        return
    lines = []
    for line in _read(index_path).splitlines():
        if re.search(rf"\[\[{re.escape(stem)}\]\]", line):
            continue
        lines.append(line)
    index_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def _index_stems() -> set[str]:
    index_path = personal_wiki_dir() / "INDEX.md"
    if not index_path.exists():
        return set()
    return {match.strip().lower() for match in re.findall(r"\[\[([^\]]+)\]\]", _read(index_path))}


def repair_index() -> list[dict]:
    """Add active wiki pages missing from INDEX.md."""
    wiki = personal_wiki_dir()
    index_path = wiki / "INDEX.md"
    if not index_path.exists():
        return []

    indexed = _index_stems()
    additions_by_topic: dict[str, list[str]] = {}
    changes: list[dict] = []
    for page in _wiki_pages():
        fm = _parse_frontmatter(_read(page))
        status = fm.get("status", "")
        if status == "archived":
            continue
        if page.stem.lower() in indexed:
            continue
        rel_parts = page.relative_to(wiki).parts
        topic = fm.get("topic") or (rel_parts[0] if len(rel_parts) > 1 else "root")
        if topic not in ACTIVE_TOPICS:
            continue
        title = fm.get("title", page.stem)
        tags = fm.get("tags", "[]").strip()
        if tags.startswith("[") and tags.endswith("]"):
            tag_text = tags.strip("[]").replace('"', "")
        else:
            tag_text = tags
        additions_by_topic.setdefault(topic, []).append(f"- [[{page.stem}]] — {title} | tags: {tag_text}")
        changes.append({"path": _rel(page), "action": "index-add", "topic": topic})

    if not additions_by_topic:
        return []

    content = _read(index_path).rstrip()
    for topic, lines in sorted(additions_by_topic.items()):
        if re.search(rf"^##\s+{re.escape(topic)}\s*$", content, flags=re.MULTILINE):
            content = re.sub(
                rf"(^##\s+{re.escape(topic)}\s*$)",
                "\\1\n" + "\n".join(sorted(lines)),
                content,
                count=1,
                flags=re.MULTILINE,
            )
        else:
            content += f"\n\n## {topic}\n" + "\n".join(sorted(lines))
    content = re.sub(r"\*Updated:.*?\*", f"*Updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}*", content)
    index_path.write_text(content.rstrip() + "\n", encoding="utf-8")
    return changes


def update_wiki_health_snapshot(items: list[AuditItem], applied: list[dict]) -> dict:
    """Append a compact current audit snapshot to WIKI_HEALTH.md."""
    health_path = personal_wiki_dir() / "WIKI_HEALTH.md"
    if not health_path.exists():
        return {}
    summary = _summarize(items)
    wiki_items = [item for item in items if item.item_type == "wiki"]
    raw_items = [item for item in items if item.item_type == "raw"]
    missing_status = sum(1 for item in wiki_items if not item.status)
    orphan_wiki = sum(1 for item in wiki_items if item.orphan)
    source_seed = sum(1 for item in wiki_items if item.source_seed)
    section = [
        "",
        f"## Research Audit Snapshot - {TODAY}",
        "",
        "| Metric | Value |",
        "|---|---:|",
        f"| Wiki pages audited | {len(wiki_items)} |",
        f"| Raw articles audited | {len(raw_items)} |",
        f"| Source-seed pages | {source_seed} |",
        f"| Orphan wiki pages | {orphan_wiki} |",
        f"| Missing status | {missing_status} |",
        f"| Decisions keep | {summary['by_decision'].get('keep', 0)} |",
        f"| Decisions promote | {summary['by_decision'].get('promote', 0)} |",
        f"| Decisions ingest | {summary['by_decision'].get('ingest', 0)} |",
        f"| Decisions deprioritize | {summary['by_decision'].get('deprioritize', 0)} |",
        f"| Decisions archive | {summary['by_decision'].get('archive', 0)} |",
        f"| Applied actions this run | {len(applied)} |",
        "",
        "Decision label: **test**. Keep the three-lane audit as the gate between raw collection and durable wiki promotion.",
        "",
    ]
    current = _read(health_path).rstrip()
    health_path.write_text(current + "\n" + "\n".join(section), encoding="utf-8", newline="\n")
    return {"path": _rel(health_path), "action": "health-snapshot", "result": "appended"}


def _apply_item(item: AuditItem, limit_state: dict[str, int]) -> dict | None:
    root = _repo_root()
    source = _resolve_manifest_path(item.path)
    if item.action == "none" or not source.exists():
        return None

    if item.action == "queue-promotion":
        return None

    if item.action == "mark-needs-review":
        text = _read(source)
        new_text = _replace_frontmatter_value(text, "status", "needs-review")
        new_text = _replace_frontmatter_value(new_text, "updated", TODAY)
        if new_text != text:
            source.write_text(new_text, encoding="utf-8")
            return {"path": item.path, "action": item.action, "result": "updated-frontmatter"}
        return None

    if item.action == "mark-processed-low-priority":
        _append_processed(Path(item.path).name, "audit-low-priority")
        return {"path": item.path, "action": item.action, "result": "processed-marker-added"}

    if item.action == "archive-raw":
        if limit_state["archives"] <= 0:
            return None
        destination = _resolve_manifest_path(item.archive_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(source), str(destination))
        _append_processed(source.name, f"audit-archived:{item.archive_path}")
        limit_state["archives"] -= 1
        return {"path": item.path, "action": item.action, "result": "archived", "archive_path": item.archive_path}

    if item.action == "archive-wiki-page":
        if limit_state["archives"] <= 0:
            return None
        destination = _resolve_manifest_path(item.archive_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        text = _read(source)
        text = _replace_frontmatter_value(text, "status", "archived")
        text = _replace_frontmatter_value(text, "updated", TODAY)
        source.write_text(text, encoding="utf-8")
        shutil.move(str(source), str(destination))
        _remove_from_index(source.stem)
        limit_state["archives"] -= 1
        return {"path": item.path, "action": item.action, "result": "archived", "archive_path": item.archive_path}

    return None


def apply_audit(items: list[AuditItem], limit: int, archive_limit: int, actions: set[str] | None = None) -> list[dict]:
    applied: list[dict] = []
    limit_state = {"archives": archive_limit}
    priority = {"mark-needs-review": 0, "mark-processed-low-priority": 1, "archive-wiki-page": 2, "archive-raw": 3}
    def apply_priority(item: AuditItem) -> tuple[int, int, str]:
        reason_rank = 2
        if "missing status" in item.reason:
            reason_rank = 0
        elif "stale" in item.reason:
            reason_rank = 1
        return (priority.get(item.action, 99), reason_rank, item.path)

    selected_items = [item for item in items if not actions or item.action in actions]
    sorted_items = sorted(selected_items, key=apply_priority)
    for item in sorted_items:
        if len(applied) >= limit:
            break
        result = _apply_item(item, limit_state)
        if result:
            applied.append(result)
    return applied


def format_summary(items: list[AuditItem]) -> str:
    summary = _summarize(items)
    lines = [
        f"Research Audit {summary['version']}",
        f"Generated: {summary['generated_at']}",
        f"Items: {summary['total']}",
        f"By type: {summary['by_type']}",
        f"By decision: {summary['by_decision']}",
        f"By lane: {summary['by_lane']}",
        "",
        "Top queues:",
    ]
    for decision in ("ingest", "promote", "archive", "deprioritize"):
        selected = [item for item in items if item.decision == decision][:10]
        lines.append(f"\n[{decision}]")
        if not selected:
            lines.append("  none")
        for item in selected:
            lane = item.primary_lane or "none"
            lines.append(f"  - {item.path} -> {lane}: {item.reason}")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> dict:
    parser = argparse.ArgumentParser(description="Audit Consilium raw/wiki items against the three research lanes.")
    parser.add_argument("--plan", action="store_true", help="Dry-run audit. This is the default.")
    parser.add_argument("--apply", action="store_true", help="Apply safe bookkeeping actions.")
    parser.add_argument("--limit", type=int, default=50, help="Maximum non-noop actions to apply.")
    parser.add_argument("--archive-limit", type=int, default=20, help="Maximum archive moves per apply run.")
    parser.add_argument("--action", action="append", help="Apply only this action. Can be repeated.")
    parser.add_argument("--write-report", action="store_true", help="Write manifest files during dry-run.")
    args = parser.parse_args(argv)

    items = collect_audit_items()
    applied: list[dict] = []
    if args.apply:
        action_filter = set(args.action or [])
        applied = apply_audit(items, limit=args.limit, archive_limit=args.archive_limit, actions=action_filter or None)
        applied.extend(repair_index())
        # Re-read after mutations so the manifest reflects the post-apply state.
        items = collect_audit_items()
        health_result = update_wiki_health_snapshot(items, applied)
        if health_result:
            applied.append(health_result)

    print(format_summary(items))

    manifest_path = None
    if args.apply or args.write_report:
        manifest_path = _write_manifest(items, applied)
        print(f"\nManifest: {manifest_path}")

    return {"summary": _summarize(items), "applied": applied, "manifest": str(manifest_path) if manifest_path else None}


if __name__ == "__main__":
    main()
