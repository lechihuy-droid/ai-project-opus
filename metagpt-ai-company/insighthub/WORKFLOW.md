# InsightHub Agent — Build Workflow (MetaGPT SOP)

> Quy trình xây dựng dự án theo chuẩn **MetaGPT** — `Code = SOP(Team)`.
> Một câu yêu cầu chạy qua dây chuyền 5 role, mỗi role publish artifact vào
> message pool, role kế tiếp subscribe và đọc đúng artifact upstream.

---

## 0. Yêu cầu gốc (one-line idea)

> "Xây **InsightHub Agent** — AI co-pilot gom dữ liệu Jira / WBS / Slack-Teams /
> GitHub / biên bản họp, đối soát chéo, sinh báo cáo tuần truy vết được cho
> Front PM FPT Japan. MVP chạy E2E trong 1 ngày, không hallucination."

Input có sẵn (đóng vai trò tài liệu nguồn cho ProductManager):
- `workspace/.../AI_Hackathon_InsightHub_Agent_Brief.md`
- `workspace/.../docs/SRS_InsightHub_Agent.md`
- `workspace/.../docs/User_Stories_InsightHub_Agent.md`

---

## 1. The AI Company — 5 role

| Role | Profile | Goal | Actions |
|---|---|---|---|
| **ProductManager** | "Alice" | Cắt SRS khổng lồ → PRD đúng scope MVP 1 ngày | `WritePRD` |
| **Architect** | "Bob" | Chốt kiến trúc MCP + pipeline chống hallucination | `WriteDesign` |
| **ProjectManager** | "Eve" | Phân rã thành task có thứ tự + dependency | `WriteTasks` |
| **Engineer** | "David" (×4 stream) | Viết code theo task list | `WriteCode`, `WriteCodeReview` |
| **QaEngineer** | "Edward" | Viết test, chạy E2E, debug tới khi pass | `WriteTest`, `RunCode`, `DebugError` |

Mỗi role: **observe** (đọc artifact mình watch) → **think** (chọn action) →
**act** (chạy action) → **publish** (ghi artifact ra `docs/`).

---

## 2. Dây chuyền — Pipeline tuần tự có cổng duyệt

```
   one-line idea
        │
   ┌────▼─────────────┐  G1   ┌──────────────────┐  G2   ┌──────────────────┐
   │ 1. ProductMgr    ├──────▶│ 2. Architect     ├──────▶│ 3. ProjectMgr    │
   │    WritePRD      │ duyệt │    WriteDesign   │ duyệt │    WriteTasks    │
   │ → docs/prd.md    │       │ → system_design  │       │ → docs/task.md   │
   └──────────────────┘       └──────────────────┘       └────────┬─────────┘
                                                              G3 duyệt
   ┌──────────────────────────────────────────────────────────────▼─────────┐
   │ 4. Engineer ×4 stream  —  WriteCode → WriteCodeReview                    │
   └───────────────────────────────────┬──────────────────────────────────────┘
                                        │
   ┌────────────────────────────────────▼─────────────────────────────────────┐
   │ 5. QaEngineer  —  WriteTest → RunCode → DebugError  (lặp tới khi E2E pass) │
   └────────────────────────────────────┬─────────────────────────────────────┘
                                         ▼
                            SẢN PHẨM CHẠY ĐƯỢC (MVP)
```

| Stage | Role · Action | Đọc vào | Publish ra | Cổng |
|---|---|---|---|---|
| 1 | ProductManager · WritePRD | brief + SRS + user stories | `docs/prd.md` | **G1** |
| 2 | Architect · WriteDesign | `docs/prd.md` | `docs/system_design.md` | **G2** |
| 3 | ProjectManager · WriteTasks | `docs/system_design.md` | `docs/task.md` | **G3** |
| 4 | Engineer · WriteCode/Review | `docs/task.md` | code files | — |
| 5 | QaEngineer · WriteTest/Run/Debug | code files | `tests/`, fix | E2E pass |

---

## 3. Message Pool & nguyên tắc hand-off

- Role **không gọi nhau trực tiếp**. Mỗi role chỉ ghi 1 artifact vào pool (`docs/`).
- Role sau **chỉ đọc artifact upstream gần nhất** — không đọc lịch sử thừa → context sạch.
- Artifact là **hợp đồng**: nếu Architect cần làm rõ điều gì → ghi vào mục
  `Anything UNCLEAR` của artifact, không hỏi miệng.

---

## 4. "Chia luồng" — Stage 4 tách 4 work-stream song song

ProjectManager chia code thành 4 stream theo đúng pipeline dữ liệu. Macro là
chuỗi A→B→C→D (vì C cần output của B...), nhưng **trong mỗi stream các file
viết song song được**, và stream QA chạy kèm.

