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
import os
import sqlite3
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Body

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


def _load_plan_config():
    data = _load(LOCAL / "plan-config.json")
    return data if isinstance(data, dict) else {}


def _load_plan_state():
    data = _load(LOCAL / "plan-state.json")
    return data if isinstance(data, dict) else {}


def _save_plan_state(state):
    target = LOCAL / "plan-state.json"
    tmp = target.with_name(target.name + ".tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, target)


def _deep_merge(base, patch):
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            _deep_merge(base[key], value)
        else:
            base[key] = value
    return base


def _as_dict(value):
    return value if isinstance(value, dict) else {}


def _as_list(value):
    return value if isinstance(value, list) else []


def _num(value, default=None):
    if isinstance(value, bool):
        return default
    if isinstance(value, (int, float)):
        return float(value)
    return default


def _fmt_jpy(value):
    n = _num(value)
    return "unknown" if n is None else f"{int(round(n)):,} JPY"


def _fmt_pct(value, digits=0):
    n = _num(value)
    if n is None:
        return "unknown"
    return f"{round(n, digits):g}%"


def _fmt_pp(value, digits=1):
    n = _num(value)
    if n is None:
        return "unknown"
    return f"{round(n, digits):g}pp"


def _fmt_m(value):
    n = _num(value)
    return "unknown" if n is None else f"{n / 1_000_000:g}M"


def _safe_pct(numerator, denominator):
    n = _num(numerator)
    d = _num(denominator)
    if n is None or not d:
        return None
    return 100 * n / d


def _parse_iso_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError:
        return None


def _months_elapsed(start_month, today, total_months):
    try:
        start = datetime.strptime(str(start_month), "%Y-%m").date()
    except ValueError:
        return 0
    elapsed = (today.year - start.year) * 12 + (today.month - start.month) + 1
    return int(max(0, min(total_months or 0, elapsed)))


def _bond_target_for_age(age, glide_cfg):
    a = _num(age)
    rows = []
    for row in _as_list(glide_cfg):
        age_to = _num(_as_dict(row).get("age_to"))
        bond = _num(_as_dict(row).get("bond_pct"))
        if age_to is not None and bond is not None:
            rows.append((age_to, bond))
    if a is None or not rows:
        return None
    rows.sort(key=lambda item: item[0])
    for age_to, bond in rows:
        if a <= age_to:
            return bond
    return rows[-1][1]


def _kpi(kid, label, target, actual, verdict):
    return {
        "id": kid,
        "label": label,
        "target": target,
        "actual": actual,
        "verdict": verdict if verdict in {"ok", "warn", "violation", "unknown"} else "unknown",
    }


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
            "nenkin_start_age": nstart,
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


@router.get("/actio/plan/state")
def actio_plan_state():
    return {"ok": True, "state": _load_plan_state()}


@router.post("/actio/plan/state")
def actio_plan_state_update(patch: Any = Body(None)):
    if not isinstance(patch, dict):
        return {"ok": False, "error": "body must be a JSON object"}
    state = _load_plan_state()
    _deep_merge(state, patch)
    _save_plan_state(state)
    return {"ok": True, "state": state}


@router.get("/actio/plan")
def actio_plan():
    ov = actio_overview()
    if not ov.get("ok"):
        return {"ok": False, "error": ov.get("error", "overview failed")}

    cfg = _load_plan_config()
    state = _load_plan_state()
    today = date.today()
    checklist_month = today.strftime("%Y-%m")
    current_year = today.strftime("%Y")

    monthly_cfg = _as_dict(cfg.get("monthly"))
    house_cfg = _as_dict(cfg.get("house"))
    dca_cfg = _as_dict(cfg.get("dca"))
    thresholds = _as_dict(cfg.get("kpi_thresholds"))
    glide_cfg = _as_list(cfg.get("glide"))

    bal = _as_dict(ov.get("balance"))
    cfw = _as_dict(ov.get("cashflow"))
    ret = _as_dict(ov.get("retire"))
    ips = _as_dict(ov.get("ips"))

    waterfall = []
    for item in _as_list(monthly_cfg.get("waterfall")):
        row = _as_dict(item)
        if row:
            waterfall.append({
                "id": row.get("id"),
                "bucket": row.get("bucket"),
                "amount": row.get("amount"),
            })
    waterfall_total = sum(_num(row.get("amount"), 0) or 0 for row in waterfall)

    checklist_state = _as_dict(_as_dict(state.get("checklist")).get(checklist_month))
    checklist = []
    for item in _as_list(monthly_cfg.get("checklist_template")):
        row = _as_dict(item)
        item_id = row.get("id")
        checklist.append({
            "id": item_id,
            "label": row.get("label"),
            "checked": bool(checklist_state.get(item_id, False)),
        })

    oneoff_state = _as_dict(state.get("oneoff"))
    oneoff = []
    for item in _as_list(cfg.get("oneoff_actions")):
        row = _as_dict(item)
        item_id = row.get("id")
        saved = _as_dict(oneoff_state.get(item_id))
        done = bool(saved.get("done", False))
        deadline = _parse_iso_date(row.get("deadline"))
        overdue_days = (today - deadline).days if (deadline and not done and today > deadline) else 0
        oneoff.append({
            "id": item_id,
            "title": row.get("title"),
            "deadline": row.get("deadline"),
            "done": done,
            "done_date": saved.get("done_date"),
            "overdue": overdue_days > 0,
            "overdue_days": overdue_days,
        })

    contrib_actual_all = _as_dict(state.get("contrib_actual"))
    contrib_actual_month = {
        "ideco": 0,
        "nisa": 0,
        "bond": 0,
        **_as_dict(contrib_actual_all.get(checklist_month)),
    }
    contrib_actual_total = sum(_num(v, 0) or 0 for v in contrib_actual_month.values())
    if waterfall_total <= 0:
        contrib_status = "no_target"
    elif contrib_actual_total >= waterfall_total:
        contrib_status = "complete"
    elif contrib_actual_total > 0:
        contrib_status = "partial"
    else:
        contrib_status = "target_not_yet_active"

    dca_months = int(_num(dca_cfg.get("months"), 0) or 0)
    dca_total = _num(dca_cfg.get("total"), 0) or 0
    tranches = _as_dict(state.get("tranches"))
    done_tranches = [_as_dict(v) for v in tranches.values() if _as_dict(v).get("done") is True]
    dca_done_months = len(done_tranches)
    dca_done_amount = int(sum(_num(v.get("amount"), 0) or 0 for v in done_tranches))
    dca_due_months = _months_elapsed(dca_cfg.get("start_month"), today, dca_months)
    dca = {
        "total": dca_cfg.get("total"),
        "start_month": dca_cfg.get("start_month"),
        "months": dca_cfg.get("months"),
        "done_amount": dca_done_amount,
        "done_months": dca_done_months,
        "due_months": dca_due_months,
        "on_schedule": (dca_done_months >= dca_due_months) if dca_months else None,
    }

    base_savings = cfw.get("savings")
    leak_before = None
    if _num(base_savings) is not None:
        leak_before = int(max(0, (_num(base_savings) or 0) - waterfall_total))
    bonus_rule = _as_dict(monthly_cfg.get("bonus_rule"))
    monthly = {
        "base_savings": base_savings,
        "waterfall": waterfall,
        "leak_before": leak_before,
        "bonus_rule": bonus_rule,
        "checklist": checklist,
        "checklist_month": checklist_month,
        "oneoff": oneoff,
        "contrib_status": contrib_status,
        "contrib_actual_month": contrib_actual_month,
        "dca": dca,
    }

    north_star = {
        "net_worth_now": bal.get("true_net_worth"),
        "projected_at_retire": ret.get("proj_range") or ret.get("projected_at_retire"),
        "fire_number": ret.get("fire_number"),
        "fire_range": ret.get("fire_range"),
        "fi_age": ret.get("fi_age"),
        "retire_age": ret.get("retire_age"),
        "age": ret.get("age"),
        "on_track": ret.get("on_track"),
    }

    r = (_num(ret.get("real_return_pct"), 0) or 0) / 100
    annual_contrib = waterfall_total * 12 + (_num(bonus_rule.get("annual_net"), 0) or 0)
    invested0 = _num(bal.get("invested_total"), 0) or 0
    cash0 = _num(bal.get("cash_total"), 0) or 0
    liab = _num(bal.get("total_liabilities"), 0) or 0
    age = _num(north_star.get("age"))
    ret_age = _num(north_star.get("retire_age"))

    ef_floor = 0
    for goal in _as_list(ov.get("goals")):
        row = _as_dict(goal)
        if row.get("id") == "emergency":
            ef_floor = _num(row.get("target"), 0) or 0
            break
    cash_floor = int(ef_floor + (_num(house_cfg.get("reserve"), 0) or 0))

    years = []
    inv = invested0
    cash = cash0
    dca_remaining_months = dca_months
    dca_monthly = dca_total / dca_months if dca_months else 0
    window_years = set(house_cfg.get("window_years") or [])
    if age is not None:
        for y in range(1, 6):
            deploy_months = min(12, max(0, dca_remaining_months))
            tranche = dca_monthly * deploy_months
            dca_remaining_months -= deploy_months
            cash = max(cash_floor, cash - tranche)
            inv = inv * (1 + r) + annual_contrib + tranche
            row = {
                "year": y,
                "age": int(age + y),
                "invested": int(inv),
                "cash": int(cash),
                "net_worth": int(inv + cash - liab),
            }
            focus = []
            if deploy_months:
                focus.append("DCA")
            if y in window_years:
                focus.append("house gate")
            if focus:
                row["focus"] = " + ".join(focus)
            years.append(row)

    house = None
    mortgage = ov.get("mortgage")
    if isinstance(mortgage, dict):
        house = dict(mortgage)
        rate_pct = _num(house.get("rate_pct"))
        stress_add_pp = _num(house_cfg.get("stress_add_pp"), 0) or 0
        stress_rate_pct = (rate_pct + stress_add_pp) if rate_pct is not None else None
        income = _num(cfw.get("income"))
        stress_payment = None
        if stress_rate_pct is not None and house.get("loan") is not None and house.get("term_years"):
            stress_payment = _amortized_monthly(
                _num(house.get("loan"), 0) or 0,
                stress_rate_pct / 100,
                int(_num(house.get("term_years"), 0) or 0),
            )
        dti_stress_pct = round(100 * stress_payment / income, 1) if (stress_payment is not None and income) else None
        dti_pct = _num(house.get("dti_pct"))
        dti_max = _num(house_cfg.get("dti_max_pct"))
        dti_stress_max = _num(house_cfg.get("dti_stress_max_pct"))
        gate_ok = None
        if dti_pct is not None and dti_stress_pct is not None and dti_max is not None and dti_stress_max is not None:
            gate_ok = dti_pct <= dti_max and dti_stress_pct <= dti_stress_max
        house.update({
            "dti_stress_pct": dti_stress_pct,
            "stress_rate_pct": round(stress_rate_pct, 2) if stress_rate_pct is not None else None,
            "gate_ok": gate_ok,
            "window_years": house_cfg.get("window_years"),
        })

    medium = {
        "years": years,
        "cash_floor": cash_floor,
        "house": house,
    }

    blocks = []
    if age is not None and ret_age is not None:
        inv5 = inv
        base_age = age + 5
        a = base_age + 1
        while a <= ret_age:
            hi_age = min(a + 2, ret_age)
            n = hi_age - base_age
            pool = {}
            for tag, rr in (("low", r - 0.01), ("mid", r), ("high", r + 0.01)):
                pool[tag] = int(_fv(inv5, annual_contrib, rr, int(n)))
            bond_pct = _bond_target_for_age(hi_age, glide_cfg)
            equity_pct = round(100 - bond_pct, 1) if bond_pct is not None else None
            blocks.append({
                "ages": [int(a), int(hi_age)],
                "pool_low": pool["low"],
                "pool_mid": pool["mid"],
                "pool_high": pool["high"],
                "equity_pct": equity_pct,
                "bond_pct": bond_pct,
            })
            a += 3

    nstart = ret.get("nenkin_start_age")
    bridge_years = max(0, nstart - ret_age) if (_num(nstart) is not None and ret_age is not None) else 0
    alloc_sleeve = _as_dict(ips.get("alloc_sleeve"))
    long = {
        "blocks": blocks,
        "glide": [{"age": b["ages"][1], "equity": b["equity_pct"], "bond": b["bond_pct"]} for b in blocks],
        "bond_actual_pct": alloc_sleeve.get("bond"),
        "bridge": {
            "amount": ret.get("bridge"),
            "years": bridge_years,
            "nenkin_from65": ret.get("nenkin_annual"),
            "nenkin_start_age": nstart,
        },
        "swr_pct": ret.get("swr_pct"),
        "real_return_pct": ret.get("real_return_pct"),
    }

    savings_min = _num(thresholds.get("savings_rate_min_pct"))
    savings_rate = _num(cfw.get("savings_rate_pct"))
    savings_verdict = "unknown" if savings_min is None or savings_rate is None else ("ok" if savings_rate >= savings_min else "violation")

    contrib_pct = _safe_pct(contrib_actual_total, waterfall_total)
    if contrib_pct is None:
        contrib_verdict = "unknown"
    elif contrib_pct >= 100:
        contrib_verdict = "ok"
    elif contrib_actual_total > 0:
        contrib_verdict = "warn"
    else:
        contrib_verdict = "violation"

    idle_cash = _num(_as_dict(ov.get("opportunity")).get("idle_cash"))
    idle_verdict = "unknown" if idle_cash is None else ("ok" if idle_cash <= 0 else "warn")

    single_limit = _num(thresholds.get("single_name_max_pct"), _num(ips.get("max_single_name_pct")))
    positions = _as_list(ips.get("positions"))
    single_pcts = [_num(_as_dict(p).get("pct")) for p in positions if _as_dict(p).get("single_stock")]
    single_pcts = [p for p in single_pcts if p is not None]
    if not single_pcts:
        single_pcts = [_num(_as_dict(v).get("pct")) for v in _as_list(ips.get("violations"))]
        single_pcts = [p for p in single_pcts if p is not None]
    single_max = max(single_pcts) if single_pcts else None
    single_verdict = "unknown" if single_limit is None or single_max is None else ("ok" if single_max <= single_limit else "violation")

    drift_limit = _num(thresholds.get("drift_max_pp"))
    drift_values = [abs(v) for v in (_num(x) for x in _as_dict(ips.get("drift_pp")).values()) if v is not None]
    drift_max = max(drift_values) if drift_values else None
    drift_verdict = "unknown" if drift_limit is None or drift_max is None else ("ok" if drift_max <= drift_limit else "warn")

    nisa_target = _num(thresholds.get("nisa_annual_target"))
    nisa_actual_year = 0
    for month, values in contrib_actual_all.items():
        if str(month).startswith(current_year):
            for key, value in _as_dict(values).items():
                if "nisa" in str(key):
                    nisa_actual_year += _num(value, 0) or 0
    if nisa_target is None:
        nisa_verdict = "unknown"
    elif nisa_actual_year >= nisa_target:
        nisa_verdict = "ok"
    elif nisa_actual_year > 0:
        nisa_verdict = "warn"
    else:
        nisa_verdict = "violation"

    dti_stress_max = _num(house_cfg.get("dti_stress_max_pct"))
    dti_stress = _num(_as_dict(house).get("dti_stress_pct")) if house else None
    dti_verdict = "unknown" if dti_stress is None or dti_stress_max is None else ("ok" if dti_stress <= dti_stress_max else "violation")

    fi_state = north_star.get("on_track")
    fi_verdict = "unknown" if fi_state is None else ("ok" if fi_state else "violation")

    glide_target_now = _bond_target_for_age(age, glide_cfg)
    bond_actual = _num(long.get("bond_actual_pct"))
    glide_diff = abs(bond_actual - glide_target_now) if bond_actual is not None and glide_target_now is not None else None
    glide_verdict = "unknown" if glide_diff is None or drift_limit is None else ("ok" if glide_diff <= drift_limit else "warn")

    review_count = len(_as_list(ov.get("review_due")))
    oneoff_overdue = [item for item in oneoff if item.get("overdue")]
    oneoff_overdue_count = len(oneoff_overdue)
    oneoff_max_days = max([item.get("overdue_days") or 0 for item in oneoff_overdue], default=0)
    oneoff_limit = _num(thresholds.get("oneoff_overdue_days"))
    if oneoff_overdue_count == 0:
        oneoff_verdict = "ok"
    elif oneoff_limit is not None and oneoff_max_days > oneoff_limit:
        oneoff_verdict = "violation"
    else:
        oneoff_verdict = "warn"

    kpis = [
        _kpi("savings_rate", "Savings rate", f">={_fmt_pct(savings_min)}", _fmt_pct(savings_rate), savings_verdict),
        _kpi("contrib", "Contrib vs waterfall", "100%", _fmt_pct(contrib_pct), contrib_verdict),
        _kpi("idle_cash", "Idle ngoai EF+reserve", "0 by schedule", _fmt_jpy(idle_cash), idle_verdict),
        _kpi("dca", "DCA tranche", "on schedule", f"{dca_done_months}/{dca_months or 0}", "unknown" if dca["on_schedule"] is None else ("ok" if dca["on_schedule"] else "warn")),
        _kpi("single_name", "Single-name max", f"<={_fmt_pct(single_limit)}", _fmt_pct(single_max, 1), single_verdict),
        _kpi("drift", "Sleeve drift", f"<={_fmt_pp(drift_limit)}", _fmt_pp(drift_max), drift_verdict),
        _kpi("nisa", "NISA nam nay", _fmt_m(nisa_target), _fmt_jpy(nisa_actual_year), nisa_verdict),
        _kpi("dti", "DTI @stress", f"<={_fmt_pct(dti_stress_max)}", _fmt_pct(dti_stress, 1), dti_verdict),
        _kpi("fi", "FI progress", "on-track band", f"FI @{north_star.get('fi_age')}" if north_star.get("fi_age") else "unknown", fi_verdict),
        _kpi("glide", "Bond vs glide", _fmt_pct(glide_target_now, 1), _fmt_pct(bond_actual, 1), glide_verdict),
        _kpi("review", "Review due", "0 due", str(review_count), "ok" if review_count == 0 else "warn"),
        _kpi("oneoff", "One-off <= threshold", "0 overdue", str(oneoff_overdue_count), oneoff_verdict),
    ]

    return {
        "ok": True,
        "as_of": ov.get("as_of"),
        "plan_version": cfg.get("version"),
        "north_star": north_star,
        "monthly": monthly,
        "medium": medium,
        "long": long,
        "kpis": kpis,
    }
