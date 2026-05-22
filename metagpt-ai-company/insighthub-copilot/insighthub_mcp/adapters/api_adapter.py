"""API adapter placeholders for the MVP architecture."""

from __future__ import annotations

from datetime import date

from .base import SourceAdapter


class _ApiAdapter(SourceAdapter):
    """Stub for future live integrations."""

    def fetch(self, period_start: date, period_end: date) -> list[dict]:
        raise NotImplementedError("API adapter not implemented in MVP - use file mode")


class JiraApiAdapter(_ApiAdapter):
    """Future Jira API-backed adapter."""


class ChatApiAdapter(_ApiAdapter):
    """Future chat API-backed adapter."""


class GithubApiAdapter(_ApiAdapter):
    """Future GitHub API-backed adapter."""

