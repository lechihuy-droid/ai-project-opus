# SDD Toolkit
**Spec-Driven Development — Personal Toolkit**
**Version:** 1.0 | **Date:** 2026-04-28

---

## Cách Dùng Nhanh

### Dự án mới

```bash
cd C:/Users/HUY/AI/SDD-toolkit/scripts
python scaffold.py new my-project
python scaffold.py new my-project --path C:/Users/HUY/projects
```

### Thêm SDD docs vào dự án có sẵn

```bash
python scaffold.py add-docs --path C:/Users/HUY/existing-project
```

### SDD là gì trong 30 giây

```
1. Viết RD (requirements) → user approve
2. Viết SD (design) → user approve  
3. Viết BD (build steps) → user approve
4. Code theo BD, không improvise
5. Review — cross-check từng FR có implementation
```

---

## Cấu Trúc Toolkit

```
SDD-toolkit/
├── CLAUDE.md                    ← Rules cho Claude Code khi làm SDD
├── README.md                    ← File này
├── workflow/
│   ├── sdd-process.md           ← Full process documentation
│   └── checklist.md             ← Quick checklist per phase
├── templates/
│   ├── RD-template.md           ← Requirements & Design
│   ├── SD-system-design.md      ← System Design + Interface Contracts
│   ├── BD-build-plan.md         ← Build Plan với smoke tests
│   ├── BACKLOG.md               ← Backlog + roadmap
│   └── CLAUDE-project.md        ← Template CLAUDE.md cho project mới
└── scripts/
    └── scaffold.py              ← Bootstrap project từ templates
```

---

## Áp Dụng Cho Dự Án Hiện Có

| Project | Docs có sẵn | Còn thiếu |
|---|---|---|
| `personal-agent` | RD, SD, BD, BACKLOG ✅ | Đã đầy đủ |
| `sier-project` | CLAUDE.md, working-process ✅ | SD template chuẩn |
| `PMP-Quiz-App` | CLAUDE.md ✅ | RD chính thức |

---

## Nguồn Tham Khảo

- [GitHub Spec Kit](https://github.com/github/spec-kit)
- [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
- [cc-sdd](https://github.com/gotalab/cc-sdd)
- [workflow/sdd-process.md](workflow/sdd-process.md) — chi tiết các phases
