# {Project Name}

{1-2 câu mô tả project — loại app, mục đích, constraint chính}

## Chạy & Deploy

```bash
# {command to run}
```

## Stack

- {Language/Framework}
- {Data layer}
- {Infrastructure}

## Cấu Trúc

```
{project}/
├── {entry-point}     ← {role}
├── {module-a}/       ← {role}
├── docs/             ← RD, SD, BD, BACKLOG
└── {config}          ← {role}
```

## Quy Ước Code

- {naming convention}
- {architecture principle — vd: views là pure functions}
- Không thêm comment mô tả "what" — chỉ "why" khi không hiển nhiên
- {language for UI copy vs code identifiers}

## Trạng Thái Tính Năng

### Đã Xong
- **{Feature A}**: {brief description}

### Issue Đang Open
- **{Issue}**: {description}, nghi ngờ: {hypothesis}

### Ý Tưởng Chưa Làm
- {Idea A}

## SDD Docs

| Doc | Path | Status |
|---|---|---|
| Requirements | `docs/RD-requirements.md` | {status} |
| System Design | `docs/SD-system-design.md` | {status} |
| Build Plan | `docs/BD-build-plan.md` | {status} |
| Backlog | `docs/BACKLOG.md` | {status} |

## Convention Giao Tiếp

- Response ngắn gọn, {ngôn ngữ}
- Hỏi xác nhận trước khi làm thay đổi lớn
- Exploratory questions → 2-3 câu recommendation, không implement ngay
