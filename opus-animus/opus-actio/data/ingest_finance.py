"""Ingest a monthly personal-finance snapshot into data/_local/finance.db.

Reads the Layer-A JSON exports (networth + portfolio) for a given YYYYMM and
upserts them as one snapshot. Idempotent: re-running a month replaces its rows.

Usage:
    python ingest_finance.py 202606
    python ingest_finance.py            # ingest every YYYYMM found in _local/
"""
import json
import re
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
LOCAL = HERE / "_local"
RAW = LOCAL / "raw"          # immutable source exports (Layer A)
DB = LOCAL / "finance.db"    # built local DB
SCHEMA = HERE / "schema.sql"


def init_db(con):
    con.executescript(SCHEMA.read_text(encoding="utf-8"))


def upsert_snapshot(con, as_of, note):
    con.execute("DELETE FROM snapshot WHERE as_of = ?", (as_of,))  # cascade clears facts
    cur = con.execute(
        "INSERT INTO snapshot(as_of, base_ccy, note) VALUES (?, 'JPY', ?)",
        (as_of, note),
    )
    return cur.lastrowid


def account_id(con, name, type_=None):
    con.execute("INSERT OR IGNORE INTO account(name, type) VALUES (?, ?)", (name, type_))
    return con.execute("SELECT id FROM account WHERE name = ?", (name,)).fetchone()[0]


def ingest(con, yyyymm):
    nw = json.loads((RAW / f"{yyyymm}networth.json").read_text(encoding="utf-8"))
    pf = json.loads((RAW / f"{yyyymm}portfolio.json").read_text(encoding="utf-8"))
    as_of = nw["meta"]["as_of"]
    sid = upsert_snapshot(con, as_of, nw["meta"].get("note"))

    # fx rates (from portfolio meta)
    fx = pf["meta"].get("fx", {})
    asof_fx = fx.get("asof")
    for pair, rate in fx.items():
        if pair == "asof":
            continue
        con.execute(
            "INSERT INTO fx_rate(snapshot_id, pair, rate, asof) VALUES (?, ?, ?, ?)",
            (sid, pair, rate, asof_fx),
        )

    # cash accounts / balances
    cash = nw["cash_and_equivalents"]
    for acc in cash["accounts"]:
        aid = account_id(con, acc["name"], acc.get("type"))
        con.execute(
            "INSERT INTO balance(snapshot_id, account_id, balance_jpy, yield) VALUES (?, ?, ?, ?)",
            (sid, aid, acc["balance"], acc.get("yield")),
        )

    # holdings
    for h in pf["holdings"]:
        con.execute(
            """INSERT INTO holding(snapshot_id, code, account_type, name, cls, qty, unit,
                                   avg_cost, cur_price, ccy, value_jpy, value_ccy, pl_jpy, pl_pct)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (sid, h["code"], h.get("account", "-"), h.get("name"), h.get("cls"),
             h.get("qty"), h.get("unit"), h.get("avg_cost"), h.get("cur_price"),
             h.get("ccy"), h.get("value_jpy"), h.get("value_ccy"), h.get("pl_jpy"),
             h.get("pl_pct")),
        )

    # portfolio summary
    s = pf["summary"]
    bc = s.get("by_class", {})
    con.execute(
        """INSERT INTO pf_summary(snapshot_id, total_assets, holdings_total, jp_equity,
            us_equity, funds, deposits_total, cash_deposit, fx_deposit_jpy, margin_guarantee,
            fx_margin_net, credit_unrealized_pl, unrealized_pl, unrealized_pl_pct,
            realized_pl_cum, dividends_jpy, dividends_foreign)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (sid, s.get("total_assets"), s.get("holdings_total"), bc.get("JP_equity"),
         bc.get("US_equity"), bc.get("funds"), s.get("deposits_total"), s.get("cash_deposit"),
         s.get("fx_deposit_jpy"), s.get("margin_guarantee"), s.get("fx_margin_net"),
         s.get("credit_unrealized_pl"), s.get("unrealized_pl"), s.get("unrealized_pl_pct"),
         s.get("realized_pl_cumulative"), s.get("dividends_jpy"), s.get("dividends_foreign")),
    )

    # net worth roll-up
    ef = nw.get("emergency_fund", {})
    ap = nw.get("allocation_pct", {})
    con.execute(
        """INSERT INTO networth(snapshot_id, net_worth, cash_total, invested_total,
            alloc_cash_pct, alloc_invested_pct, ef_buffer_12mo, idle_cash_beyond_ef)
           VALUES (?,?,?,?,?,?,?,?)""",
        (sid, nw.get("net_worth"), cash.get("total"),
         nw.get("invested_securities", {}).get("total"), ap.get("cash"), ap.get("invested"),
         ef.get("suggested_ef_buffer_12mo"), ef.get("idle_cash_beyond_12mo_ef")),
    )
    return as_of, len(pf["holdings"]), len(cash["accounts"])


def discover_months():
    months = sorted({m.group(1) for f in RAW.glob("*networth.json")
                     if (m := re.match(r"(\d{6})networth\.json", f.name))})
    return months


def main():
    args = sys.argv[1:]
    months = args if args else discover_months()
    if not months:
        print("No snapshots found in", LOCAL)
        return
    con = sqlite3.connect(DB)
    con.execute("PRAGMA foreign_keys = ON")
    init_db(con)
    for ym in months:
        as_of, nh, na = ingest(con, ym)
        print(f"  ingested {ym}: as_of={as_of}, {nh} holdings, {na} cash accounts")
    con.commit()
    con.close()
    print("DB:", DB)


if __name__ == "__main__":
    main()
