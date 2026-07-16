# Visual Treatment Template

Loop 0 (design, chữ, rẻ nhất) — dùng template này để viết `visual-treatment.md` cho mỗi topic, TRƯỚC khi giao `script-template-mapper`. Nguồn quy tắc: `apps/lucida-remotion-demo/docs/review-design-before-render.md` mục 4.

Copy toàn bộ khối dưới, điền vào, xoá phần hướng dẫn trong `<>`.

---

## Header

| Field | Value |
|---|---|
| Topic slug | `<topic-slug>` |
| Script ref | `apps/lucida-remotion-demo/input/scripts/<topic-slug>/approved-script.json` |
| Status | draft |
| Date | `<YYYY-MM-DD>` |

---

## ACTORS

Thực thể hình ảnh xuất hiện trong video — mỗi thực thể là một actor riêng, không gộp.

**Rule (bắt buộc):** mọi danh từ trung tâm của chủ đề phải có mặt trong actors. Ví dụ: chủ đề "Dùng AI viết email" → PHẢI có cả actor **AI** lẫn actor **email**. Thiếu một trong hai là treatment sai, không phải chi tiết bỏ qua được.

| Actor | Component thể hiện | Ghi chú |
|---|---|---|
| `<tên actor>` | `<MechanismWindow / ContextChip / TimerMorph / DiffHighlight / slide template>` | `<variant, vai trò>` |

---

## BEATS

Mỗi `segmentId` của script = một dòng. Tả CẢNH THẤY ĐƯỢC, không tả ý nghĩa hay cảm xúc.

**Rule (bắt buộc):** beat mô tả tương tác A→B thì cả actor A và actor B phải cùng hiện diện trong cảnh đó. Không có chuyện A hành động mà B không xuất hiện trên màn hình.

| segmentId | Cảnh thấy được (1 dòng) | Actors trong beat |
|---|---|---|
| `<segmentId>` | `<mô tả 1 dòng>` | `<actor A, actor B>` |

---

## COMPONENT CHECK

Đối chiếu từng actor/beat với component có sẵn.

**Rule (bắt buộc):** có bất kỳ GAP nào → dòng đầu tiên của file này phải ghi `⚠ COMPONENT GAP`. Gap là quyết định của user (build thêm component ở Track 1, hoặc đổi treatment) — KHÔNG BAO GIỜ được lách trong lúc build map (đổi title cửa sổ, mượn component sai vai, bỏ beat trong im lặng).

| Actor/beat | Component | Status |
|---|---|---|
| `<actor hoặc segmentId>` | `<component dự định dùng>` | `OK` / `⚠ GAP` |

Component hiện có (tham chiếu):

- `MechanismWindow` (variant email/chat/doc) — hiện chỉ làm **environment**; CHƯA add được cửa sổ thứ hai như một element riêng.
- `ContextChip`
- `TimerMorph`
- `DiffHighlight`
- Mode slides với template registry cũ (xem `apps/remotion-templates/template-catalog.json`).

---

## Approval

User duyệt ngày: `<YYYY-MM-DD hoặc để trống chờ duyệt>`
