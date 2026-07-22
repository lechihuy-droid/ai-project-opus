# SD — Usage/Cost tracking + Workflow Canvas
**Date:** 2026-07-22 · **Status:** ✅ APPROVED (user, 2026-07-22) · **Author:** Claude (Opus 4.8)
**Upstream:** UI v3 xong 9/9 trang (`ffe3d17`), Phase D xong (`c03c8c7`), perf fix (`b70ce08`).
**Yêu cầu user:** (1) đem chức năng tracking log / usage token / chi phí của hub cũ vào v3, thiết kế UI cho hợp;
(2) chưa có canvas kéo-thả agent.

---

## 1. Audit — hub cũ có gì, v3 đang bỏ gì

Backend **đã có sẵn** gần hết dữ liệu (không cần build mới):

| Endpoint | Trả về | v3 đang dùng? |
|---|---|---|
| `GET /api/usage?source&model&since` | **event thô**: ts, source, model, total_tokens, calls, session, command | ❌ không dùng |
| `GET /api/usage/rollup?source&model&since` | `by_model`, **`by_day`**, `by_source`, `totals{calls, input_tokens, output_tokens, total_tokens, cache_tokens, non_cache_tokens}` | ⚠️ chỉ dùng by_source + by_model |
| `GET /api/usage/cockpit` | today / week7d theo provider + `quota_warn_per_day` | ✅ dùng (quota card) |
| `GET /api/tools` | rollup tool events | ⚠️ nhét trong `<details>` |

**v3 UsagePage bỏ mất 4 thứ hub cũ có:**
1. **Bộ lọc** source / model / since — backend hỗ trợ, UI không gửi.
2. **`by_day`** — biểu đồ xu hướng theo ngày (hub cũ: bar chart 30 ngày + xem tất cả).
3. **Tách cache / input / output** — `cache_tokens`, `non_cache_tokens` không hiển thị.
4. **Bảng log event thô** — chính là "log" user muốn (hub cũ: 200 dòng gần nhất, có session + command).

## 2. Chi phí — sự thật cần chốt trước khi build

**Không có pricing ở bất kỳ đâu trong repo.** Quan trọng hơn: kiến trúc harness này cố tình chạy
**claude/codex qua CLI subscription** + **NVIDIA free tier** + gemini CLI → **không có hoá đơn theo token**.
Hiển thị một con số "$" sẽ là **do ta tự tính**, không phải đọc từ bill.

Ba cách mô hình hoá, đã chốt ở §5:
- **A. Shadow cost** — bảng giá list API × token đã dùng, nhãn *"ước tính — không thực trả"*.
- **B. Chỉ quota burn** — % hạn mức ngày/tuần theo provider (`quota_warn_per_day` có sẵn).
- **C. Cả hai** — quota burn là số chính, shadow cost là số phụ có nhãn ước tính.

Dù chọn gì: **không được** trình bày như tiền thật đã tiêu.

## 3. Thiết kế UI — trang "Usage & chi phí"

Giữ ngôn ngữ v3: nền panel, màu theo provider, số mono, nhãn 10px uppercase. Trang hiện tại là một đống phẳng;
tái cấu trúc thành 5 tầng, đọc từ tổng quan → chi tiết:

```
GIÁM SÁT
Usage & chi phí                 [Hôm nay][7 ngày][30 ngày][Tất cả]
                                [source ▾] [model ▾]
─────────────────────────────────────────────────────────────
┌ Tokens ────┐ ┌ Calls ───┐ ┌ Cache ────┐ ┌ Ước tính ──┐
│ 1.24M      │ │ 342      │ │ 68%       │ │ ~$4.10     │
│ 890k in ·  │ │ 12 hôm   │ │ tiết kiệm │ │ ước tính   │
│ 350k out   │ │ nay      │ │ nhờ cache │ │ (không trả)│
└────────────┘ └──────────┘ └───────────┘ └────────────┘
─────────────────────────────────────────────────────────────
Xu hướng theo ngày            ← SVG tự vẽ, MỘT chuỗi (by_day không tách provider)
  ▁▂▃▅▂▇▃▁▂▅▃▁▂▇▅▃
─────────────────────────────────────────────────────────────
Theo model              │ Theo provider
 table + cột chi phí    │ table + quota burn %
─────────────────────────────────────────────────────────────
▸ Nhật ký (log)   ← bảng event thô, áp bộ lọc, lazy-load khi mở
   Thời gian │ Source │ Model │ Tokens │ Calls │ Session │ Command
```

**Quyết định thiết kế:**
- **Bộ lọc ở đỉnh điều khiển toàn trang** — một state, mọi tầng dùng chung, đẩy thẳng vào query param backend
  đã hỗ trợ. Đây là thứ biến trang từ "báo cáo tĩnh" thành "công cụ điều tra".
- **Xu hướng theo ngày là nhân vật chính** — trang tracking mà không có trục thời gian thì vô dụng. Đây cũng
  chính là thứ hub cũ có mà v3 đánh rơi.
- **Cache là KPI riêng** — dữ liệu thật cho thấy cache chiếm ~57% token; với kiến trúc CLI subscription đây là
  đòn bẩy tiết kiệm lớn nhất, hub cũ chỉ ghi một dòng phụ.
