# Design Brief — "Financial Plan" Dashboard (Actio)

**Mục đích brief:** đưa lên Claude Design để dựng UI.
**Ngày:** 2026-07-03 · **Tác giả spec:** Claude (Opus) · **Loại:** UI design (forward-looking planning cockpit)

> ⚠️ **MỌI CON SỐ DƯỚI ĐÂY LÀ MINH HỌA HƯ CẤU** (không phải tài chính thật của ai). Chỉ để designer thấy hình dạng/độ lớn dữ liệu. Khi build thật, wire số từ API localhost `GET /api/actio/plan` — KHÔNG hardcode, KHÔNG dán số thật vào công cụ design.

---

## 0. Bối cảnh — khác gì dashboard Actio hiện có?

Đã có 1 dashboard Actio = **snapshot chẩn đoán** (net worth, allocation, IPS, spending — trạng thái HIỆN TẠI).
Trang mới này = **forward-looking planning cockpit** — không phải "tôi đang có gì" mà **"lộ trình từ hôm nay → về hưu"**. Trục thời gian là xương sống, không phải bảng cân đối.

Ba tầm nhìn của kế hoạch:
- **Ngắn hạn** — vận hành *hàng tháng* (waterfall phân bổ, checklist).
- **Trung hạn** — *5 năm, từng năm* (quỹ đạo net worth, quyết định mua nhà).
- **Dài hạn** — *khối 3 năm tới hưu 60* (glide path, mốc FI, cầu hưu-trí trước lương hưu nhà nước).

## 1. Concept + metaphor

**Metaphor trung tâm: một HÀNH TRÌNH (roadmap) từ tuổi 38 → 60.**
Người dùng "zoom" qua 3 độ phân giải thời gian: tháng này → 5 năm tới → tới khi hưu. Cảm giác chủ đạo: *đang đi đúng đường, biết mốc kế tiếp là gì*.

Nguyên tắc thiết kế:
1. **Time as spine** — mọi thứ neo vào một timeline ngang tuổi 38→60→(90).
2. **Progressive zoom** — 3 tab/lớp: THÁNG · NĂM (5y) · THẬP NIÊN (blocks 3y). Cùng dữ liệu, khác độ phân giải.
3. **Trạng thái > con số** — mỗi mốc có badge trạng thái (✅ đạt / 🟡 đang chạy / ⏳ tương lai), không chỉ số khô.
4. **Forward, not audit** — nhấn dự phóng + hành động, không phải lịch sử.

## 2. User & job-to-be-done

- **User:** chính chủ (single, ~38t, sống ở Nhật, tiết kiệm cao), review hàng tháng, tự thực thi.
- **JTBD chính:** "Tháng này tôi phải làm gì, và nó đưa tôi tới hưu ra sao?"
- **Tone:** điềm tĩnh, tự tin, private-bank. Không gamification lòe loẹt. Terse tiếng Việt + thuật ngữ JP (NISA, iDeCo, 年金, 住宅ローン控除).

## 3. Visual language

- **Nền tối** đồng bộ Opus Home: `--bg #0d0f12`, `--elevated #16191e`, `--border-subtle`, text `--text #e8e6e1` / `--muted`.
- **Accent vàng** `--gold #c9a961` = North Star / hành động chính. **Verdigris** `--verdigris #4a9d8e` = đạt/dương. **Amber** `--warn #d9a441` = cảnh báo mềm (KHÔNG đỏ trừ lỗi thật).
- Typography: số lớn serif hoặc tabular-nums cho tiền; nhãn uppercase nhỏ letter-spacing.
- Tiền: `¥` + phân tách nghìn; hỗ trợ đơn vị **万** cho số lớn (¥40M ↔ 4,000万). Range hiển thị dạng dải mờ, không false precision.
- Card bo góc mềm, viền subtle, 1 accent line trái theo trạng thái.

## 4. Layout — section by section

*(Tất cả số = MINH HỌA HƯ CẤU.)*

### HERO — North Star (full-width, trên cùng)
"Từ đâu → tới đâu". Trái: net worth hiện tại. Phải: dự phóng @60. Ở giữa: thanh tiến trình tới FIRE + badge FI age.
- Viz: **thanh tiến trình lớn** `hiện tại ──●──────► FIRE target`, cắm mốc `FI @55`.
- Sub-stats: `FIRE ¥40M (dải 36–45M) · FI ~50–55 · on-track ✅`.
- Dữ liệu MẪU: `now 20.0M · projected@60 180–230M · FIRE 40.0M · FI_age 55`.

### TIMELINE SPINE — dải hành trình ngang (dưới hero, sticky khi cuộn)
Trục tuổi 38───43───48───53───60──(65)──90 với các **milestone pin**:
`Nhà (Y2–3)` · `FI ~55` · `Hưu 60` · `年金 65 (cầu 5y)`.
Click 1 pin → cuộn tới section tương ứng. Đây là navigator chính.

### BỘ CHUYỂN TẦM NHÌN — 3 tab: THÁNG · 5 NĂM · TỚI HƯU
Tab điều khiển vùng nội dung chính bên dưới. Mặc định mở **THÁNG**.

---

#### TAB 1 — THÁNG (ngắn hạn, vận hành)

**4.1 Waterfall phân bổ base savings/tháng** *(điểm nhấn tab)*
Dòng tiền tiết kiệm tháng chảy xuống các xô. Viz: **sankey dọc / stacked flow**.
| Bậc | Khoản | ¥/tháng (MẪU) |
|---|---|---:|
| 1 | iDeCo | 23,000 |
| 2 | NISA tsumitate | 100,000 |
| 3 | NISA growth | 100,000 |
| 4 | Bond sleeve | 30,000 |
| 5 | DCA đệm | 47,000 |
| | **Tổng** | **300,000** |
Callout: "Trước: chỉ đầu tư ~130k → **rò ~170k/tháng thành cash**. Sau: hết rò."

