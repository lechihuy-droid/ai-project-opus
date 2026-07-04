from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DATA_DIR = Path(__file__).resolve().parent
DB_PATH = DATA_DIR / "_local" / "finance.db"
META_PATH = DATA_DIR / "_local" / "portfolio-meta.json"
META_EXAMPLE_PATH = DATA_DIR / "portfolio-meta.example.json"
OUTPUT_PATH = DATA_DIR / "portfolio.json"

ACCOUNT_MAP = {
    "NISA-growth": "nisa_growth",
    "NISA-tsumitate": "nisa_tsumitate",
    "taxable": "tokutei",
    "-": "tokutei",
}


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return data


def load_overlay() -> dict[str, Any]:
    if META_PATH.exists():
        return load_json(META_PATH)
    if META_EXAMPLE_PATH.exists():
        return load_json(META_EXAMPLE_PATH)
    return {}


def connect_db() -> sqlite3.Connection:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Finance DB not found: {DB_PATH}")
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def latest_holding_snapshot(con: sqlite3.Connection) -> sqlite3.Row:
    row = con.execute(
        """
        SELECT s.id, s.as_of, s.base_ccy
        FROM snapshot s
        WHERE s.id = (SELECT MAX(snapshot_id) FROM holding)
        """
    ).fetchone()
    if row is None:
        raise RuntimeError("No holding snapshot found in finance.db")
    return row


def latest_usdjpy(con: sqlite3.Connection, snapshot_id: int) -> dict[str, Any] | None:
    row = con.execute(
        """
        SELECT rate, asof
        FROM fx_rate
        WHERE snapshot_id = ? AND pair = 'USDJPY'
        """,
        (snapshot_id,),
    ).fetchone()
    if row is None:
        row = con.execute(
            """
            SELECT rate, asof
            FROM fx_rate
            WHERE pair = 'USDJPY'
            ORDER BY snapshot_id DESC
            LIMIT 1
            """
        ).fetchone()
    if row is None:
        return None
    return {"USDJPY": row["rate"], "updated": row["asof"]}


def account_key(account_type: str | None) -> str:
    if not account_type:
        return "tokutei"
    return ACCOUNT_MAP.get(account_type, "tokutei")


def clean_position_meta(meta: dict[str, Any]) -> dict[str, Any]:
    return {
        "added": meta.get("added"),
        "thesis": meta.get("thesis", ""),
        "stop_loss": meta.get("stop_loss"),
        "target_1y": meta.get("target_1y"),
    }


def build_position(row: sqlite3.Row, positions_meta: dict[str, Any]) -> dict[str, Any]:
    code = row["code"]
    raw_meta = positions_meta.get(code, {})
    if not isinstance(raw_meta, dict):
        raw_meta = {}

    position: dict[str, Any] = {
        "ticker": code,
        "market": row["cls"],
        "name": row["name"],
        "qty": row["qty"],
        "account": account_key(row["account_type"]),
        **clean_position_meta(raw_meta),
        "cur_price": row["cur_price"],
        "value_jpy": row["value_jpy"],
        "pl_pct": row["pl_pct"],
    }

    if row["ccy"] == "USD":
        position["avg_price_usd"] = row["avg_cost"]
    else:
        position["avg_price_jpy"] = row["avg_cost"]

    return position


def build_portfolio() -> dict[str, Any]:
    overlay = load_overlay()
    positions_meta = overlay.get("positions_meta", {})
    if not isinstance(positions_meta, dict):
        positions_meta = {}

    with connect_db() as con:
        snapshot = latest_holding_snapshot(con)
        snapshot_id = int(snapshot["id"])
        holdings = con.execute(
            """
            SELECT code, account_type, name, cls, qty, avg_cost, cur_price, ccy, value_jpy, pl_pct
            FROM holding
            WHERE snapshot_id = ? AND cls != 'CASH'
            ORDER BY value_jpy IS NULL, value_jpy DESC, code
            """,
            (snapshot_id,),
        ).fetchall()
        fx_rate = latest_usdjpy(con, snapshot_id)

    portfolio: dict[str, Any] = {
        "$schema": "./portfolio.schema.md",
        "owner": "HUY",
        "base_currency": "JPY",
        "target_allocation": overlay.get("target_allocation", {}),
        "accounts": overlay.get("accounts", {}),
        "positions": [build_position(row, positions_meta) for row in holdings],
        "watchlist": overlay.get("watchlist", []),
        "generated_from": f"finance.db snapshot {snapshot['as_of']}",
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
    }
    if fx_rate is not None:
        if fx_rate.get("updated") is None:
            fx_rate["updated"] = snapshot["as_of"]
        portfolio["fx_rate"] = fx_rate

    return portfolio


def main() -> None:
    portfolio = build_portfolio()
    OUTPUT_PATH.write_text(
        json.dumps(portfolio, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    total_value = sum(
        position.get("value_jpy", 0) or 0 for position in portfolio["positions"]
    )
    print(f"Wrote {OUTPUT_PATH}")
    print(f"Positions: {len(portfolio['positions'])}")
    print(f"Total value_jpy: {total_value:,.0f}")
    print(f"Generated from: {portfolio['generated_from']}")


if __name__ == "__main__":
    main()