```
 Stream A — DATA LAYER (external systems + MCP)
   schema.py · connections.yaml · insighthub_mcp/server.py
   insighthub_mcp/adapters/* · datasource.py · gen_sample_data.py
        │  xuất: ProjectState
        ▼
 Stream B — RECONCILIATION
   reconcile.py · anomalies.py (15 rule)
        │  xuất: ProjectState + anomalies
        ▼
 Stream C — REPORTING (chống hallucination)
   facts.py → report.py (LLM) → validate.py
        │  xuất: narrative đã verify + traceability.json
        ▼
 Stream D — OUTPUT
   templating.py · export.py · templates/weekly_template.docx
        │  xuất: weekly.docx / weekly.md

 Cross-cutting: __main__.py (CLI wiring) · README.md
```

**Walking Skeleton** = lát cắt dọc mỏng xuyên cả A→B→C→D ngay đầu Stage 4
(chỉ Jira + 1 section + xuất Markdown) → demo chạy được sớm, rồi "đắp thịt".

---

## 5. Bản đồ artifact (cấu trúc `docs/` chuẩn MetaGPT)

```
insighthub/
├── WORKFLOW.md              # file này — định nghĩa SOP
├── docs/
│   ├── prd.md               # Stage 1 — ProductManager
│   ├── system_design.md     # Stage 2 — Architect
│   └── task.md              # Stage 3 — ProjectManager
├── insighthub_mcp/  insighthub/  templates/   # Stage 4 — Engineer
└── tests/                   # Stage 5 — QaEngineer
```

Nội dung chuẩn từng artifact:
- **prd.md**: Original Requirements · Product Goals · User Stories (MVP) ·
  Requirement Pool (P0/P1) · Scope cut · UI draft.
- **system_design.md**: Implementation approach · File list · Data structures
  & interfaces · Program call flow · Anything UNCLEAR.
- **task.md**: Required packages · Logic Analysis (file → phụ thuộc) ·
  Task list (thứ tự code file) · Shared knowledge · Anything UNCLEAR.

---

## 6. Ánh xạ sang timeline 1 ngày (9h)

| Giờ | Stage MetaGPT | Việc |
|---|---|---|
| H0 · 0:00–0:45 | Stage 1–3 nén | PRD + Design + Tasks (SRS đã có → chủ yếu là triage) |
| H1 · 0:45–2:15 | Stage 4 · Skeleton | Stream A tối thiểu + walking skeleton |
| H2 · 2:15–3:45 | Stage 4 · Stream A | Đủ MCP tool + ProjectState |
| H3 · 3:45–5:45 | Stage 4 · Stream B | reconcile + 15 anomaly rule |
| H4 · 5:45–7:45 | Stage 4 · Stream C | facts + report + validate |
| H5 · 7:45–9:00 | Stage 4 · D + Stage 5 | export + QA E2E + debug |

---

## 7. Cổng duyệt human-in-the-loop

MetaGPT thuần chạy tự động hết; ở đây chèn 3 cổng để bạn kiểm soát scope:

- **G1** sau `prd.md` — duyệt scope MVP trước khi thiết kế.
- **G2** sau `system_design.md` — duyệt kiến trúc trước khi chia task.
- **G3** sau `task.md` — duyệt task list trước khi viết code.

Qua G3 thì Stage 4–5 chạy liên tục, chỉ dừng khi BLOCKED hoặc xong.

---

## 8. Vòng phản hồi chạy được (executable feedback)

Trong Stage 5, QaEngineer lặp:
```
RunCode (python -m insighthub generate ...) → lỗi? → DebugError → sửa → RunCode
```
tới khi: E2E sinh ra `weekly.docx` + `pytest` (anomaly ≥85% + no-hallucination) pass.

---

## 9. Ai đóng vai công ty — 3 cách chạy

| Cách | Mô tả | Khi nào dùng |
|---|---|---|
| **A. Claude đóng cả 5 role** | Trong session này, tôi lần lượt đội mũ từng role, xuất artifact, dừng ở G1/G2/G3 cho bạn duyệt | Nhanh nhất cho MVP 1 ngày — **khuyến nghị** |
| **B. MetaGPT CLI thật** | `metagpt "<idea>"` → tự sinh `workspace/<proj>/docs/*` + code | Khi muốn chạy framework gốc, cần cài `metagpt` + API |
| **C. bead-orchestrator** | Dùng subagent trong `claude/.claude/skills/bead-orchestrator` phân rã task.md thành "bead" rồi dispatch worker | Khi muốn song song nhiều agent code |

---

## Trạng thái hiện tại

Đã làm sẵn (thuộc Stage 4 / Stream A — sẽ tái dùng):
`schema.py`, `connections.yaml`, `gen_sample_data.py` + `data/sample/` đã sinh.

**Bước kế tiếp:** Stage 1 — ProductManager viết `docs/prd.md` (triage SRS → MVP),
dừng ở **G1** chờ bạn duyệt.
