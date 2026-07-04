# BD — Actio Plan Cockpit: KPI status engine refactor (v2)

**Owner spec:** Claude (Opus review + Phase 0 discovery) · **Thực thi:** Codex · **Reviewer:** Claude
**Ngày:** 2026-07-05 · **Nguồn:** yêu cầu user (refactor prompt) + Phase 0 discovery đã xác nhận 3 bug thật trong verdict logic hiện tại.

> ⚠️ FRESH START: KHÔNG hỏi tiếp tục/mới, KHÔNG đọc ai/status.md trước. Đọc file này rồi làm thẳng, theo đúng thứ tự các bước.

## 0. Bối cảnh đã xác nhận (Phase 0 discovery, không đoán)

- `apps/opus-home/index.html` là 1 file HTML tự chứa, React JSX qua Babel-in-browser — không build step, không JS test framework.
- Verdict của 12 KPI được tính **ở backend Python** (`opus-consilium/api/actio.py::actio_plan()`, dòng ~800–884), không phải frontend. Frontend chỉ nhận string đã tính sẵn (`k.actual`, `k.target`, `k.verdict`) và tô màu.
- pytest **đã có sẵn** qua `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe` (pytest 9.0.3) — không cần cài thêm gì.
- **3 bug xác nhận thật** trong verdict hiện tại (không phải giả thuyết):
  1. `drift` (sleeve equity/bond drift 9.4pp vs ngưỡng ≤5pp): code hiện tại chỉ có 2 state ok/warn cho metric này — **không bao giờ lên mức nghiêm trọng nhất dù vượt ngưỡng gần 2×**.
  2. `dti` (34.2% vs ngưỡng ≤35%): code hiện tại chỉ so sánh boolean (`<= → ok`) — 34.2/35 = 97.7% khoảng cách tới ngưỡng nhưng vẫn hiện **"ok" (xanh)**, đáng lẽ phải cảnh báo vì quá sát.
  3. `contrib` (đóng góp vs waterfall): 0% trước ngày lương hiện lên thẳng **"violation" (đỏ)** dù chưa tới hạn — không có khái niệm "chưa tới hạn".

## 1. Quyết định phạm vi (đã chốt với user, không tự suy diễn thêm)

- Áp dụng hệ 4-state **pending/ok/warn/breach** cho **cả 12 KPI** (không chỉ 3 cái có bug).
- Currency compact (`¥9.68M`) trong card KPI: sửa ở **backend** (thêm `_fmt_compact()`, đổi các lệnh gọi `_kpi(...)` đang dùng `_fmt_jpy`/`_fmt_m` sang compact) — KHÔNG đổi shape payload, KHÔNG bắt frontend tự format lại.
- Unit test: viết bằng **pytest ở backend Python**, không viết lại logic ở JS.

## 2. Files touched

| File | Việc |
|---|---|
| `opus-animus/opus-consilium/api/kpi_status.py` | **MỚI** — pure function `get_kpi_status()`, không I/O |
| `opus-animus/opus-consilium/api/tests/__init__.py` | **MỚI** — rỗng, để pytest nhận diện package |
| `opus-animus/opus-consilium/api/tests/test_kpi_status.py` | **MỚI** — pytest, tối thiểu 3 case xác nhận + thêm case cho từng kind |
| `opus-animus/opus-consilium/api/actio.py` | Sửa: import `kpi_status`, thay toàn bộ 12 verdict trong `actio_plan()` để gọi qua `get_kpi_status()`; thêm `_fmt_compact()`; thêm pending-wiring cho `contrib`/`dca`; thêm field `nisa_lifetime` (None + note TODO); thêm `next_action` field (banner data) |
| `opus-animus/opus-actio/data/_local/plan-config.json` | Thêm `monthly.payday_day` (số ngày trong tháng, ví dụ 25) + `action_templates` (12 entry) |
| `opus-animus/apps/opus-home/index.html` | `PlanView`: banner next-action, gom 4 nhóm Foundation/Structure/Growth/Governance, icon+aria-label theo status, xoá card `fi` (đã trùng hero badge), thêm card NISA lifetime (N/A nếu thiếu data) |

## 3. Bước 1 — `kpi_status.py` (pure, testable)

```python
def get_kpi_status(kind, **kwargs) -> str:
    """Returns one of: "pending", "ok", "warn", "breach"."""
```

