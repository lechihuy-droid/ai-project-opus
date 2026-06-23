"""
Actio — personal wealth dashboard API.

Serves a single /api/actio/overview bundle computed from the opus-actio
finance.db + _local config files (client-profile, goals, investment-policy,
retirement, review-cadence). Localhost-only; real figures stay on the machine
(same trust model as /api/goals reading GOALS.md).
"""
from __future__ import annotations

import json
import sqlite3
from collections import defaultdict
from datetime import date
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()

ACTIO_DATA = Path(__file__).parent.parent.parent / "opus-actio" / "data"
LOCAL = ACTIO_DATA / "_local"
DB = LOCAL / "finance.db"

# Index funds / ETFs are diversified → single-name cap does NOT apply to them.
ETF_CODES = {"VOO", "VT", "VWO", "SMH", "NLR", "DBC", "1321"}


def _load(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _is_single_stock(code: str, cls: str) -> bool:
    return cls in ("JP", "US") and code not in ETF_CODES


def _fv(pv: float, c_annual: float, r: float, n: int) -> float:
    grown = pv * ((1 + r) ** n)
    ann = c_annual * ((((1 + r) ** n) - 1) / r) if r > 0 else c_annual * n
    return grown + ann


@router.get("/actio/overview")
def actio_overview():
    if not DB.exists():
        return {"ok": False, "error": f"finance.db not found at {DB}"}

    c = sqlite3.connect(str(DB))
    c.row_factory = sqlite3.Row
    snap = c.execute("SELECT id, as_of FROM snapshot ORDER BY as_of DESC LIMIT 1").fetchone()
    sid = snap["id"]
    as_of = snap["as_of"]

    profile = _load(LOCAL / "client-profile.json") or {}
    goals_cfg = _load(LOCAL / "goals.json") or {}
    ips = _load(LOCAL / "investment-policy.json") or {}
    retire_cfg = _load(LOCAL / "retirement.json") or {}
    cadence_cfg = _load(LOCAL / "review-cadence.json") or _load(ACTIO_DATA / "review-cadence.example.json") or {}
    review_state = (_load(LOCAL / "review-state.json") or {}).get("last_run", {})

    # ── Balance sheet ────────────────────────────────────────────
    nw = c.execute(
        "SELECT net_worth, cash_total, invested_total, idle_cash_beyond_ef, ef_buffer_12mo "
        "FROM networth WHERE snapshot_id=?", (sid,)).fetchone()
    tnw = c.execute(
        "SELECT true_net_worth, total_liabilities FROM v_networth_true WHERE snapshot_id=?",
        (sid,)).fetchone()
    cash_accounts = [dict(r) for r in c.execute(
        "SELECT a.name, a.type, b.balance_jpy FROM balance b JOIN account a ON a.id=b.account_id "
        "WHERE b.snapshot_id=? ORDER BY b.balance_jpy DESC", (sid,))]

    balance = {
        "as_of": as_of,
        "true_net_worth": (tnw["true_net_worth"] if tnw else nw["net_worth"]),
        "total_liabilities": (tnw["total_liabilities"] if tnw else 0),
        "cash_total": nw["cash_total"],
        "invested_total": nw["invested_total"],
        "idle_cash_beyond_ef": nw["idle_cash_beyond_ef"],
        "cash_pct": round(100 * nw["cash_total"] / nw["net_worth"], 1) if nw["net_worth"] else None,
        "invested_pct": round(100 * nw["invested_total"] / nw["net_worth"], 1) if nw["net_worth"] else None,
        "accounts": cash_accounts,
    }

    # ── Cashflow ─────────────────────────────────────────────────
    cf = profile.get("cashflow_jpy", {})
    income = cf.get("monthly_net_income_est")
    expense = cf.get("monthly_expense")
    capacity = (income - expense) if (income is not None and expense is not None) else None
    cashflow = {
        "income": income, "expense": expense, "savings": capacity,
        "savings_rate_pct": round(100 * capacity / income, 1) if (capacity is not None and income) else None,
        "risk_capacity": (ips.get("risk", {}) or {}).get("capacity"),
        "risk_tolerance": (ips.get("risk", {}) or {}).get("tolerance"),
    }

    # ── Holdings + concentration ─────────────────────────────────
    holds = [dict(r) for r in c.execute(
        "SELECT code, name, cls, account_type, value_jpy, pl_pct FROM holding "
        "WHERE snapshot_id=? AND cls!='CASH' ORDER BY value_jpy DESC", (sid,))]
    inv_total = sum(h["value_jpy"] for h in holds) or 1
    agg = defaultdict(lambda: {"value": 0.0, "name": "", "cls": ""})
    for h in holds:
        a = agg[h["code"]]
        a["value"] += h["value_jpy"]; a["name"] = h["name"]; a["cls"] = h["cls"]
    positions = sorted(
        ([{"code": k, "name": v["name"], "cls": v["cls"], "value": int(v["value"]),
           "pct": round(100 * v["value"] / inv_total, 1),
           "single_stock": _is_single_stock(k, v["cls"])} for k, v in agg.items()]),
        key=lambda x: -x["value"])

    cap_single = (ips.get("constraints", {}) or {}).get("max_single_name_pct", 10)
    violations = [p for p in positions if p["single_stock"] and p["pct"] > cap_single]

    # equity / bond / cash split of the invested sleeve
    bond_val = sum(h["value_jpy"] for h in holds
                   if "Bond" in (h["name"] or "") or "DevBond" in (h["code"] or ""))
    equity_val = inv_total - bond_val
    growth = (ips.get("bucket_targets", {}) or {}).get("growth", {})
    actual = {"equity": round(100 * equity_val / inv_total, 1),
              "bond": round(100 * bond_val / inv_total, 1), "cash": 0.0}
    drift = None
    if growth:
        drift = {"equity": round(actual["equity"] - growth.get("equity", 0) * 100, 1),
                 "bond": round(actual["bond"] - growth.get("bond", 0) * 100, 1)}
    ips_block = {
        "max_single_name_pct": cap_single,
        "violations": [{"code": v["code"], "name": v["name"], "pct": v["pct"]} for v in violations],
        "actual_alloc": actual,
        "growth_target": {k: round(growth.get(k, 0) * 100, 1) for k in ("equity", "bond", "cash")} if growth else None,
        "drift_pp": drift,
        "positions": positions[:12],
    }

    # ── Goals ────────────────────────────────────────────────────
    fund_src = {"emergency": nw["cash_total"], "house": nw["idle_cash_beyond_ef"],
                "retirement": nw["invested_total"]}
    goals_out = []
    for g in goals_cfg.get("goals", []):
        target = g.get("target_jpy")
        funded = fund_src.get(g["id"], 0)
        if target:
            funded = min(funded, target)
        pct = round(100 * funded / target, 1) if target else None
        h_m = g.get("horizon_months")
        need = round((target - funded) / h_m) if (target and h_m and funded < target) else 0
        goals_out.append({
            "id": g["id"], "name": g.get("name"), "priority": g.get("priority"),
            "target": target, "funded": int(funded), "pct": pct,
            "horizon_months": h_m, "monthly_needed": need,
            "on_track": (capacity is not None and need <= capacity),
        })

    # ── Retirement / FIRE ────────────────────────────────────────
    retire = None
    if retire_cfg and profile.get("profile", {}).get("age"):
        age = profile["profile"]["age"]
        ret_age = retire_cfg["retire_target_age"]; life = retire_cfg["life_expectancy"]
        exp = retire_cfg["annual_expense_retire_jpy"]; nenkin = retire_cfg["kosei_nenkin_est_annual_jpy"]
        nstart = retire_cfg["kosei_nenkin_start_age"]
        r = retire_cfg["real_return_pct"] / 100; swr = retire_cfg["safe_withdrawal_rate_pct"] / 100
        ideco = retire_cfg.get("idecho_monthly_jpy") or 0
        nisa = retire_cfg.get("nisa_monthly_jpy") or 0
        n = max(0, ret_age - age)
        core = max(0, exp - nenkin) / swr
        bridge = max(0, nstart - ret_age) * exp
        fire = core + bridge
        contrib_annual = (ideco + nisa) * 12
        proj = _fv(nw["invested_total"], contrib_annual, r, n)
        fi_age = None
        for k in range(0, life - age + 1):
            if _fv(nw["invested_total"], contrib_annual, r, k) >= fire:
                fi_age = age + k
                break
        retire = {
            "age": age, "retire_age": ret_age, "core": int(core), "bridge": int(bridge),
            "fire_number": int(fire), "projected_at_retire": int(proj),
            "surplus": int(proj - fire), "fi_age": fi_age,
            "contrib_monthly": ideco + nisa, "swr_pct": retire_cfg["safe_withdrawal_rate_pct"],
            "real_return_pct": retire_cfg["real_return_pct"],
            "on_track": proj >= fire,
        }

    # ── Spending (last 6 months + latest month by category) ──────
    spend_months = [dict(r) for r in c.execute(
        "SELECT source_month, SUM(amount_jpy) total FROM card_txn "
        "GROUP BY source_month ORDER BY source_month DESC LIMIT 6")]
    spend_cats = []
    if spend_months:
        latest_m = spend_months[0]["source_month"]
        spend_cats = [dict(r) for r in c.execute(
            "SELECT category, SUM(amount_jpy) total, COUNT(*) n FROM card_txn "
            "WHERE source_month=? GROUP BY category ORDER BY total DESC", (latest_m,))]
    spending = {"months": spend_months,
                "latest_month": spend_months[0]["source_month"] if spend_months else None,
                "categories": spend_cats}

    # ── Review cadence (what's due) ──────────────────────────────
    due = []
    cmap = cadence_cfg.get("cadence", {})
    cdays = cadence_cfg.get("cadence_days", {})
    today = date.today()
    for sk, cd in cmap.items():
        lr = review_state.get(sk)
        if not lr:
            overdue = None
            is_due = True
        else:
            y, m, d = map(int, lr.split("-"))
            overdue = (today - date(y, m, d)).days
            is_due = overdue >= cdays.get(cd, 9999)
        if is_due:
            due.append({"skill": sk, "cadence": cd, "overdue_days": overdue, "cmd": f"/actio-{sk}"})
    order = {"annual": 0, "quarterly": 1, "monthly": 2, "weekly": 3, "daily": 4}
    due.sort(key=lambda x: order.get(x["cadence"], 9))

    c.close()
    return {
        "ok": True, "as_of": as_of,
        "balance": balance, "cashflow": cashflow, "goals": goals_out,
        "ips": ips_block, "retire": retire, "spending": spending, "review_due": due,
    }