**4.2 Checklist tháng** — các dòng có checkbox: auto-invest, guardrail chi tiêu (trần MẪU ¥200k), rebalance trigger >5pp drift, DCA idle.
**4.3 Quy tắc thưởng** (card riêng, thưởng ~¥2M net/năm MẪU): 70% index / 20% đệm nhà / 10% buffer.
**4.4 Hành động một lần** (card gold, ưu tiên): (1) bật iDeCo, (2) deploy idle theo tranche, (3) trim concentration, (4) nâng bond.
**Trạng thái contrib**: badge cảnh báo `iDeCo/NISA: TARGET chưa kích hoạt` — nổi bật vì đây là action #1.

---

#### TAB 2 — 5 NĂM, TỪNG NĂM (trung hạn)

**4.5 Quỹ đạo net worth** — biểu đồ vùng Y1→Y5 với **dải range** (thận trọng/kỳ vọng).
Viz: area chart, trục X = tuổi 39–43, band mờ.
Dữ liệu MẪU (net worth): `Y1 24M · Y2 30M · Y3 36M · Y4 44M · Y5 52M`.

**4.6 Year cards** — 5 thẻ ngang (mỗi năm 1 thẻ), mỗi thẻ:
`Tuổi · Invested/Cash split (mini donut) · Net worth · 1 dòng "hành động trọng tâm"`.
Ví dụ Y2 (MẪU): `40t · invested 27M / cash 3M · 30M · "Deploy nốt idle; cửa sổ MUA NHÀ"`.

**4.7 Cash→Invested shift** — viz nổi bật sự dịch chuyển cốt lõi: `cash ~75% (Y0) → ~5% (Y2)`. Dạng 2 thanh trước/sau hoặc animated bar.

**4.8 Kịch bản nhà** (card, gắn Y2–3, số MẪU) — trả góp ¥120k/th, DTI ~25%, cash sau mua ~8.5M, có 住宅ローン控除, "cashflow vẫn dương → không phá lộ trình".

---

#### TAB 3 — TỚI HƯU (dài hạn, khối 3 năm)

**4.9 Glide path allocation** — biểu đồ vùng chồng equity↓ / bond↑ theo tuổi 43→60.
Viz: stacked area, `equity 85% → 60% (55–60)`, `bond 15% → 40%`. Đánh dấu điểm bắt đầu de-risk (~50).

**4.10 Bảng 6 khối × 3 năm** — mỗi hàng 1 khối, cột: tuổi · invested pool (dải 3%/4%/5%) · mốc/chiến lược.
Dữ liệu MẪU (pool @4%): `43–45 60M · 46–48 80M · 49–51 105M · 52–54 135M · 55–57 165M · 58–60 200M`.

**4.11 Cầu 60→65 (bridge)** — viz riêng: hưu 60 nhưng lương hưu nhà nước bắt đầu 65 → tách bucket `~¥12M = 5 × chi phí năm` sang preservation. Timeline nhỏ minh họa 5 năm rút thuần, rồi 年金 bù từ 65.
**4.12 Withdrawal transition** — SWR (MẪU 3.5%) trên core; ghi chú "pool thực tế >> FIRE → biên an toàn rộng, có thể hưu sớm hơn 60".

---

### FOOTER — Tổng kết quyết định (4 dòng) + disclaimer
`Số liệu từ API localhost · phân tích tư vấn, KHÔNG phải lời khuyên đầu tư ràng buộc.`

## 5. Tương tác chính

- Timeline pin ↔ cuộn tới section (2 chiều: cuộn cũng highlight pin).
- 3 tab THÁNG/NĂM/HƯU chuyển vùng nội dung (không reload).
- Toggle đơn vị **¥ ↔ 万** (global).
- Toggle kịch bản real return **3% / 4% / 5%** → cập nhật mọi range/projection.
- Checklist tháng: check được (chỉ UI state, chưa cần persist ở bản design).
- Hover mọi số dự phóng → tooltip "giả định: real X%, contrib Y, ...".

## 6. Responsive

- Desktop-first (dùng trên laptop). Timeline spine ngang cuộn được trên mobile.
- Year cards: 5 cột desktop → cuộn ngang / stack mobile.
- Bảng khối 3 năm + waterfall: bọc `overflow-x:auto`, không để body cuộn ngang.

## 7. Data contract (khi build thật — KHÔNG cần cho design)

Wire từ endpoint localhost mới (đề xuất) `GET /api/actio/plan` trả bundle:
`north_star{net_worth_now, projected_at_retire[range], fire_number, fire_range, fi_age, on_track}`,
`monthly{waterfall[], leak_before, checklist[], bonus_rule, oneoff_actions[], contrib_status}`,
`medium{years[{age, invested, cash, net_worth, focus}], cash_shift, house_scenario}`,
`long{glide[{age, equity, bond}], blocks[{ages, pool_low/mid/high, note}], bridge{amount, years, nenkin_from65}, swr}`.
Số thật chỉ sống ở API localhost — **design mockup chỉ dùng dữ liệu MẪU hư cấu**.

## 8. Ngoài phạm vi

Không thiết kế: nhập liệu/edit số, auth, persist checklist, backend. Chỉ UI trình bày kế hoạch. Không đụng dashboard Actio hiện có (đây là trang thứ 2, riêng biệt).
