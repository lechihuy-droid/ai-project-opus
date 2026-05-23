"""Base contract for InsightHub source adapters."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date


class SourceAdapter(ABC):
    """Adapter interface for one external project data source."""

    @abstractmethod
    def fetch(self, period_start: date, period_end: date) -> list[dict]:
        """Return raw JSON-able source records for the requested period."""

