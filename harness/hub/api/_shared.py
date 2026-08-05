from __future__ import annotations

import hashlib
import json
import re

from fastapi import HTTPException, Request


def _error_code(status_code: int) -> str:
    return {
        400: "INVALID_REQUEST", 403: "FORBIDDEN", 404: "NOT_FOUND", 409: "CONFLICT",
        422: "VALIDATION_FAILED", 500: "INTERNAL_ERROR",
    }.get(status_code, "REQUEST_FAILED")


def _safe_error_message(value: object, status_code: int) -> str:
    message = str(value or "Request failed")
    # Exception strings are not a public contract: never echo paths, tracebacks, or likely secrets.
    if "\n" in message or "\r" in message or re.search(r"(?:[A-Za-z]:[\\/]|(?:^|\s)/(?:[^\s]+))", message):
        return {403: "Access denied", 404: "Resource not found"}.get(status_code, "Request failed")
    if re.search(r"(?:token|secret|password|api[_-]?key)\s*[=:]", message, re.I):
        return "Request failed"
    return message[:500]


def _http_error(exc: Exception, status_code: int | None = None) -> HTTPException:
    """Only conversion point from application exceptions to public HTTP errors."""
    if isinstance(exc, HTTPException):
        status_code = exc.status_code
        detail = exc.detail
    elif status_code is None and isinstance(exc, PermissionError):
        status_code, detail = 403, exc
    elif status_code is None and isinstance(exc, FileNotFoundError):
        status_code, detail = 404, exc
    else:
        status_code, detail = status_code or 500, exc
    if isinstance(detail, dict):
        code = detail.get("code")
        message = _safe_error_message(detail.get("message"), status_code)
        safe_details = detail.get("details") if isinstance(detail.get("details"), dict) else None
        return HTTPException(status_code=status_code, detail={
            "code": code if isinstance(code, str) and code else _error_code(status_code),
            "message": message, "details": safe_details,
        })
    return HTTPException(status_code=status_code, detail=_safe_error_message(detail, status_code))


def _etag(value: bytes) -> str:
    return f'"{hashlib.sha256(value).hexdigest()}"'


def _check_if_match(request: Request, current: bytes) -> None:
    expected = request.headers.get("If-Match")
    actual = _etag(current)
    # Optional until web-v3 sends preconditions; supplied preconditions are strict.
    if expected is not None and expected != actual:
        raise HTTPException(status_code=409, detail={
            "code": "STALE_DOCUMENT", "message": "Document changed; refresh and retry.",
            "details": {"current_version": actual},
        })


def _sse(event: str, data: dict[str, object]) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"
