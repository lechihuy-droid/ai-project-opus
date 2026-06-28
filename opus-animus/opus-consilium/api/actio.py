"""
Actio — personal wealth dashboard API.

Serves a single /api/actio/overview bundle computed from the opus-actio
finance.db + _local config files (client-profile, goals, investment-policy,
retirement, review-cadence). Localhost-only; real figures stay on the machine
(same trust model as /api/goals reading GOALS.md).

Advisory framing (CFP household + Goldman IPS):
- Allocation reported at BOTH household and invested-sleeve level so the
  "94% equity" sleeve figure can't be misread as household over-risk.
- Idle cash carries an explicit opportunity-cost number.
- Goal funding is netted SEQUENTIALLY from a shared cash pool (no double count).
- FIRE shown with a sensitivity band, not a single false-precise number.
- Forward mortgage scenario, spending variance, protection/FX, staleness,
  net-worth trend, and a synthesized next-best-action list.
"""
from __future__ import annotations

import json
import sqlite3
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()

ACTIO_DATA = Path(__file__).parent.parent.parent / "opus-actio" / "data"
LOCAL = ACTIO_DATA / "_local"
DB = LOCAL / "finance.db"

# Index funds / ETFs are diversified → single-name cap does NOT apply to them.
ETF_CODES = {"VOO", "VT", "VWO", "SMH", "NLR", "DBC", "1321"}

# Illustrative mortgage assumptions (JP variable loan, full loan / 0% down).
MTG_RATE = 0.006          # variable rate (illustrative)
MTG_TERM_YEARS = 35
MTG_CLOSING_PCT = 0.08    # 諸費用 ~7-10%
MTG_TAX_CREDIT_PCT = 0.007  # 住宅ローン控除, ~0.7% of balance/yr (13yr)
STALE_DAYS = 35           # monthly snapshot cadence → flag if older


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


def _fire(exp, nenkin, nstart, ret_age, swr, r):
    core = max(0, exp - nenkin) / swr
    bridge = max(0, nstart - ret_age) * exp
    return core + bridge


def _parse_price(v):
    """target_price_jpy may be an int or a 'lo-hi' string → return midpoint."""
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return int(v)
    s = str(v).replace(",", "").strip()
    if "-" in s:
        lo, hi = s.split("-", 1)
        try:
            return int((int(lo) + int(hi)) / 2)
        except ValueError:
            return None
    try:
        return int(s)
    except ValueError:
        return None


