# SD + TASK — Retirement / Financial Independence projection cho actio

**Owner spec:** Claude (Opus) · **Thực thi:** Codex hoặc Claude trực tiếp · **Ngày:** 2026-06-24
**Loại:** SDD — System Design + Build task. **Phụ thuộc:** `SD-actio-ips.md` (dùng risk bucket + iDeCo/NISA rail), `goals.json` (goal retirement, horizon).

> ⚠️ FRESH START cho Codex khi chạy: KHÔNG hỏi tiếp tục/mới, KHÔNG đọc `ai/status.md` hay handoff. Đọc file này + làm thẳng.

---

## 0. Rationale (theo review chuyên gia)

Goal `retirement` trong `goals.json` hiện có `target_jpy: null` — nghĩa là thân chủ chưa biết **cần bao nhiêu để nghỉ hưu / đạt độc lập tài chính (FI)**. actio không thể chấm goal dài hạn nếu thiếu con số đích. Skill này dựng **FIRE number** đúng nguyên tắc:

1. **年金 (kosei nenkin) là một dòng thu nhập hưu** — phải trừ khỏi chi phí trước khi tính corpus, nếu không sẽ over-save. Nhưng 年金 chỉ bắt đầu ở tuổi 65 → cần **bridge corpus** cho giai đoạn nghỉ hưu sớm (retire_age → 65) khi chi phí chưa được 年金 gánh.
2. **Real return + SWR là giả định, không phải sự thật** — output phải có sensitivity, không đưa một con số tuyệt đối giả chắc.
3. **Foundation-aware** — tiền hưu thuộc growth bucket (`SD-actio-ips`); ưu tiên rail ưu đãi thuế (iDeCo trước, NISA tsumitate, rồi 特定) theo nguyên tắc §3 ACTIO.

---

## 1. Deliverable A — data file pair

| File | Trạng thái | Nội dung |
|---|---|---|
| `data/retirement.example.json` | tracked | placeholder (KHÔNG số thật) |
| `data/retirement.schema.md` | tracked | tài liệu field |
| `data/_local/retirement.json` | gitignored | default thật từ client facts |

### Fields

| Field | Type | Notes |
|---|---|---|
| `retire_target_age` | int | Tuổi mục tiêu nghỉ hưu / đạt FI. |
| `life_expectancy` | int | Tuổi kỳ vọng sống (horizon kết thúc). |
| `annual_expense_retire_jpy` | int | Chi phí/năm khi nghỉ hưu (real, hôm nay). |
| `kosei_nenkin_est_annual_jpy` | int | 厚生年金 ước tính/năm. |
| `kosei_nenkin_start_age` | int | Tuổi bắt đầu nhận 年金 (mặc định 65). |
| `real_return_pct` | number | Lợi suất thực kỳ vọng của danh mục (sau lạm phát). |
| `inflation_pct` | number | Lạm phát giả định. |
| `safe_withdrawal_rate_pct` | number | SWR, mặc định 3.5. |
| `idecho_monthly_jpy` | int | Đóng iDeCo/tháng. |
| `nisa_monthly_jpy` | int | Đóng NISA tsumitate/tháng. |
| `current_invested_source` | string | `"finance.db v_networth_true / invested_total"` — chỉ rõ nguồn lấy vốn hiện có, KHÔNG ghi số. |

`example.json` chỉ chứa placeholder hợp lệ (số tròn trung tính như 0/65/3.5 cho schema-default field, KHÔNG dùng số thật của thân chủ). `_local/retirement.json` chứa default thật từ client facts.

## 2. Deliverable B — Skill `/actio-retire`

Tạo `C:/Users/HUY/.claude/commands/actio-retire.md`.
- `description: Actio — retirement / FI projection (FIRE number + 年金 offset + gap)`
- `argument-hint: ""`

### Steps