4 kind, KHÔNG ép mọi metric vào cùng 1 công thức số học (một số metric là boolean/count, ép vào % khoảng cách sẽ vô nghĩa — quyết định kỹ thuật này viết rõ trong docstring để không ai tưởng là thiếu sót):

1. **`threshold_band`** — dùng cho: `savings_rate`, `contrib`, `idle_cash`, `dca`, `single_name`, `drift`, `nisa`, `dti`, `glide`.
   Params: `actual`, `threshold`, `direction` (`"<="` hoặc `">="`), `pending=False`.
   - Nếu `pending=True` hoặc `actual is None` hoặc `threshold is None` → `"pending"`.
   - Nếu `threshold == 0`: `"ok"` nếu (`direction=="<=" and actual<=0`) hoặc (`direction==">=" and actual>=0`), ngược lại `"breach"`.
   - Ngược lại `ratio = actual/threshold`:
     - `direction=="<="`: `ratio<=0.8 → ok`; `0.8<ratio<=1.0 → warn`; `ratio>1.0 → breach`.
     - `direction==">="`: `ratio>=1.0 → ok`; `0.8<=ratio<1.0 → warn`; `ratio<0.8 → breach`.
2. **`count_step`** — dùng cho `review` (số review quá hạn). Params: `count`, `warn_at=1`, `breach_at=2`. `count>=breach_at→breach`; `count>=warn_at→warn`; else `ok`. Không có pending.
3. **`day_severity`** — dùng cho `oneoff`. Params: `overdue_count`, `max_days`, `limit_days`. `overdue_count==0→ok`; `limit_days is not None and max_days>limit_days→breach`; else `warn`.
4. **`boolean_flip`** — dùng cho `fi`. Params: `is_ok` (bool hoặc None). `None→pending`; `True→ok`; `False→breach`. (Không có "warn" cho FI — on_track đã tự bao gồm biên an toàn từ chính phép tính FIRE, không cần band thêm — ghi rõ lý do trong comment.)

## 4. Bước 2 — Wire vào `actio.py`

Tại mỗi chỗ tính verdict hiện tại (dòng ~800-870), thay bằng gọi `get_kpi_status(...)` tương ứng:

| KPI id | kind | actual | threshold/params | direction | pending khi nào |
|---|---|---|---|---|---|
| `savings_rate` | threshold_band | `savings_rate` | `savings_min` | `>=` | — |
| `contrib` | threshold_band | `contrib_pct` | `100` | `>=` | `contrib_actual_total==0` **và** `today.day < payday_day` (đọc `monthly.payday_day` từ plan-config, mặc định 25 nếu thiếu) |
| `idle_cash` | threshold_band | `idle_cash` | `expected_idle_now` = `dca_total * (1 - dca_due_months/dca_months)` nếu `dca_months>0` else `dca_total` (dùng biến `dca_total`/`dca_months`/`dca_due_months` đã có sẵn trong hàm) | `<=` | — |
| `dca` | threshold_band | `dca_done_months` | `dca_due_months` | `>=` | `dca_due_months==0` (chưa tới `start_month`) |
| `single_name` | threshold_band | `single_max` | `single_limit` | `<=` | — |
| `drift` | threshold_band | `drift_max` | `drift_limit` | `<=` | — |
| `nisa` | threshold_band | `nisa_actual_year` | `nisa_target` | `>=` | — |
| `dti` | threshold_band | `dti_stress` | `dti_stress_max` | `<=` | — |
| `fi` | boolean_flip | — | `is_ok=north_star.get("on_track")` | — | — |
| `glide` | threshold_band | `glide_diff` | `drift_limit` (dùng chung ngưỡng 5pp) | `<=` | — |
| `review` | count_step | — | `count=review_count` | — | — |
| `oneoff` | day_severity | — | `overdue_count`, `max_days=oneoff_max_days`, `limit_days=oneoff_limit` | — | — |

`_kpi()` helper: đổi whitelist verdict từ `{"ok","warn","violation","unknown"}` sang `{"pending","ok","warn","breach"}` (bỏ `violation`/`unknown`, mọi chỗ thiếu data giờ trả `"pending"` qua chính `get_kpi_status`, không cần whitelist fallback riêng nữa — nhưng vẫn giữ safety: nếu giá trị lạ lọt vào thì fallback `"pending"`).