def _amortized_monthly(principal, annual_rate, years):
    n = years * 12
    r = annual_rate / 12
    if r == 0:
        return principal / n
    return principal * r / (1 - (1 + r) ** (-n))


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

    # ── Staleness ────────────────────────────────────────────────
    try:
        age_days = (date.today() - datetime.strptime(as_of, "%Y-%m-%d").date()).days
    except Exception:
        age_days = None
    staleness = {"as_of": as_of, "age_days": age_days,
                 "stale": (age_days is not None and age_days > STALE_DAYS)}

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
    net_worth = nw["net_worth"]
    true_net_worth = tnw["true_net_worth"] if tnw else net_worth

    # ── Holdings, sleeve split, household allocation ─────────────
    holds = [dict(r) for r in c.execute(
        "SELECT code, name, cls, account_type, value_jpy, pl_pct FROM holding "
        "WHERE snapshot_id=? AND cls!='CASH' ORDER BY value_jpy DESC", (sid,))]
    inv_total = sum(h["value_jpy"] for h in holds) or 1
    bond_val = sum(h["value_jpy"] for h in holds
                   if "Bond" in (h["name"] or "") or "DevBond" in (h["code"] or ""))
    equity_val = inv_total - bond_val
    usd_val = sum(h["value_jpy"] for h in holds if h["cls"] == "US")

    alloc_sleeve = {"equity": round(100 * equity_val / inv_total, 1),
                    "bond": round(100 * bond_val / inv_total, 1), "cash": 0.0}
    alloc_household = {
        "equity": round(100 * equity_val / net_worth, 1) if net_worth else None,
        "bond": round(100 * bond_val / net_worth, 1) if net_worth else None,
        "cash": round(100 * nw["cash_total"] / net_worth, 1) if net_worth else None,
    }

    balance = {
        "as_of": as_of,
        "true_net_worth": true_net_worth,
        "total_liabilities": (tnw["total_liabilities"] if tnw else 0),
        "cash_total": nw["cash_total"],
        "invested_total": nw["invested_total"],
        "idle_cash_beyond_ef": nw["idle_cash_beyond_ef"],
        "cash_pct": alloc_household["cash"],
        "invested_pct": round(100 * nw["invested_total"] / net_worth, 1) if net_worth else None,
        "alloc_household": alloc_household,
        "alloc_sleeve": alloc_sleeve,
        "accounts": cash_accounts,
    }

    # ── Cashflow ─────────────────────────────────────────────────
    cf = profile.get("cashflow_jpy", {})
    income = cf.get("monthly_net_income_est")
    expense = cf.get("monthly_expense")
    capacity = (income - expense) if (income is not None and expense is not None) else None
    risk = ips.get("risk", {}) or {}
    cashflow = {
        "income": income, "expense": expense, "savings": capacity,
        "savings_rate_pct": round(100 * capacity / income, 1) if (capacity is not None and income) else None,
        "risk_capacity": risk.get("capacity"),
        "risk_tolerance": risk.get("tolerance"),
    }

    # ── Opportunity cost of idle cash ────────────────────────────
    real_r = (retire_cfg.get("real_return_pct") or 4.0) / 100
    idle = nw["idle_cash_beyond_ef"] or 0
    opportunity = {
        "idle_cash": idle,
        "assumed_real_return_pct": round(real_r * 100, 1),
        "annual_cost": int(idle * real_r),
        "note": "Phí cơ hội/năm nếu idle cash tiếp tục để ~0% thay vì deploy ở real return.",
    }

    # ── Concentration / IPS ──────────────────────────────────────
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
    growth = (ips.get("bucket_targets", {}) or {}).get("growth", {})
    drift = None
    if growth:
        drift = {"equity": round(alloc_sleeve["equity"] - growth.get("equity", 0) * 100, 1),
                 "bond": round(alloc_sleeve["bond"] - growth.get("bond", 0) * 100, 1)}
    ips_block = {
        "max_single_name_pct": cap_single,
        "violations": [{"code": v["code"], "name": v["name"], "pct": v["pct"]} for v in violations],
        "alloc_sleeve": alloc_sleeve,
        "alloc_household": alloc_household,
        "growth_target": {k: round(growth.get(k, 0) * 100, 1) for k in ("equity", "bond", "cash")} if growth else None,
        "drift_pp": drift,
        "positions": positions[:12],
    }

    # ── Goals — SEQUENTIAL netting from a shared cash pool ───────
    cash_pool = nw["cash_total"]
    invested_pool = nw["invested_total"]
    # cash goals consumed in priority order; retirement funded from invested
    prio_rank = {"must_not_fail": 0, "important": 1, "aspirational": 2}
    cfg_goals = sorted(goals_cfg.get("goals", []),
                       key=lambda g: prio_rank.get(g.get("priority"), 9))
    goals_out = []
    for g in cfg_goals:
        target = g.get("target_jpy")
        if g.get("funding_source") == "invested" or g["id"] == "retirement":
            avail = invested_pool
            funded = min(avail, target) if target else avail
            invested_pool -= funded
        else:
            avail = cash_pool
            funded = min(avail, target) if target else 0
            cash_pool -= funded
        pct = round(100 * funded / target, 1) if target else None
        h_m = g.get("horizon_months")
        need = round((target - funded) / h_m) if (target and h_m and funded < target) else 0
        goals_out.append({
            "id": g["id"], "name": g.get("name"), "priority": g.get("priority"),
            "target": target, "funded": int(funded), "pct": pct,
            "horizon_months": h_m, "monthly_needed": need,
            "on_track": (capacity is not None and need <= capacity),
        })
    surplus_cash = int(max(0, cash_pool))   # cash left after all cash goals

    # ── Retirement / FIRE with sensitivity band ─────────────────
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
        fire = _fire(exp, nenkin, nstart, ret_age, swr, r)
        contrib_annual = (ideco + nisa) * 12
        proj = _fv(nw["invested_total"], contrib_annual, r, n)
        fi_age = None
        for k in range(0, life - age + 1):
            if _fv(nw["invested_total"], contrib_annual, r, k) >= fire:
                fi_age = age + k
                break
        sens_fire = {f"{s}": int(_fire(exp, nenkin, nstart, ret_age, s, r)) for s in (0.030, 0.035, 0.040)}
        sens_proj = {f"{round((r + dd) * 100, 1)}": int(_fv(nw["invested_total"], contrib_annual, r + dd, n))
                     for dd in (-0.01, 0, 0.01)}
        retire = {
            "age": age, "retire_age": ret_age, "core": int(_fire(exp, nenkin, nstart, ret_age, swr, r) - max(0, nstart - ret_age) * exp),
            "bridge": int(max(0, nstart - ret_age) * exp),
            "fire_number": int(fire), "projected_at_retire": int(proj),
            "surplus": int(proj - fire), "fi_age": fi_age,
            "contrib_monthly": ideco + nisa, "swr_pct": retire_cfg["safe_withdrawal_rate_pct"],
            "real_return_pct": retire_cfg["real_return_pct"],
            "nenkin_annual": nenkin, "on_track": proj >= fire,
            "fire_range": [min(sens_fire.values()), max(sens_fire.values())],
            "proj_range": [min(sens_proj.values()), max(sens_proj.values())],
            "sens_fire": sens_fire, "sens_proj": sens_proj,
        }

    # ── Mortgage forward scenario (illustrative) ────────────────
    mortgage = None
    house = profile.get("house", {}) or {}
    price = _parse_price(house.get("target_price_jpy"))
    if price:
        down_pct = house.get("down_payment_pct", 0) or 0
        loan = int(price * (1 - down_pct))
        closing = int(price * MTG_CLOSING_PCT)
        monthly = int(_amortized_monthly(loan, MTG_RATE, MTG_TERM_YEARS))
        post_cash = nw["cash_total"] - closing
        dscr = round(monthly / income, 3) if income else None
        mortgage = {
            "price": price, "down_payment_pct": round(down_pct * 100, 1),
            "loan": loan, "closing_costs": closing,
            "rate_pct": round(MTG_RATE * 100, 2), "term_years": MTG_TERM_YEARS,
            "monthly_payment": monthly,
            "tax_credit_yr1": int(loan * MTG_TAX_CREDIT_PCT),
            "post_purchase_cash": int(post_cash),
            "dti_pct": round(100 * monthly / income, 1) if income else None,
            "payment_plus_expense": (monthly + expense) if expense else None,
            "cashflow_after": (income - monthly - expense) if (income and expense) else None,
            "note": f"Minh hoạ: full loan {round((1-down_pct)*100)}%, rate {MTG_RATE*100:.2f}% biến đổi, {MTG_TERM_YEARS}y, 諸費用 {int(MTG_CLOSING_PCT*100)}%.",
        }

    # ── Spending — variance (MoM + trailing avg + category delta) ─
    spend_months = [dict(r) for r in c.execute(
        "SELECT source_month, SUM(amount_jpy) total FROM card_txn "
        "GROUP BY source_month ORDER BY source_month DESC LIMIT 6")]
    spend_cats, cat_delta = [], []
    latest_total = prev_avg = None
    if spend_months:
        latest_m = spend_months[0]["source_month"]
        latest_total = spend_months[0]["total"]
        if len(spend_months) > 1:
            prev_avg = round(sum(m["total"] for m in spend_months[1:]) / (len(spend_months) - 1))
        spend_cats = [dict(r) for r in c.execute(
            "SELECT category, SUM(amount_jpy) total, COUNT(*) n FROM card_txn "
            "WHERE source_month=? GROUP BY category ORDER BY total DESC", (latest_m,))]
        if len(spend_months) > 1:
            prev_m = spend_months[1]["source_month"]
            prev_cats = {r["category"]: r["total"] for r in c.execute(
                "SELECT category, SUM(amount_jpy) total FROM card_txn WHERE source_month=? GROUP BY category", (prev_m,))}
            for sc in spend_cats:
                p = prev_cats.get(sc["category"], 0)
                d = sc["total"] - p
                cat_delta.append({"category": sc["category"], "total": sc["total"],
                                  "delta": d, "spike": (d > 20000 and (p == 0 or sc["total"] > 1.5 * p))})
    spending = {
        "months": spend_months,
        "latest_month": spend_months[0]["source_month"] if spend_months else None,
        "latest_total": latest_total, "prev_avg": prev_avg,
        "delta_vs_avg_pct": (round(100 * (latest_total - prev_avg) / prev_avg, 1)
                             if (latest_total is not None and prev_avg) else None),
        "categories": spend_cats, "category_delta": cat_delta,
    }

    # ── Protection + FX ──────────────────────────────────────────
    prot = profile.get("protection", {}) or {}
    protection = {
        "life_insurance": prot.get("life_insurance"),
        "medical_insurance": prot.get("medical_insurance"),
        "disability_income": prot.get("disability_income"),
        "pension_enrolled": prot.get("pension_enrolled"),
        "pension_since": prot.get("pension_since"),
        "gaps": [k for k, v in (("life_insurance", prot.get("life_insurance")),) if v is None],
    }
    fx = {
        "usd_invested": int(usd_val),
        "usd_invested_pct": round(100 * usd_val / inv_total, 1),
        "base_currency": profile.get("cross_border", {}).get("currency_exposure_target") or "JPY",
        "repatriation_plan": profile.get("cross_border", {}).get("repatriation_plan"),
        "note": "Holdings US định giá USD; base JPY → USD/JPY là rủi ro tỷ giá lên phần đầu tư.",
    }

    # ── Net-worth trend ──────────────────────────────────────────
    trend = [dict(r) for r in c.execute(
        "SELECT s.as_of, v.true_net_worth FROM v_networth_true v "
        "JOIN snapshot s ON s.id=v.snapshot_id ORDER BY s.as_of")]

    # ── Review cadence ───────────────────────────────────────────
    due = []
    cmap = cadence_cfg.get("cadence", {})
    cdays = cadence_cfg.get("cadence_days", {})
    today = date.today()
    for sk, cd in cmap.items():
        lr = review_state.get(sk)
        if not lr:
            overdue, is_due = None, True
        else:
            y, m, d = map(int, lr.split("-"))
            overdue = (today - date(y, m, d)).days
            is_due = overdue >= cdays.get(cd, 9999)
        if is_due:
            due.append({"skill": sk, "cadence": cd, "overdue_days": overdue, "cmd": f"/actio-{sk}"})
    order_c = {"annual": 0, "quarterly": 1, "monthly": 2, "weekly": 3, "daily": 4}
    due.sort(key=lambda x: order_c.get(x["cadence"], 9))

    # ── Next best action — synthesized, prioritized ─────────────
    actions = []
    if idle > 1_000_000:
        actions.append({
            "rank": 1, "kind": "deploy",
            "title": f"Deploy idle cash {idle:,}¥ qua iDeCo + NISA",
            "why": f"Phí cơ hội ~{int(idle*real_r):,}¥/năm nếu để ~0%. Household equity chỉ {alloc_household['equity']}% trong khi risk capacity {risk.get('capacity')}.",
        })
    if alloc_household["equity"] is not None and risk.get("capacity") == "high" and alloc_household["equity"] < 40:
        actions.append({
            "rank": 2, "kind": "underinvested",
            "title": "Under-invested so với capacity — nâng tỷ trọng đầu tư",
            "why": f"Equity household {alloc_household['equity']}% << capacity cho phép; nút thắt là cash drag, KHÔNG phải over-risk.",
        })
    for v in violations:
        actions.append({
            "rank": 3, "kind": "concentration",
            "title": f"Trim {v['name']} {v['pct']}% → ≤{cap_single}%",
            "why": f"Vượt trần single-name {cap_single}% trong sleeve. Đang lỗ trong NISA → bán không ghi lỗ thuế.",
        })
    if retire and retire["on_track"]:
        actions.append({
            "rank": 4, "kind": "retire",
            "title": f"Hưu on-track (FI ~{retire['fi_age']}) — giữ nhịp đóng",
            "why": f"FIRE ~{retire['fire_number']:,}¥ (dải {retire['fire_range'][0]:,}–{retire['fire_range'][1]:,}). Không cần tăng tiết kiệm cho hưu.",
        })
    actions.sort(key=lambda a: a["rank"])

    c.close()
    return {
        "ok": True, "as_of": as_of, "staleness": staleness,
        "balance": balance, "cashflow": cashflow, "opportunity": opportunity,
        "goals": goals_out, "surplus_cash": surplus_cash,
        "ips": ips_block, "retire": retire, "mortgage": mortgage,
        "spending": spending, "protection": protection, "fx": fx,
        "trend": trend, "review_due": due, "actions": actions,
    }
