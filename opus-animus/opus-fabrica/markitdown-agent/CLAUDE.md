# Markitdown Agent

Resident workspace: `opus-fabrica/`

**Vai trò:** Input tool phục vụ personal-agent — convert bất kỳ file → `.md` để đưa vào wiki ingest pipeline.

**2 modes:**
- **Integrated** (default): watch `personal-agent/raw/inbox/` → route converted files tới `raw/articles|papers|notes/`
- **Standalone**: watch `input/` → output `output/` (dùng độc lập)

## Chạy

```bash
cd "C:/Users/HUY/AI/OPUS ANIMUS/opus-fabrica/markitdown-agent"
pip install -r requirements.txt

python agent.py                    # integrated mode (default — watch raw/inbox/)
python agent.py --mode standalone  # standalone mode (watch input/)
```

Drop file vào thư mục watched — agent chạy liên tục cho đến Ctrl+C.

## Stack

- `markitdown[all]` — convert PDF, DOCX, PPTX, XLSX, HTML, ảnh, audio, ZIP → Markdown
- `watchdog` — filesystem event watcher

## Cấu Trúc

```
markitdown-agent/
├── agent.py       ← entry point (watchdog + converter)
├── input/         ← drop files vào đây
├── output/        ← .md files xuất hiện ở đây
└── docs/          ← SDD documentation
```

## Supported Formats

PDF, DOCX, DOC, PPTX, PPT, XLSX, XLS, CSV, HTML, HTM, TXT, RTF, XML, JSON,
PNG, JPG, JPEG, GIF, WEBP, MP3, WAV, M4A, ZIP

## Collision Handling

Nếu `output/{stem}.md` đã tồn tại → tạo `{stem}_2.md`, `{stem}_3.md`...

## SDD Docs

| Doc | Path | Status |
|---|---|---|
| Requirements | `docs/RD-requirements.md` | 🔵 Draft |
| Build Plan | `docs/BD-build-plan.md` | 🔵 Draft |

## Convention Giao Tiếp

- Response ngắn gọn, tiếng Việt
- Agent này đơn giản — không cần design doc phức tạp
