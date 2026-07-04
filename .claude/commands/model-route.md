---
description: Phân tuyến task theo bảng Model & Agent Routing trong CLAUDE.md (Opus / Sonnet / Codex).
---

# Model Route Command

Đề xuất tuyến thực thi đúng cho task hiện tại. **Nguồn chuẩn là bảng Model & Agent
Routing trong `CLAUDE.md`** — luôn đọc bảng đó trước khi quyết; phần dưới chỉ là heuristic nhanh.

## Usage

`/model-route [task-description]`

## Heuristic nhanh

- **Opus** — plan, kiến trúc, SDD, review, trade-off, root-cause đa file.
- **Sonnet** — routine: search, đọc, verify, sửa nhỏ, status, giải thích.
- **Codex (`codex exec`)** — implement + viết test; Claude giao brief/BD, không tự code.

## Lưu ý vận hành

- Main session chạy **một model tại một thời điểm** — user đổi bằng `/model`, Claude không tự đổi.
- Task lệch tuyến đang chạy → báo "thuộc tuyến [X], `/model` cho đúng" hoặc giao Codex.

## Required Output

- tuyến đề xuất (Opus / Sonnet / Codex) + độ tự tin
- vì sao tuyến này hợp
- hành động kế tiếp: `/model` switch, giữ nguyên, hay giao `codex exec`

## Arguments

$ARGUMENTS:
- `[task-description]` mô tả task (tùy chọn; trống thì suy từ ngữ cảnh phiên hiện tại)
