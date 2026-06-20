---
description: Phân tuyến task theo bảng Model & Agent Routing trong CLAUDE.md (Opus / Sonnet / Codex).
---

# Model Route Command

Đề xuất tuyến thực thi đúng cho task hiện tại theo độ phức tạp, rủi ro và loại việc —
bám theo bảng **Model & Agent Routing** trong `CLAUDE.md`.

## Usage

`/model-route [task-description]`

## Routing Heuristic (3 tuyến)

- **Opus — main session**: plan, kiến trúc, SDD docs (RD/SD/BD/CR), review, quyết định trade-off, root-cause đa file.
- **Sonnet**: task thông thường — search, đọc, verify, sửa nhỏ, status, giải thích. Fan-out routine lớn → tách Sonnet subagent.
- **Codex (`codex exec`)**: coding (implement) + viết test. Claude viết BD/brief rồi giao, **KHÔNG tự code** trừ khi user yêu cầu.

## Lưu ý vận hành

- Main session chạy **một model tại một thời điểm** — user đổi bằng `/model`. Claude không tự đổi được.
- Nếu task thuộc tuyến khác tuyến đang chạy → báo rõ "task này thuộc tuyến [X], `/model` cho đúng" hoặc "giao Codex".

## Required Output

- tuyến đề xuất (Opus / Sonnet / Codex)
- độ tự tin
- vì sao tuyến này hợp
- hành động kế tiếp: `/model` switch, giữ nguyên, hay giao `codex exec`

## Arguments

$ARGUMENTS:
- `[task-description]` mô tả task (tùy chọn; nếu trống thì suy từ ngữ cảnh phiên hiện tại)