**`_fmt_compact(value)`** (mới, cạnh `_fmt_jpy`): trả `f"¥{value/1_000_000:.2f}M"` nếu `abs(value)>=1_000_000`, else `f"¥{value/1_000:.0f}K"` nếu `abs(value)>=1_000`, else `f"¥{int(value)}"`. Dùng cho `actual`/`target` của `idle_cash` (thay `_fmt_jpy`) và `nisa` (thay `_fmt_jpy` cho actual, giữ `_fmt_m` cho target hoặc đổi luôn sang compact cho nhất quán — chọn đổi luôn `_fmt_m`→`_fmt_compact` cho nisa target để đồng bộ 1 convention trong toàn bộ card).

**`nisa_lifetime`** (field mới trong payload, không tính bừa): thêm `"nisa_lifetime": {"value": None, "cap": 18000000, "note": "TODO: chưa có nguồn dữ liệu cumulative NISA lifetime — cần track riêng (không suy ra từ contrib_actual_all vì lịch sử trước khi app này chạy không có trong đó)."}`.

**`next_action`** (field mới): sau khi build xong `kpis` list, tìm KPI có verdict `"breach"` ưu tiên trước, nếu không có thì `"warn"`, bỏ qua `"pending"`/`"ok"`. Lấy template từ `plan-config.json.action_templates[kpi.id][verdict]` (string có `{actual}`/`{target}` placeholder, `.format(actual=kpi["actual"], target=kpi["target"])`). Nếu không tìm thấy KPI nào breach/warn → `next_action = {"message": "Mọi chỉ số ổn định.", "severity": "ok"}`. Nếu có nhưng thiếu template trong config → `next_action = {"message": f"{kpi['label']}: {kpi['actual']} (target {kpi['target']})", "severity": kpi["verdict"]}` (fallback generic, không throw).

## 5. Bước 3 — `plan-config.json`

Thêm:
```json
"monthly": { "...": "...", "payday_day": 25 },
"action_templates": {
  "savings_rate": {"warn": "Savings rate {actual} sát ngưỡng {target} — soát lại chi tiêu tháng này.", "breach": "Savings rate {actual} dưới ngưỡng {target} — kiểm tra ngay nguyên nhân."},
  "contrib": {"warn": "Contrib {actual} chưa đủ waterfall — hoàn tất auto-invest tháng này.", "breach": "Contrib {actual} — chưa nạp gì tháng này, kiểm tra auto-invest."},
  "idle_cash": {"warn": "Idle cash {actual} — gần hết hạn tranche, chuẩn bị giải ngân.", "breach": "Idle cash {actual} — chậm lịch DCA, giải ngân ngay tranche còn thiếu."},
  "dca": {"warn": "DCA tranche {actual} — sắp trễ lịch.", "breach": "DCA tranche {actual} — đã trễ lịch giải ngân."},
  "single_name": {"warn": "Single-name {actual} gần trần {target} — theo dõi.", "breach": "Single-name {actual} vượt trần {target} — trim về dưới ngưỡng."},
  "drift": {"warn": "Sleeve drift {actual} gần ngưỡng {target}.", "breach": "Sleeve drift {actual} vượt ngưỡng {target} — rebalance bằng dòng tiền mới vào sleeve đang thiếu."},
  "nisa": {"warn": "NISA năm nay {actual} chưa đạt {target} — cân nhắc nạp thêm.", "breach": "NISA năm nay {actual} — chưa dùng quota {target}, đang bỏ phí miễn thuế."},
  "dti": {"warn": "DTI @stress {actual} gần trần {target} — thận trọng khi tăng vay.", "breach": "DTI @stress {actual} vượt trần {target} — không nên vay thêm."},
  "glide": {"warn": "Bond vs glide lệch gần ngưỡng.", "breach": "Bond vs glide lệch quá {target} — mua thêm bond sleeve."},
  "review": {"warn": "Có review đến hạn — xem lại review-state.", "breach": "Nhiều review quá hạn — dọn lại lịch review."},
  "oneoff": {"warn": "Có one-off action quá hạn — xử lý sớm.", "breach": "One-off action quá hạn lâu ({actual}) — xử lý ngay."}
}
```
(Không có template cho `fi` vì chỉ ok/breach và FI breach là tình huống nghiêm trọng nhất — vẫn thêm 1 dòng breach: `"fi": {"breach": "Dự phóng FI hiện KHÔNG on-track — xem lại contribution/allocation."}`)

