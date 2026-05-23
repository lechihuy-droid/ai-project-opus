"""HTTP-backed adapters for live Jira, chat, and GitHub sources."""

from __future__ import annotations

import os
from datetime import date
from typing import Any

import httpx

from .base import SourceAdapter


class _ApiAdapter(SourceAdapter):
    """Base helper for API adapters that authenticate from env vars."""

    def __init__(self, config: dict[str, Any], client: httpx.Client | None = None) -> None:
        self.config = config
        self.client = client or httpx.Client(
            base_url=str(config.get("api_base") or "").rstrip("/"),
            headers=self._headers(config),
            timeout=30.0,
        )

    def _headers(self, config: dict[str, Any]) -> dict[str, str]:
        token = _token_from_auth(str(config.get("auth") or ""))
        headers = {"Accept": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        extra = config.get("headers") or {}
        for key, value in extra.items():
            headers[str(key)] = str(value)
        return headers

    def _get_json(self, path: str, params: dict[str, Any] | None = None) -> Any:
        response = self.client.get(path, params=params)
        response.raise_for_status()
        return response.json()


class JiraApiAdapter(_ApiAdapter):
    """Fetch Jira issues and sprint metrics over HTTP."""

    def fetch(self, period_start: date, period_end: date) -> list[dict]:
        issues_payload = self._get_json(
            str(self.config.get("issues_path") or "/rest/api/3/search"),
            params={
                "jql": str(
                    self.config.get("jql")
                    or (
                        "updated >= '{start}' AND updated <= '{end}' ORDER BY updated DESC"
                    )
                ).format(start=period_start.isoformat(), end=period_end.isoformat()),
                "maxResults": int(self.config.get("max_results") or 200),
            },
        )
        sprints_path = str(self.config.get("sprints_path") or "").strip()
        sprints_payload = self._get_json(sprints_path) if sprints_path else {}
        return [
            {
                "issues": [_normalize_jira_issue(item) for item in issues_payload.get("issues", [])],
                "sprints": [_normalize_sprint(item) for item in _list_payload(sprints_payload, "values", "sprints")],
            }
        ]


class ChatApiAdapter(_ApiAdapter):
    """Fetch chat messages over HTTP."""

    def fetch(self, period_start: date, period_end: date) -> list[dict]:
        provider = str(self.config.get("provider") or "slack").lower()
        payload = self._get_json(
            str(self.config.get("messages_path") or _default_chat_path(provider)),
            params=_chat_params(provider, self.config, period_start, period_end),
        )
        if provider == "teams":
            return [_normalize_teams_message(item) for item in _list_payload(payload, "value", "messages")]
        return [_normalize_slack_message(item, payload, self.config) for item in _list_payload(payload, "messages")]


class GithubApiAdapter(_ApiAdapter):
    """Fetch GitHub commits and pull requests over HTTP."""

    def fetch(self, period_start: date, period_end: date) -> list[dict]:
        commits_payload = self._get_json(
            str(self.config.get("commits_path") or _github_path(self.config, "commits")),
            params={
                "since": f"{period_start.isoformat()}T00:00:00Z",
                "until": f"{period_end.isoformat()}T23:59:59Z",
                "per_page": int(self.config.get("per_page") or 100),
            },
        )
        pulls_payload = self._get_json(
            str(self.config.get("pulls_path") or _github_path(self.config, "pulls")),
            params={
                "state": str(self.config.get("pull_state") or "all"),
                "sort": "updated",
                "direction": "desc",
                "per_page": int(self.config.get("per_page") or 100),
            },
        )
        return [
            {
                "commits": [_normalize_commit(item) for item in _list_payload(commits_payload, "commits")],
                "pull_requests": [
                    _normalize_pull_request(item, period_start, period_end)
                    for item in _list_payload(pulls_payload, "pulls", "pull_requests")
                    if _pull_request_in_period(item, period_start, period_end)
                ],
            }
        ]


def _token_from_auth(auth: str) -> str | None:
    if not auth.startswith("env:"):
        return None
    env_name = auth.split(":", 1)[1].strip()
    if not env_name:
        return None
    token = os.environ.get(env_name)
    if token:
        return token
    raise RuntimeError(f"Missing environment variable '{env_name}' for API adapter auth")


def _normalize_jira_issue(item: dict[str, Any]) -> dict[str, Any]:
    fields = item.get("fields") or item
    issue_type = fields.get("issuetype")
    priority = fields.get("priority")
    assignee = fields.get("assignee")
    status = fields.get("status")
    resolution = fields.get("resolutiondate") or fields.get("resolved")
    labels = fields.get("labels") or []
    return {
        "key": item.get("key") or fields.get("key") or "",
        "summary": fields.get("summary") or "",
        "issue_type": _field_name(issue_type) or str(fields.get("issue_type") or "Task"),
        "status": _field_name(status) or str(fields.get("status") or "To Do"),
        "priority": _field_name(priority) or str(fields.get("priority") or "Medium"),
        "assignee": _field_name(assignee) or str(fields.get("assignee") or ""),
        "story_points": float(
            fields.get("Story Points")
            or fields.get("customfield_story_points")
            or fields.get("story_points")
            or 0
        ),
        "created": str(fields.get("created") or fields.get("created_at") or "")[:10],
        "updated": str(fields.get("updated") or fields.get("updated_at") or "")[:10],
        "resolved": str(resolution)[:10] if resolution else None,
        "sprint": _sprint_name(fields.get("sprint") or fields.get("customfield_sprint")),
        "labels": [str(label) for label in labels if str(label).strip()],
        "reopened": bool(fields.get("reopened") or False),
    }


def _normalize_sprint(item: dict[str, Any]) -> dict[str, Any]:
    committed = float(item.get("committed_sp") or item.get("committed") or 0)
    completed = float(item.get("completed_sp") or item.get("completed") or 0)
    completion = item.get("completion_pct")
    if completion is None:
        completion = (completed / committed * 100) if committed else 0.0
    return {
        "sprint": str(item.get("sprint") or item.get("name") or ""),
        "start": str(item.get("start") or item.get("startDate") or "")[:10],
        "end": str(item.get("end") or item.get("endDate") or "")[:10],
        "committed_sp": committed,
        "completed_sp": completed,
        "completion_pct": float(completion),
    }


def _default_chat_path(provider: str) -> str:
    return "/conversations.history" if provider == "slack" else "/messages"


def _chat_params(
    provider: str,
    config: dict[str, Any],
    period_start: date,
    period_end: date,
) -> dict[str, Any]:
    if provider == "teams":
        return {
            "startDateTime": f"{period_start.isoformat()}T00:00:00Z",
            "endDateTime": f"{period_end.isoformat()}T23:59:59Z",
        }
    params: dict[str, Any] = {
        "oldest": f"{period_start.isoformat()}T00:00:00Z",
        "latest": f"{period_end.isoformat()}T23:59:59Z",
    }
    if config.get("channel_id"):
        params["channel"] = config["channel_id"]
    return params


def _normalize_slack_message(
    item: dict[str, Any],
    payload: dict[str, Any],
    config: dict[str, Any],
) -> dict[str, Any]:
    return {
        "msg_id": str(item.get("id") or item.get("client_msg_id") or item.get("ts") or ""),
        "channel": str(item.get("channel") or payload.get("channel") or config.get("channel_id") or ""),
        "user": str(item.get("user") or item.get("username") or ""),
        "ts": str(item.get("ts") or item.get("timestamp") or ""),
        "text": str(item.get("text") or item.get("message") or ""),
    }


def _normalize_teams_message(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "msg_id": str(item.get("id") or ""),
        "channel": str(item.get("channelIdentity", {}).get("channelId") or item.get("channel") or ""),
        "user": str(item.get("from", {}).get("user", {}).get("displayName") or item.get("user") or ""),
        "ts": str(item.get("createdDateTime") or item.get("ts") or ""),
        "text": str(item.get("body", {}).get("content") or item.get("text") or ""),
    }


def _github_path(config: dict[str, Any], kind: str) -> str:
    repository = str(config.get("repository") or "").strip("/")
    if not repository:
        raise RuntimeError("GitHub API adapter requires 'repository: owner/name' in connections config")
    return f"/repos/{repository}/{kind}"


def _normalize_commit(item: dict[str, Any]) -> dict[str, Any]:
    commit = item.get("commit") or {}
    author = commit.get("author") or {}
    return {
        "sha": str(item.get("sha") or ""),
        "message": str(commit.get("message") or item.get("message") or ""),
        "author": str(author.get("name") or item.get("author", {}).get("login") or ""),
        "date": str(author.get("date") or item.get("date") or ""),
    }


def _pull_request_in_period(item: dict[str, Any], period_start: date, period_end: date) -> bool:
    created = str(item.get("created_at") or item.get("created") or "")[:10]
    if not created:
        return False
    created_date = date.fromisoformat(created)
    return period_start <= created_date <= period_end


def _normalize_pull_request(item: dict[str, Any], period_start: date, period_end: date) -> dict[str, Any]:
    return {
        "number": int(item.get("number") or 0),
        "title": str(item.get("title") or ""),
        "author": str(item.get("user", {}).get("login") or item.get("author") or ""),
        "reviewers": [
            str(reviewer.get("login") or reviewer.get("name") or reviewer)
            for reviewer in item.get("requested_reviewers") or item.get("reviewers") or []
        ],
        "state": str(item.get("state") or "open"),
        "created": str(item.get("created_at") or item.get("created") or f"{period_start.isoformat()}T00:00:00Z"),
        "merged_at": item.get("merged_at"),
        "ci_status": str(item.get("ci_status") or item.get("mergeable_state") or ""),
    }


def _field_name(value: Any) -> str:
    if isinstance(value, dict):
        return str(value.get("displayName") or value.get("name") or value.get("value") or "")
    return str(value or "")


def _sprint_name(value: Any) -> str:
    if isinstance(value, list):
        if not value:
            return ""
        return _sprint_name(value[-1])
    if isinstance(value, dict):
        return str(value.get("name") or "")
    return str(value or "")


def _list_payload(payload: Any, *keys: str) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if not isinstance(payload, dict):
        return []
    for key in keys:
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []
