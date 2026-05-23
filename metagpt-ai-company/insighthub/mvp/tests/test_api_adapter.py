"""Wave 4.1 checks for live HTTP adapters with mocked transports."""

from __future__ import annotations

from datetime import date

import httpx

from insighthub_mcp.adapters.api_adapter import ChatApiAdapter, GithubApiAdapter, JiraApiAdapter


def test_jira_api_adapter_normalizes_issues_and_sprints(monkeypatch):
    monkeypatch.setenv("JIRA_TOKEN", "token")

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/rest/api/3/search":
            return httpx.Response(
                200,
                json={
                    "issues": [
                        {
                            "key": "SAKURA-101",
                            "fields": {
                                "summary": "Ship weekly export",
                                "issuetype": {"name": "Task"},
                                "status": {"name": "Done"},
                                "priority": {"name": "High"},
                                "assignee": {"displayName": "Aki"},
                                "story_points": 3,
                                "created": "2026-05-18T09:00:00Z",
                                "updated": "2026-05-20T11:00:00Z",
                                "resolved": "2026-05-20T12:00:00Z",
                                "sprint": {"name": "Sprint 24"},
                                "labels": ["reporting"],
                            },
                        }
                    ]
                },
            )
        if request.url.path == "/rest/agile/1.0/board/7/sprint":
            return httpx.Response(
                200,
                json={
                    "values": [
                        {
                            "name": "Sprint 24",
                            "startDate": "2026-05-15",
                            "endDate": "2026-05-21",
                            "committed": 10,
                            "completed": 8,
                        }
                    ]
                },
            )
        raise AssertionError(f"Unexpected path: {request.url.path}")

    adapter = JiraApiAdapter(
        {
            "api_base": "https://example.atlassian.net",
            "auth": "env:JIRA_TOKEN",
            "sprints_path": "/rest/agile/1.0/board/7/sprint",
        },
        client=httpx.Client(
            base_url="https://example.atlassian.net",
            transport=httpx.MockTransport(handler),
        ),
    )

    payload = adapter.fetch(date(2026, 5, 15), date(2026, 5, 21))[0]

    assert payload["issues"][0]["key"] == "SAKURA-101"
    assert payload["issues"][0]["status"] == "Done"
    assert payload["issues"][0]["story_points"] == 3.0
    assert payload["sprints"][0]["completion_pct"] == 80.0


def test_chat_and_github_api_adapters_normalize_payloads(monkeypatch):
    monkeypatch.setenv("SLACK_TOKEN", "token")
    monkeypatch.setenv("GITHUB_TOKEN", "token")

    def chat_handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/conversations.history"
        return httpx.Response(
            200,
            json={
                "channel": "proj-sakura",
                "messages": [
                    {
                        "client_msg_id": "msg-1",
                        "user": "pm",
                        "ts": "2026-05-18T10:00:00Z",
                        "text": "Customer accepted scope",
                    }
                ],
            },
        )

    def github_handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/commits"):
            return httpx.Response(
                200,
                json=[
                    {
                        "sha": "3a7f2e1abcd",
                        "commit": {
                            "message": "SAKURA-101 finalize report export",
                            "author": {"name": "dev1", "date": "2026-05-19T09:30:00Z"},
                        },
                    }
                ],
            )
        if request.url.path.endswith("/pulls"):
            return httpx.Response(
                200,
                json=[
                    {
                        "number": 42,
                        "title": "SAKURA-101 add export links",
                        "user": {"login": "dev1"},
                        "requested_reviewers": [{"login": "lead"}],
                        "state": "closed",
                        "created_at": "2026-05-20T08:00:00Z",
                        "merged_at": "2026-05-20T12:00:00Z",
                        "ci_status": "success",
                    }
                ],
            )
        raise AssertionError(f"Unexpected path: {request.url.path}")

    chat_adapter = ChatApiAdapter(
        {
            "api_base": "https://slack.com/api",
            "auth": "env:SLACK_TOKEN",
            "provider": "slack",
        },
        client=httpx.Client(base_url="https://slack.com/api", transport=httpx.MockTransport(chat_handler)),
    )
    github_adapter = GithubApiAdapter(
        {
            "api_base": "https://api.github.com",
            "auth": "env:GITHUB_TOKEN",
            "repository": "fpt-japan/project-sakura",
        },
        client=httpx.Client(base_url="https://api.github.com", transport=httpx.MockTransport(github_handler)),
    )

    messages = chat_adapter.fetch(date(2026, 5, 15), date(2026, 5, 21))
    payload = github_adapter.fetch(date(2026, 5, 15), date(2026, 5, 21))[0]

    assert messages[0]["msg_id"] == "msg-1"
    assert messages[0]["channel"] == "proj-sakura"
    assert payload["commits"][0]["sha"] == "3a7f2e1abcd"
    assert payload["pull_requests"][0]["number"] == 42
    assert payload["pull_requests"][0]["reviewers"] == ["lead"]
