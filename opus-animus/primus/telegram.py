from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path


TOKEN_ENV = "PRIMUS_BOT_TOKEN"
CHAT_ID_ENV = "PRIMUS_CHAT_ID"
TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"
_DOTENV_LOADED = False


def creds_present() -> bool:
    _load_dotenv_once()
    return bool(_env_value(TOKEN_ENV) and _env_value(CHAT_ID_ENV))


def send_telegram(text: str, *, token: str | None = None, chat_id: str | None = None) -> bool:
    _load_dotenv_once()
    token = token or _env_value(TOKEN_ENV)
    chat_id = chat_id or _env_value(CHAT_ID_ENV)
    if not token or not chat_id:
        return False

    payload = json.dumps(
        {"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
        ensure_ascii=False,
    ).encode("utf-8")
    request = urllib.request.Request(
        TELEGRAM_API.format(token=token),
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.status == 200
    except (OSError, urllib.error.URLError, urllib.error.HTTPError):
        return False


def _env_value(name: str) -> str:
    return os.environ.get(name, "").strip()


def _load_dotenv_once() -> None:
    global _DOTENV_LOADED
    if _DOTENV_LOADED:
        return
    _DOTENV_LOADED = True

    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    try:
        lines = env_path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        if key and key not in os.environ:
            os.environ[key] = _strip_env_quotes(value.strip())


def _strip_env_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value
