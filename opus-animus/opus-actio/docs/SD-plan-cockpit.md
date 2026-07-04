# SD — Actio Plan Cockpit

**Date:** 2026-07-04 · **Status:** 🟢 Approved (goal-mode) · **RD:** `RD-plan-cockpit.md` · **UI brief:** `SD-plan-dashboard.md`
> ⚠️ MỌI CON SỐ trong file này là **MINH HỌA HƯ CẤU**. Số thật chỉ sống ở `data/_local/` + API localhost.

## 1. Kiến trúc

```
data/_local/plan-config.json  ─┐
data/_local/plan-state.json   ─┤→ api/actio.py (mở rộng)          → apps/opus-home/index.html
finance.db + config cũ        ─┘   GET  /api/actio/plan   (v2)       tab "Plan" → PlanView
                                   GET  /api/actio/plan/state
                                   POST /api/actio/plan/state
```

- Không module mới: mở rộng `opus-consilium/api/actio.py` + thêm PlanView vào `opus-animus/apps/opus-home/index.html`.
- `plan-state.json` ghi bằng write-replace (tmp + os.replace) để không hỏng file khi crash.

## 2. File contracts (số HƯ CẤU)

### 2.1 `data/_local/plan-config.json`
```json
{
  "version": 3,
  "plan_date": "2026-07-04",
  "monthly": {
    "waterfall": [
      {"id":"ideco","bucket":"iDeCo","amount":20000},
      {"id":"nisa_tsumitate","bucket":"NISA tsumitate","amount":90000},
      {"id":"nisa_growth","bucket":"NISA growth","amount":90000},
      {"id":"bond","bucket":"Bond sleeve","amount":25000},
      {"id":"dca_buffer","bucket":"DCA đệm","amount":40000}
    ],
    "expense_cap": 210000, "expense_alert": 260000,
    "bonus_rule": {"annual_net":2000000,"split":[{"label":"Index lump-sum","pct":70},{"label":"Đệm nhà","pct":20},{"label":"Bản thân","pct":10}]},
    "checklist_template": [
      {"id":"auto_invest","label":"Auto-invest ngày lương chạy đủ waterfall"},
      {"id":"expense_cap","label":"Chi tiêu trong trần"},
      {"id":"dca_tranche","label":"DCA tranche tháng này đã giải ngân"},
      {"id":"drift_check","label":"Drift equity/bond ≤ 5pp"}
    ]
  },
  "oneoff_actions": [
    {"id":"ideco_activate","title":"Kích hoạt iDeCo","deadline":"2026-10-02"},
    {"id":"tranche_plan","title":"Phân lô idle cash (EF + reserve + DCA)","deadline":"2026-08-15"},
    {"id":"trim_concentration","title":"Trim vi phạm single-name về ≤10%","deadline":"2026-08-15"},
    {"id":"bond_sleeve","title":"Nâng bond sleeve về target","deadline":"2026-09-30"}
  ],
  "dca": {"total":4000000,"start_month":"2026-08","months":15},
  "house": {"reserve":4000000,"dti_max_pct":28,"stress_add_pp":2.0,"dti_stress_max_pct":35,"window_years":[2,3]},
  "glide": [{"age_to":50,"bond_pct":15},{"age_to":54,"bond_pct":30},{"age_to":60,"bond_pct":40}],
  "kpi_thresholds": {"savings_rate_min_pct":50,"single_name_max_pct":10,"drift_max_pp":5,"nisa_annual_target":3600000,"oneoff_overdue_days":90}
}
```

### 2.2 `data/_local/plan-state.json`
```json
{
  "checklist": {"2026-07": {"auto_invest": true, "expense_cap": false}},
  "oneoff": {"ideco_activate": {"done": false, "done_date": null}},
  "tranches": {"2026-08": {"done": true, "amount": 260000}},
  "contrib_actual": {"2026-07": {"ideco": 0, "nisa": 0, "bond": 0}}
}
```
Thiếu file → backend coi như `{}` (mọi thứ chưa làm), không lỗi.

## 3. API contracts