## 6. Bước 4 — `index.html` PlanView

1. **Banner next-action**: Card ngay dưới hero, trước KPI grid. `severity="breach"` → viền đỏ/`--warn` đậm; `"warn"` → viền amber; `"ok"` → viền verdigris nhạt, text muted "Mọi chỉ số ổn định." Đọc từ `d.next_action`.
2. **4 nhóm KPI** thay cho grid phẳng — chia mảng `kpis` theo id cố định (không đoán từ label):
   - Foundation: `idle_cash`, `dti`
   - Structure: `nisa`, `contrib`
   - Growth: `drift`, `single_name`, `glide`, `dca`
   - Governance: `review`, `oneoff`
   - `savings_rate` → Foundation (nền tảng cashflow); `fi` → **loại khỏi grid** (xem bước 3 dưới), không thuộc nhóm nào.
   Mỗi nhóm: `<Label>` nhỏ muted + grid con responsive (giữ `repeat(auto-fit,minmax(150px,1fr))`).
3. **Xoá card `fi`** khỏi KPI grid (trùng hero badge `FI @{fi_age}` đã có). Thêm card mới **"NISA lifetime"** trong nhóm Structure: nếu `d.nisa_lifetime.value != null` hiện `value/cap` bandable qua status có sẵn từ backend (nếu backend không trả verdict cho field này thì hiện raw, không tự tính status ở frontend); nếu `value == null` → hiện "N/A" + tooltip/note nhỏ từ `d.nisa_lifetime.note`.
4. **Icon + aria-label theo status** — sửa `verdictColor` thành map 4 state (`pending`→muted/gray, `ok`→verdigris, `warn`→`--warn`, `breach`→`--danger` nếu có var đó, else đậm amber/đỏ) và thêm map icon: `pending:"○"`, `ok:"✓"`, `warn:"!"`, `breach:"×"`. Card KPI thêm `<span aria-label={status}>{icon}</span>` cạnh label.
5. **Card anatomy thống nhất**: dòng 1 = label, dòng 2 = value (đậm, màu theo status), dòng 3 = target string y nguyên format `"target {ngưỡng}"` (bỏ các subtitle tự do kiểu "on schedule"/"0 due" hiện tại — thay bằng chính `k.target` đã format chuẩn từ backend).

## 7. Bước 5 — Test & verify

1. `cd opus-consilium/api && "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe" -m pytest tests/ -v` → pass, bao gồm tối thiểu:
   - `test_dti_34_2_vs_35_is_warn_not_ok`
   - `test_drift_9_4_vs_5_is_breach_not_warn`
   - `test_contrib_zero_before_payday_is_pending_not_breach`
   - `test_contrib_zero_after_payday_is_breach`
   - `test_threshold_zero_edge_case_no_crash`
   - `test_boolean_flip_none_is_pending`
2. `curl localhost:8765/api/actio/plan` → check `kpis[].verdict` chỉ còn 4 giá trị, `next_action` tồn tại, `nisa_lifetime` tồn tại.
3. KHÔNG chạy npm/jest gì (không có, không cài thêm) — phần frontend verify bằng cách mở `localhost:8765`, tab Plan, xem console sạch — Claude sẽ tự verify phần này bằng trình duyệt, Codex chỉ cần đảm bảo JSX parse được (không cần render thật).

## 8. Guardrail (nhắc lại, không tự ý vượt phạm vi)

- KHÔNG sửa công thức tài chính (FIRE, projection, mortgage, block table...) — chỉ sửa **verdict/status/format hiển thị**.
- KHÔNG bịa số cho `nisa_lifetime` — phải là `null` + note nếu chưa có nguồn.
- KHÔNG cài dependency mới (không pip install thêm ngoài pytest đã có sẵn, không npm install).
- KHÔNG commit, KHÔNG push.
- Nếu bước nào trong BD này mâu thuẫn với code thực tế lúc code — dừng lại, ghi rõ mâu thuẫn trong phần tổng kết cuối cùng, KHÔNG tự đoán tiếp.

## 9. Output cuối

Tổng kết dạng Markdown: bảng file đã đổi + rationale 1 dòng/file, kết quả pytest (pass/fail count), danh sách TODO còn lại (nisa_lifetime data source, báo giá bảo hiểm — không liên quan file này nhưng nếu thấy gì khác lạ thì ghi chú).