- **Độ phủ giá phải đi kèm số tiền** — dữ liệu thật: 91% token CHƯA CÓ GIÁ. Hiện `$317` trần trụi là gây hiểu
  nhầm; phải kèm "chỉ 9% token có giá". Model chưa có giá hiện chữ "chưa có giá", KHÔNG hiện `$0.00`
  (đọc thành "miễn phí").
- **Log nằm trong `<details>` đóng sẵn + lazy fetch** — dataset thật 28k+ event, không kéo khi chỉ liếc tổng quan.
- **Không thêm npm dep cho chart**: tự vẽ SVG (~80-120 dòng), đúng luật self-contained.

## 4. Thiết kế UI — Canvas kéo-thả

Hub cũ có `web/canvas.js` (141 dòng) mount trong workflow editor + `emitWorkflowYaml()`, rất tối giản. v3 chưa port.
Thiết kế mới dùng lại ngôn ngữ hình ảnh của **run spine** (node tròn, gate = thoi amber):

```
Workflows › canvas
┌ Palette ──┬─ Canvas ────────────────────┬─ Inspector ──┐
│ Agents    │                             │ node: draft  │
│ · drafter │    ┌───────┐                │ agent  [▾]   │
│ · thinker │    │ draft │───┐            │ prompt [   ] │
│ · coder   │    └───────┘   │            │ gate   [▾]   │
│           │            ┌───▼────┐       │              │
│ Node      │            │ check  │◇ amber│ (validate:   │
│ · validate│            └───┬────┘       │  target/     │
│           │            ┌───▼────┐       │  checks/     │
│           │            │ refine │       │  on_fail)    │
└───────────┴────────────┴────────┴───────┴──────────────┘
        [Kiểm tra] [Lưu] [Chạy]
```

- **Kéo agent từ palette thả vào canvas** → tạo node gắn agent đó (màu viền = màu provider sau khi resolve
  class cheap/code/smart). Kéo node đổi vị trí. Kéo từ handle mép node sang node khác → tạo edge.
- **Inspector bên phải** sửa prompt/gate; node `validate` sửa target/checks/on_fail (D2).
- **Round-trip**: nạp từ `GET /api/workflows` (đã trả nodes+edges+stop → đủ dựng model, không cần endpoint mới),
  kiểm tra bằng `POST /api/workflows/validate`, lưu bằng `PUT /api/workflows/{id}` (đã có, tự validate).
- **Vị trí node (x,y)** không có trong schema workflow → lưu file phụ `workflows/.layout.json`
  (không đụng schema, không làm hỏng workflow đang chạy).

**⚠️ Rủi ro phải xử lý:** emit YAML từ canvas sẽ **xoá mất comment** trong file — 3 template D4 đang mang comment
quan trọng, gồm cả cảnh báo ngữ nghĩa gate ("đặt gate lên node TIÊU THỤ output"). Bắt buộc: giữ nguyên khối
comment đầu file khi ghi đè, hoặc cảnh báo rõ trước khi lưu. Không được im lặng nuốt mất.

## 5. Quyết định — ĐÃ CHỐT (user, 2026-07-22)

1. **Mô hình chi phí = C — cả hai.** Quota burn là số chính; shadow cost là số phụ, **luôn kèm nhãn "ước tính —
   không thực trả"**. Không bao giờ trình bày như tiền đã tiêu.
2. **Canvas = thêm React Flow.** Quyết định này **cố ý ghi đè luật "không thêm npm dep"** của v3 (SD-ui-v3 §6) —
   đổi lấy zoom/pan/minimap/snap có sẵn. Ghi nhận: bundle tăng ~50–100kb.
   → Trước khi cài **bắt buộc chạy skill `dependency-vetting`** (supply-chain / postinstall / typosquat) rồi mới `pnpm add`.

## 6. Phân pha (đã sắp lại theo quyết định §5)

Đảo E1/E2: chi phí cần backend trước, làm backend xong thì **tái cấu trúc frontend MỘT lần** đã gồm luôn cột/KPI
chi phí — thay vì sửa UsagePage hai lượt.

| Phase | Nội dung | Executor | Size | Trạng thái |
|---|---|---|---|---|
| **E1** | **Backend cost/quota**: `config.PRICING_USD_PER_MTOK` + `services/pricing.py` + cache_read/creation tách riêng + `estimated_cost_usd`/`unpriced_tokens` additive + `quota_pct` | [CODEX] | S | ✅ xong, 205 test xanh |
| **E2** | **Usage page tái cấu trúc (một lượt)**: bộ lọc → 4 KPI → xu hướng `by_day` → breakdown kèm chi phí & quota burn → bảng log lazy | [CODEX] | M | ⏭ tiếp theo |
| E3 | Canvas đọc-hiển thị: React Flow (sau khi vet dep), dựng model từ workflow, node/edge/gate amber, inspector | [CODEX] | M | |
| E4 | Canvas kéo-thả + emit YAML + `.layout.json` + **bảo toàn comment đầu file** | [CODEX] | L | |

Mỗi phase: Codex code → Sonnet test/review → Claude build dist + browser-verify → commit.

## 7. Không làm

- Không hiển thị "$" như tiền thật đã tiêu (xem §2).
- Không đổi schema workflow để nhét toạ độ canvas.
- Không bịa giá cho model không có giá công khai — để **unpriced** và hiện độ phủ.
- Không port lại dashboard cũ 1:1 — gộp vào Usage + Runs theo page map v3.