### 3.1 `GET /api/actio/plan` (v2 — thay body hiện tại, giữ path)
Giữ các key hiện có (`north_star`, `monthly`, `medium`, `long`) và mở rộng:
```json
{
 "ok": true, "as_of": "2026-06-21", "plan_version": 3,
 "north_star": {"net_worth_now":0,"projected_at_retire":[0,0],"fire_number":0,"fire_range":[0,0],"fi_age":0,"retire_age":60,"age":0,"on_track":true},
 "monthly": {
   "base_savings": 265000,
   "waterfall": [{"id":"ideco","bucket":"iDeCo","amount":20000}],
   "leak_before": 130000,
   "bonus_rule": {…from config…},
   "checklist": [{"id":"auto_invest","label":"…","checked":true}],
   "checklist_month": "2026-07",
   "oneoff": [{"id":"ideco_activate","title":"…","deadline":"2026-10-02","done":false,"overdue":false}],
   "contrib_status": "target_not_yet_active",
   "contrib_actual_month": {"ideco":0,"nisa":0,"bond":0},
   "dca": {"total":4000000,"months":15,"done_amount":260000,"done_months":1,"on_schedule":true}
 },
 "medium": {
   "years": [{"year":1,"age":39,"invested":0,"cash":0,"net_worth":0}],
   "cash_floor": 0,
   "house": {"…mortgage fields hiện có…","dti_pct":22.0,"dti_stress_pct":31.0,"stress_rate_pct":2.6,"gate_ok":true,"window_years":[2,3]}
 },
 "long": {
   "blocks": [{"ages":[44,46],"pool_low":0,"pool_mid":0,"pool_high":0,"equity_pct":85.0,"bond_pct":15.0}],
   "glide": [{"age":46,"equity":85.0,"bond":15.0}],
   "bond_actual_pct": 6.0,
   "bridge": {"amount":0,"years":5,"nenkin_from65":0,"nenkin_start_age":65},
   "swr_pct": 3.5, "real_return_pct": 4.0
 },
 "kpis": [
   {"id":"savings_rate","label":"Savings rate","target":">=50%","actual":"58%","verdict":"ok"},
   {"id":"contrib","label":"Contrib vs waterfall","target":"100%","actual":"0%","verdict":"violation"},
   {"id":"idle_cash","label":"Idle ngoài EF+reserve","target":"→0 theo lịch","actual":"…","verdict":"warn"},
   {"id":"dca","label":"DCA tranche","target":"đúng lịch","actual":"1/15","verdict":"ok"},
   {"id":"single_name","label":"Single-name max","target":"<=10%","actual":"24.8%","verdict":"violation"},
   {"id":"drift","label":"Sleeve drift","target":"<=5pp","actual":"9.4pp","verdict":"warn"},
   {"id":"nisa","label":"NISA năm nay","target":"3.6M","actual":"0","verdict":"violation"},
   {"id":"dti","label":"DTI @stress","target":"<=35%","actual":"31%","verdict":"ok"},
   {"id":"fi","label":"FI progress","target":"on-track band","actual":"…","verdict":"ok"},
   {"id":"glide","label":"Bond vs glide","target":"15%","actual":"6%","verdict":"warn"},
   {"id":"review","label":"Review due","target":"0 quá hạn","actual":"1","verdict":"warn"},
   {"id":"oneoff","label":"One-off ≤90 ngày","target":"0 overdue","actual":"0","verdict":"ok"}
 ]
}
```
Verdict rules: `ok` đạt ngưỡng · `warn` lệch nhưng chưa vi phạm cứng (hoặc data thiếu → `unknown`) · `violation` vượt ngưỡng cứng. Ngưỡng lấy từ `kpi_thresholds` + IPS + goals — không hardcode trong code Python ngoài mapping verdict.

### 3.2 `GET /api/actio/plan/state` → nội dung plan-state.json (hoặc `{}`).
### 3.3 `POST /api/actio/plan/state`
Body = deep-merge patch, ví dụ `{"checklist":{"2026-07":{"dca_tranche":true}}}` hoặc `{"oneoff":{"ideco_activate":{"done":true,"done_date":"2026-07-15"}}}`. Backend deep-merge vào file, write-replace, trả state mới. Không validate schema chặt (personal tool) nhưng reject body không phải dict.

## 4. Frontend — PlanView (theo `SD-plan-dashboard.md`)

- Đăng ký tab: thêm `{ key:"plan", label:"Plan" }` vào mảng tabs + `plan: <PlanView/>` vào view map trong `apps/opus-home/index.html`.
- `PlanView` fetch `/api/actio/plan`; checklist + oneoff toggle → `POST /api/actio/plan/state` rồi cập nhật local state (optimistic).
- Layout: HERO north star (progress bar tới FIRE + badge FI age) → **KPI board** (grid 12 chip, màu theo verdict: verdigris/amber/danger) → timeline spine → 3 tab THÁNG / 5 NĂM / TỚI HƯU như design brief §4. Scenario toggle 3/4/5% chỉ đổi cột pool_low/mid/high + dải projection (client-side). Toggle ¥↔万 = P2, làm nếu rẻ.
- Tái dùng `Card/Label/GoldBar/Badge/StatusDot/Loading`, CSS vars sẵn có. Guard mọi field optional.

## 5. Trade-offs đã chốt
- JSON file state (không SQLite) — 1 user, tần suất ghi thấp, dễ sửa tay, giữ NFR-2.
- Giữ path `/api/actio/plan` (breaking change nội bộ OK — chưa có consumer nào ngoài PlanView sắp build).
- Scenario 3 dải tính sẵn server-side (blocks low/mid/high) thay vì client tự compound — client chỉ chọn hiển thị.
