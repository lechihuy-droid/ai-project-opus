# opus-animus
*Tác phẩm vĩ đại của Ý chí*

Workspace agent AI cá nhân — tích lũy tri thức để xây dựng và transform bản thân.
Chạy trên Windows, không cần 24/7.

## Sub-projects

| Folder | Mô tả | Role |
|---|---|---|
| `opus-consilium/` | Module A (ResearchCrew) + B (Daily Brief) + C (Wiki Agent) | Core |
| `markitdown-agent/` | Convert bất kỳ file → .md, feed vào raw/inbox/ | Input tool |

## Đọc Trước Khi Làm Bất Cứ Gì

| File | Đọc khi nào |
|---|---|
| `ai/STATUS.md` | **Đầu mỗi session** — objective + sub-system đang active |
| `ai/handoff-claude.md` | **Sau interrupt/compaction** — exact next action |
| `north-star.md` | Khi chọn feature tiếp theo — để biết có align với mục đích không |
| `todo.md` | Khi cần chi tiết tasks của sub-system đang làm |
| `dev-approach/README.md` | Trước khi bắt đầu feature/function mới |
| `dev-approach/checklist.md` | Trong khi build — gate check |
| `docs/SA-system-architecture.md` | Khi feature ảnh hưởng đến data flow hoặc component boundary |

**Cuối session — gõ `/handoff`:**
1. Update `ai/status.md` với objective hiện tại + next step
2. Update `ai/handoff-claude.md` với exact next action + files touched + risks
3. Update `todo.md` với completed items + status changes

## Dev Approach

Phương pháp: **Spec-Driven Development (SDD)**
Chi tiết: [`dev-approach/`](dev-approach/README.md)

**Rule:** Không code feature mới nếu chưa có RD doc được approve.

**Doc-sync rule:** Mọi thay đổi có ý nghĩa trong opus-animus phải cập nhật tài liệu tương ứng trong cùng lượt làm:
- Scope/priority thay đổi → update `TODO.md`
- Component boundary/data flow thay đổi → update `docs/SA-system-architecture.md`
- Feature mới hoặc behavior mới → update RD/BD trong `opus-consilium/docs/` hoặc docs liên quan
- Wiki schema/workflow thay đổi → update `opus-consilium/personal-wiki/SCHEMA.md` và doc plan tương ứng
- Backlog/future idea → chỉ ghi backlog, không implement ngầm

## Quy Ước Chung

- Windows Task Scheduler thay cho cron
- Python 3.11 — `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`
- .env cho credentials, không hardcode
- Response ngắn gọn, tiếng Việt
- Không sửa file trong `raw/` — immutable sources

## Cấu Trúc Workspace

```
AI/opus-animus/
├── CLAUDE.md                    ← file này
├── TODO.md                      ← project-wide todo + backlog
├── GOALS.md                     ← 4 tracks: PMP / Tài chính / Sức khỏe / Sự nghiệp
├── NORTH-STAR.md                ← kim chỉ nam
├── VISION.md                    ← triết lý + HOME app blueprint
├── JOURNEY.md                   ← lịch sử phát triển
├── docs/
│   └── SA-system-architecture.md
├── dev-approach/                ← SDD methodology reference
│   ├── README.md
│   ├── sdd-process.md
│   ├── checklist.md
│   └── templates/  (RD, SD, BD)
├── opus-consilium/              ← central brain/wiki (Module A + B + C + Collector)
│   ├── CLAUDE.md
│   ├── run_home.py              ← terminal dashboard
│   ├── run_collect.py           ← content collector
│   ├── run_wiki.py              ← wiki agent
│   └── docs/  (RD, SD, BD, BACKLOG)
├── markitdown-agent/            ← input tool
│   ├── CLAUDE.md
│   ├── config.yaml
│   └── docs/
└── apps/                        ← standalone apps phục vụ personal goals
    └── pmp-quiz/                ← PMP ôn thi (thi 2026-05-29)
        └── CLAUDE.md
```
