# BD — Actio Plan Cockpit (build plan cho Codex)

**Date:** 2026-07-04 · **Status:** 🟢 Approved (goal-mode) · **SD:** `SD-plan-cockpit.md` (đọc trước — contract ở đó)
**Executor:** Codex · **Reviewer:** Claude

## Files touched (KHÔNG file nào khác)
| File | Việc |
|---|---|
| `opus-consilium/api/actio.py` | Sửa `actio_plan()` + thêm 2 endpoint state + helpers |
| `opus-animus/apps/opus-home/index.html` | Thêm tab "Plan" + `PlanView` |

`data/_local/plan-config.json` ĐÃ TỒN TẠI (Claude tạo sẵn). `plan-state.json` do backend tạo khi POST đầu tiên — code phải chịu được file chưa tồn tại.

## Step 1 — Backend state (WS2)
1. Helpers trong `actio.py`: `_load_plan_config()` (`LOCAL / "plan-config.json"`, thiếu → `{}`), `_load_plan_state()` (thiếu → `{}`), `_save_plan_state(state)` — ghi tmp rồi `os.replace` (atomic).
2. `GET /actio/plan/state` → `{"ok": True, "state": _load_plan_state()}`.
3. `POST /actio/plan/state` — body dict (không phải dict → `{"ok": False, "error": "..."}`); deep-merge đệ quy vào state hiện tại (dict-merge, giá trị khác dict thì ghi đè); save; trả `{"ok": True, "state": <mới>}`.
   - **Verify:** `curl -X POST localhost:8765/api/actio/plan/state -H "Content-Type: application/json" -d "{\"checklist\":{\"2026-07\":{\"auto_invest\":true}}}"` → GET lại thấy giá trị; file `_local/plan-state.json` xuất hiện.

## Step 2 — `/actio/plan` v2 (WS1+WS3)
Viết lại `actio_plan()` theo contract SD §3.1. Nguyên tắc: **số plan lấy từ plan-config.json, số thực lấy từ `actio_overview()`**, state từ plan-state.json.
1. `monthly`: waterfall/bonus_rule/checklist_template từ config; `checklist_month` = `date.today().strftime("%Y-%m")`; mỗi item checklist merge `checked` từ `state["checklist"][month]`; `oneoff` merge done + `overdue = (not done and today > deadline)`; `contrib_actual_month` từ state (thiếu → zeros); `dca`: `done_months`/`done_amount` đếm từ `state["tranches"]` có `done:true`, `on_schedule` = done_months ≥ số tháng đã qua kể từ `start_month` (clamp 0..months).
2. `medium.house`: giữ mortgage từ overview, thêm `dti_stress_pct` = trả góp tính lại @ `rate + stress_add_pp` (dùng `_amortized_monthly`) / net income × 100, `stress_rate_pct`, `gate_ok = dti ≤ dti_max_pct and dti_stress ≤ dti_stress_max_pct`, `window_years`.
3. `long`: giữ blocks/bridge hiện có; `glide` target từ **config** (thay công thức equity_at hardcode: bond_pct theo bracket `age_to`); thêm `bond_actual_pct` = `ips.alloc_sleeve.bond` từ overview.
4. `kpis`: build list 12 item đúng thứ tự SD §3.1, verdict theo ngưỡng `kpi_thresholds` + dữ liệu overview/state. Data thiếu → verdict `unknown`, không crash. Mỗi item: `{id,label,target,actual,verdict}` (actual = string đã format).
   - **Verify:** `curl localhost:8765/api/actio/plan` → JSON có `plan_version:3`, `kpis` 12 phần tử, `monthly.waterfall` 5 bậc, `medium.house.dti_stress_pct` > `dti_pct`.

## Step 3 — PlanView (WS4)
Trong `apps/opus-home/index.html`:
1. Thêm `{ key:"plan", label:"Plan" }` vào mảng tabs (cạnh `actio`) + `plan: <PlanView/>` vào view map (cạnh `actio: <ActioView/>`).
2. `function PlanView()` đặt cạnh `ActioView`, cùng pattern (`useEffect` fetch `api("/api/actio/plan")`, state `{data, err}`, `Loading`/error giữ nguyên pattern). Layout theo SD §4:
   - HERO Card gold: net worth now → FIRE progress bar (`GoldBar`), badge `FI @{fi_age}`, dải projected (dùng 万 cho số lớn).
   - **KPI board**: grid chip 12 KPI — màu verdict: ok=verdigris, warn=amber (`--warn`), violation=`--danger`, unknown=muted. Mỗi chip: label nhỏ + actual đậm + target muted.
   - 3 tab nội bộ THÁNG / 5 NĂM / TỚI HƯU (state local, mặc định THÁNG):
     - THÁNG: waterfall table + tổng; checklist (checkbox → POST `/api/actio/plan/state` body `{"checklist":{[month]:{[id]:bool}}}`, optimistic update); one-off actions card gold (done → strikethrough + ✓; overdue → Badge danger); bonus rule card; DCA progress bar (`done_months/months`).
     - 5 NĂM: year cards (tuổi, invested/cash, net worth, focus nếu có) + house card (DTI @current vs @stress, badge `gate_ok`).
     - TỚI HƯU: bảng blocks (chọn dải low/mid/high bằng toggle 3%/4%/5%) + glide (target bond vs `bond_actual_pct`) + bridge card.
   - Footer disclaimer như ActioView.
3. Toggle 3/4/5% chỉ đổi cột pool hiển thị. Toggle ¥↔万 làm nếu không phá layout (P2 — được phép bỏ).
4. Guard mọi field (`data.monthly?.`, mảng rỗng, `house &&`...). KHÔNG hardcode số thật nào vào JSX.
   - **Verify:** mở `localhost:8765` → tab Plan render không lỗi console; check 1 checkbox → reload → còn nguyên; đổi tab nội bộ không reload trang.

## Test checklist (Definition of Done — từ PLAN-app-rebuild.md)
- [ ] GET /api/actio/plan: kpis[12] verdict đúng ngưỡng config
- [ ] Checklist persist qua reload (plan-state.json)
- [ ] Đổi số trong plan-config.json → API đổi theo, không sửa code
- [ ] DTI hiện cả @current và @+2pp
- [ ] Không số thật trong file tracked; index.html vẫn parse (babel), các tab cũ không hỏng

## Out of scope
Không sửa `actio_overview()`, ActioView, file khác. Không commit. Không thêm dependency.