1. **Đọc hồ sơ trước** tại project root: `data/_local/retirement.json`, `client-profile.json`, `goals.json`, `investment-policy.json`. Nếu thiếu `retirement.json` → báo thiếu, dùng `data/retirement.example.json` chỉ để hiểu schema (không chấm thật).
2. **Lấy vốn hiện có + net worth** từ `finance.db`: `invested_total` từ snapshot mới nhất (qua `v_networth_true` / `pf_summary`), true net worth.
3. **Tính FIRE corpus**:
   - `nenkin_offset` = `kosei_nenkin_est_annual_jpy` (chỉ áp dụng từ `kosei_nenkin_start_age`).
   - `core_corpus = (annual_expense_retire_jpy − kosei_nenkin_est_annual_jpy) / (SWR/100)` — corpus nuôi phần chi phí 年金 không gánh, vĩnh viễn từ tuổi 65 trở đi.
   - `bridge_corpus` = chi phí ĐẦY ĐỦ (chưa trừ 年金) cho giai đoạn `retire_target_age → kosei_nenkin_start_age`, chiết khấu đơn giản (số năm × annual_expense, hoặc PV ở real_return). Nếu retire_age ≥ start_age → bridge = 0.
   - `fire_number = core_corpus + bridge_corpus`.
4. **Project vốn hiện có** tới `retire_target_age` ở `real_return_pct`: future value của `invested_total` + future value của dòng đóng góp hàng tháng (savings capacity, hoặc iDeCo+NISA monthly). Dùng công thức FV annuity (real terms).
5. **Gap & monthly needed**:
   - `projected_corpus` vs `fire_number` → gap.
   - `required_monthly` = đóng góp/tháng cần để đóng gap (PMT của annuity tới retire_age ở real_return). So với savings capacity (`client-profile.cashflow` hoặc income−expense).
   - `estimated_FI_date` = tuổi/năm mà projected_corpus đạt fire_number với đóng góp hiện tại.
6. **Sensitivity**: nêu rõ kết quả nhạy với `real_return_pct` và `safe_withdrawal_rate_pct`; cho 1 dải (vd SWR 3.0 / 3.5 / 4.0).
7. **Account placement**: ưu tiên iDeCo (employee 厚生年金 eligible) → NISA tsumitate → 特定, theo `investment-policy.implementation`.

Tính toán chạy bằng block `PYTHONIOENCODING=utf-8 python -c "..."` đọc `data/_local/finance.db` (cùng style các skill khác).

### Output structure

- 🎯 **FIRE number:** core corpus + bridge corpus = tổng; nêu giả định (SWR, real return).
- 📈 **Trajectory vs target:** vốn hiện có project tới retire_age + đóng góp → projected corpus vs fire_number.
- 🏛 **年金 offset:** 厚生年金/năm, bắt đầu tuổi 65, giảm corpus core bao nhiêu.
- ⚠️ **Gap + monthly needed:** thiếu/đủ; required monthly vs savings capacity; estimated FI date.
- ⚡ **1–3 action:** ưu tiên iDeCo/NISA, account placement, mức đóng đề xuất.

### Verify (trong skill)

- Math sanity: nếu `annual_expense_retire ≤ kosei_nenkin` → core_corpus ≤ 0, chỉ cần bridge; nêu rõ "年金 đủ phủ chi phí dài hạn".
- Không ghi số thật vào file command.

## 3. Out of scope

- Mô hình thuế hưu trí JP chi tiết (年金 課税, 退職所得) — KHÔNG; chỉ offset gộp.
- 国民年金 / 付加年金 / 企業型DC — KHÔNG (chỉ 厚生年金 + iDeCo).
- Monte Carlo / sequence-of-returns — KHÔNG (chỉ deterministic + sensitivity dải).
- KHÔNG commit; KHÔNG đụng finance.db schema/ingest.

---

## Ghi chú dependency

Chạy sau `SD-actio-ips.md`. FIRE number sinh ra ở đây nên feed lại `goals.json` (`retirement.target_jpy`) trong `_local` để `/actio-goals` chấm được goal hưu. Việc cập nhật `goals.json` là thủ công của thân chủ, không tự động trong skill này.
