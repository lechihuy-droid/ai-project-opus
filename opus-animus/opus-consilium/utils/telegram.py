import os
import json
import time
import requests
from pathlib import Path

LAST_ERROR_FILE = Path(__file__).parent.parent / ".last_error.json"
MAX_MSG_LEN = 3800


def send_message(text: str) -> bool:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        print("[Telegram] Missing token or chat_id")
        return False

    text = text[:MAX_MSG_LEN] + ("..." if len(text) > MAX_MSG_LEN else "")
    resp = requests.post(
        f"https://api.telegram.org/bot{token}/sendMessage",
        json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
        timeout=10,
    )
    return resp.ok


def send_error(module: str, error: str) -> bool:
    """Send error alert — max 1/hour, skip if same error type as last time."""
    now = time.time()
    last = _load_last_error()

    too_soon = (now - last.get("timestamp", 0)) < 3600
    same_error = last.get("module") == module and last.get("error") == error[:80]
    if too_soon and same_error:
        return False

    sent = send_message(f"🔴 <b>Agent lỗi</b>\n{module}: {error[:200]}")
    if sent:
        _save_last_error(module, error[:80], now)
    return sent


def _load_last_error() -> dict:
    if LAST_ERROR_FILE.exists():
        try:
            return json.loads(LAST_ERROR_FILE.read_text())
        except Exception:
            pass
    return {}


def _save_last_error(module: str, error: str, timestamp: float):
    LAST_ERROR_FILE.write_text(
        json.dumps({"module": module, "error": error, "timestamp": timestamp})
    )
