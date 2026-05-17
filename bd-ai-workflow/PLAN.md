# RD-to-BD Excel MCP Compiler — Plan

> **Project:** `rd-to-bd-compiler` — deterministic + traceable pipeline để chuyển Excel RD (要件定義書) tiếng Nhật sang Basic Design (基本設計書) deliverable + DD handoff Markdown.
> **Created:** 2026-05-14

---

## 1. Nguyên tắc cốt lõi

```text
1. Excel = source of truth & deliverable. Không bao giờ convert sang MD để đọc.
2. JSON intermediate = working data, schema-validated.
3. Deterministic layer (Python) đọc/ghi. LLM chỉ reasoning + wording.
4. Mọi write phải qua patch plan + approval + optimistic locking.
5. Mọi LLM output có constraint: verbatim quotes cho số/ID/date.
6. Audit log = cell changes + LLM decisions + model version.
7. Idempotent: chạy lại N lần với cùng input → output identical.
```

---

## 2. Architecture

```text
Claude / Copilot / Codex
        ↓ MCP stdio
  rd-to-bd-mcp (Python, fastmcp)
        ↓
┌─────────────────────────────────────────────┐
│ Phase A — Inspect & Validate Stack          │
│   0. format_preservation_smoke_test         │
│   1. inspect_workbook                       │
│   2. validate_mapping_against_headers       │
├─────────────────────────────────────────────┤
│ Phase B — Extract & Normalize               │
│   3. extract_rd_requirements → JSON         │
│   4. normalize_japanese (全角/半角, ID)      │
│   5. validate_extraction (schema+xref+ID)   │
├─────────────────────────────────────────────┤
│ Phase C — Plan & Approve                    │
│   6. generate_bd_patch_plan                 │
│      └─ kèm expected_old_value (locking)    │
│   7. detect_conflicts (re-run safety)       │
│   8. [HUMAN GATE]                           │
├─────────────────────────────────────────────┤
│ Phase D — Write & Verify                    │
│   9. backup_workbook                        │
│  10. apply_bd_patch (chỉ approved cells)    │
│  11. write_cell_comments (traceability)     │
│  12. verify_written_cells                   │
│  13. verify_format_preservation (binary)    │
├─────────────────────────────────────────────┤
│ Phase E — Handoff & Audit                   │
│  14. generate_dd_handoff_md                 │
│  15. build_bidirectional_traceability       │
│  16. audit_log (cells + LLM + model_id)     │
│  17. idempotency_check (re-run diff)        │
└─────────────────────────────────────────────┘
        ↓
Outputs: BasicDesign.xlsx + DD_input.md + traceability.json + audit_log.md
```

---

## 3. Key mechanisms

### 3.1 Format preservation smoke test (Phase A.0)

**Trước khi viết bất kỳ extract/write code nào:**

```python
# scripts/00_smoke_test_format.py
1. Load templates/basic_design_template.xlsx bằng openpyxl
2. Save ngay không sửa gì → basic_design_template.roundtrip.xlsx
3. Diff:
   - Mở cả 2 bằng Excel COM (pywin32), so sánh:
     * cell.NumberFormat, .Font, .Interior, .Borders
     * MergedCells, ConditionalFormatting
     * PrintArea, PageSetup
     * DataValidations, DefinedNames
4. Decision tree:
   ├─ Identical → dùng openpyxl
   ├─ Mất conditional formatting/data validation only → openpyxl + manual re-apply
   └─ Mất nhiều → switch xlwings (cần Excel installed) hoặc pywin32 trực tiếp
```

**Gate:** Không vào MVP cho đến khi smoke test pass criteria được lock.

### 3.2 Optimistic locking trong patch plan

```json
{
  "patches": [
    {
      "patch_id": "P-0042",
      "section": "2. 機能一覧",
      "sheet": "機能一覧",
      "cell": "B15",
      "expected_old_value": "",
      "expected_old_hash": "sha256:...",
      "new_value": "ユーザー認証",
      "source_requirement_id": "REQ-FUNC-001",
      "source_cell": "RD.xlsx#機能要件!B12",
      "conflict_policy": "abort"
    }
  ]
}
```

**`detect_conflicts` tool:**

```text
For each patch:
  current = read_cell(target.sheet, target.cell)
  if current != expected_old_value:
    → CONFLICT: human edited / previous run state mismatch
    → report in conflict_report.md, abort apply
```

Default policy: **`abort`**. User explicit override mới `overwrite_with_warning`.

### 3.3 Bidirectional traceability + cell comments

**`traceability.json` (2-way index):**

```json
{
  "forward": {
    "REQ-FUNC-001": ["BD:機能一覧!B15", "BD:機能一覧!C15", "BD:画面一覧!B12"]
  },
  "reverse": {
    "BD:機能一覧!B15": {
      "requirement_id": "REQ-FUNC-001",
      "source_cell": "RD.xlsx#機能要件!B12",
      "generated_at": "2026-05-14T10:30:00+09:00",
      "model_id": "claude-opus-4-7",
      "patch_id": "P-0042"
    }
  }
}
```

**Cell comments (visible trong Excel):**

```text
write_cell_comments tool ghi vào mỗi BD cell:
  Comment: "[RD-TRACE] REQ-FUNC-001 @ RD.xlsx#機能要件!B12
            Generated: 2026-05-14 by claude-opus-4-7
            Patch: P-0042"
```

→ Reviewer Nhật mở Excel hover cell là thấy ngay nguồn.

### 3.4 Validate gates

**`validate_mapping_against_headers`** (Phase A.2) — chạy TRƯỚC extract:

```python
For each sheet in mapping:
  actual_header = read_row(sheet, header_row)
  for column_letter, field_name in mapping.columns.items():
    expected_keywords = TERMINOLOGY[field_name]  # vd ["優先度","priority","重要度"]
    if not any(kw in actual_header[column_letter] for kw in expected_keywords):
      → FAIL FAST: "Mapping says E=priority but E header is '備考'"
```

**`normalize_japanese`** (Phase B.4):

```python
- NFKC normalize: ＲＥＱ－００１ → REQ-001
- Trim 全角スペース
- Detect duplicate IDs sau khi normalize
- Date format unify: 令和7年 → 2025
```

**`validate_extraction`:**

```text
- Required fields per category
- Duplicate IDs (post-normalize)
- Cross-sheet referential integrity:
    screen.requirement_id ∈ functional.requirement_id
    interface.requirement_id ∈ functional.requirement_id
- Orphan check: requirements không được reference ở đâu
```

### 3.5 LLM verbatim constraint

**LLM output schema bắt buộc:**

```json
{
  "bd_text": "ユーザーはIDとパスワードでログインする。3回連続失敗した場合、アカウントをロックする。",
  "verbatim_tokens": ["3回連続失敗", "アカウントをロック"],
  "source_quotes": [
    {"text": "3回連続失敗", "from": "RD.xlsx#機能要件!D12"},
    {"text": "アカウントをロック", "from": "RD.xlsx#機能要件!E12"}
  ],
  "paraphrased_parts": ["ユーザーはIDとパスワードでログインする"]
}
```

**Post-hoc validator (`scripts/validate_verbatim.py`):**

```python
- Regex extract tất cả số, ID, dates, business terms từ bd_text
- Mỗi token phải có trong source RD cells (sau normalize)
- Mismatch → flag in validation_report.md, block apply
```

### 3.6 LLM observability trong audit log

```md
# Audit Log — 2026-05-14T10:30:00+09:00

## 1. Workbook Changes
- BasicDesign.generated.xlsx
- Backup: workbooks/backup/BasicDesign.20260514-103000.xlsx
- Patches applied: 128 / proposed: 130 (2 skipped — see conflicts)
- Conflicts: conflict_report.md

## 2. LLM Decisions
| Patch ID | Cell | Model | Prompt Hash | Tokens In/Out | Decision Type |
|---|---|---|---|---|---|
| P-0042 | 機能一覧!B15 | claude-opus-4-7 | a3f2... | 1200/85 | wording |
| P-0043 | 機能一覧!C15 | claude-opus-4-7 | b1e9... | 1100/120 | mapping |

Full prompts: audit/llm_traces/P-0042.json (etc.)

## 3. Format Preservation
- Binary diff vs template: PASS (only data cells changed)
- Conditional formatting: preserved
- Merged cells: preserved
- Print area: preserved

## 4. Idempotency Check
- Re-run hash: identical to previous run
```

---

## 4. LLM call sites & MCP JSON contracts

> **Nguyên tắc:** LLM chỉ được gọi tại 2 điểm trong toàn pipeline. Mỗi call có prompt template cố định, structured output schema, và feed thẳng vào MCP tool tiếp theo. Mọi field khác đều do Python deterministic compute.

### 4.1 Bản đồ LLM trong pipeline

| Call site | Phase | Tool wrapper | Model | Mục đích | Output schema |
|---|---|---|---|---|---|
| **L1** | C.6a | `generate_bd_patch_plan` (LLM step) | Opus 4.7 | Section mapping + JP business wording cho từng requirement | `BDPatchCandidate` |
| **L2** | E.14a | `generate_dd_handoff_md` (LLM step) | Opus 4.7 | DD design notes + open questions per function | `DDFunctionNotes` |

**Phần còn lại 100% deterministic Python.** LLM **không** đọc Excel, không ghi Excel, không quyết định cell range, không validate verbatim — tất cả là MCP tool.

---

### 4.2 L1 — Section mapping + JP wording (Phase C.6a)

#### Input cho LLM (do MCP tool prepare)

```json
{
  "task": "map_requirement_to_bd_section",
  "rd_requirement": {
    "requirement_id": "REQ-FUNC-001",
    "category": "機能要件",
    "title": "ユーザー認証",
    "description": "利用者はIDとパスワードでログインできること。",
    "business_rule": "3回連続失敗した場合、アカウントをロックする。",
    "priority": "Must",
    "source": {
      "sheet": "機能要件",
      "cells": ["B12", "C12", "D12", "E12", "F12"]
    }
  },
  "candidate_bd_sections": [
    {"section": "2. 機能一覧", "sheet": "機能一覧", "row_template": ["function_id","function_name","overview","related_req_id"]},
    {"section": "3. 画面設計", "sheet": "画面一覧", "row_template": [...]}
  ],
  "jp_style_examples": [
    {"input": "...", "output": "..."},
    {"input": "...", "output": "..."}
  ],
  "terminology": {"ログイン": "ログイン", "アカウントロック": "アカウントロック"}
}
```

#### Output schema LLM PHẢI tuân thủ (pydantic-enforced)

```json
{
  "requirement_id": "REQ-FUNC-001",
  "mapped_section": "2. 機能一覧",
  "fields": {
    "function_id": "F-001",
    "function_name": "ユーザー認証",
    "overview": "ユーザーはIDとパスワードでログインする。3回連続失敗した場合、アカウントをロックする。",
    "related_req_id": "REQ-FUNC-001"
  },
  "verbatim_tokens": ["3回連続失敗", "アカウントをロック", "ID", "パスワード"],
  "source_quotes": [
    {"text": "3回連続失敗", "from": "RD.xlsx#機能要件!E12"},
    {"text": "アカウントをロック", "from": "RD.xlsx#機能要件!E12"}
  ],
  "paraphrased_parts": ["ユーザーはIDとパスワードでログインする"],
  "confidence": "high",
  "open_questions": []
}
```

#### Hợp đồng (contract) với MCP tool kế tiếp

```text
LLM output → generate_bd_patch_plan (MCP) compute:
  - target sheet/cell từ bd_output_mapping.yaml (KHÔNG hỏi LLM)
  - expected_old_value đọc từ template (KHÔNG hỏi LLM)
  - patch_id auto-increment (KHÔNG hỏi LLM)
  - source_cell từ rd_normalized.json (KHÔNG hỏi LLM)

Kết quả patch:
{
  "patch_id": "P-0042",                          ← MCP
  "sheet": "機能一覧",                            ← MCP (từ bd_mapping)
  "cell": "C15",                                 ← MCP (từ start_row + offset)
  "expected_old_value": "",                      ← MCP (đọc template)
  "expected_old_hash": "sha256:e3b0c4...",       ← MCP
  "new_value": "ユーザー認証",                    ← LLM (fields.function_name)
  "source_requirement_id": "REQ-FUNC-001",       ← LLM + MCP cross-check
  "source_cell": "RD.xlsx#機能要件!B12",          ← MCP
  "llm_trace_id": "L1-REQ-FUNC-001",             ← MCP
  "conflict_policy": "abort"                     ← MCP (default)
}
```

**Critical:** LLM không quyết định `cell`, `expected_old_value`, `source_cell`. LLM chỉ produce `fields.*` content và `verbatim_tokens` để validator check.

---

### 4.3 L2 — DD design notes + open questions (Phase E.14a)

#### Input cho LLM

```json
{
  "task": "generate_dd_handoff_notes",
  "function": {
    "function_id": "F-001",
    "function_name": "ユーザー認証",
    "bd_overview": "ユーザーはIDとパスワードでログインする。3回連続失敗した場合、アカウントをロックする。",
    "source_requirement": { ... full REQ-FUNC-001 ... },
    "related_screens": ["SCR-001"],
    "related_interfaces": []
  },
  "dd_context_template": "function | api | data | screen | error_cases | open_questions"
}
```

#### Output schema

```json
{
  "function_id": "F-001",
  "dd_notes": {
    "function_summary": "認証フローはログインAPIと連携し、失敗回数をDBに保持する",
    "api_candidates": [
      {"method": "POST", "path": "/auth/login", "request": ["user_id","password"], "response": ["token","expires_at"]}
    ],
    "data_candidates": [
      {"table": "users", "columns": ["user_id","password_hash","failed_count","locked_until"]}
    ],
    "screen_notes": ["ログイン画面: SCR-001"],
    "error_cases": ["3回失敗 → ロック", "ロック中 → ログイン拒否"]
  },
  "open_questions": [
    "ロック解除方法は管理者解除か自動解除か未確定",
    "パスワードポリシーの詳細は非機能要件を確認"
  ],
  "verbatim_tokens": ["3回失敗", "ロック"],
  "source_quotes": [
    {"text": "3回連続失敗", "from": "RD.xlsx#機能要件!E12"}
  ]
}
```

#### Hợp đồng với MCP tool kế tiếp

```text
LLM output → generate_dd_handoff_md (MCP) compute:
  - Markdown rendering từ jinja2 template (KHÔNG hỏi LLM)
  - Traceability table từ traceability.json (KHÔNG hỏi LLM)
  - Section ordering, file structure (KHÔNG hỏi LLM)

MCP chỉ insert dd_notes + open_questions vào template slots cố định.
```

---

### 4.4 Anti-patterns — LLM TUYỆT ĐỐI không được làm

| ❌ Không làm | ✅ Thay vào đó |
|---|---|
| Quyết định cell address (vd "ghi vào B15") | MCP đọc `bd_output_mapping.yaml` |
| Đọc file Excel trực tiếp | MCP `read_range` → JSON cho LLM |
| Ghi file Excel | MCP `apply_bd_patch` sau approval |
| Quyết định `expected_old_value` | MCP đọc target cell hiện tại |
| Tự generate `patch_id` | MCP auto-increment |
| Validate verbatim của chính mình | Python regex validator (post-hoc) |
| Quyết định mapping schema giữa các project | YAML file, version-controlled |
| Format Japanese date | MCP `normalize_japanese` |
| Tự retry khi schema invalid | MCP enforce schema, return error → LLM retry với feedback |

---

### 4.5 Prompt caching strategy

```text
Cache layer 1 (system prompt + style guide):
  - Role definition
  - Verbatim constraint rules
  - JP business writing guidelines
  - Output schema spec
  → ~3000 tokens, cache TTL 1h, hit rate ~95%

Cache layer 2 (per-workbook context):
  - rd_normalized.json (relevant subset)
  - mapping YAML
  - jp_style_examples
  → ~5000 tokens, cache TTL session, hit rate ~80%

Per-call (uncached):
  - Single requirement payload
  → ~200-500 tokens

Tiết kiệm cost ~70-80% so với gửi full context mỗi call.
```

---

## 5. MCP Toolset

| Tool | Phase | Input | Output | Notes |
|---|---|---|---|---|
| `format_preservation_smoke_test` | A.0 | template_path | report.json + decision | **Gate** |
| `inspect_workbook` | A.1 | path | sheets, used_range, merged, macros, formulas | warn macro early |
| `validate_mapping_against_headers` | A.2 | wb, mapping.yaml | pass/fail per sheet | **Fail-fast** |
| `read_range` | A | wb, sheet, range | cells[] | low-level |
| `extract_rd_requirements` | B.3 | wb, mapping | rd_extracted.json | |
| `normalize_japanese` | B.4 | rd_extracted.json | rd_normalized.json | NFKC + dates |
| `validate_extraction` | B.5 | rd_normalized.json | validation_report.md | xref + duplicates |
| `generate_bd_patch_plan` | C.6 | rd_normalized, bd_template, bd_mapping | bd_patch_plan.json (+ expected_old_value) | LLM wording happens here |
| `validate_verbatim` | C.6.5 | patch_plan + rd_normalized | verbatim_report.md | **Block apply nếu fail** |
| `detect_conflicts` | C.7 | patch_plan, target_wb | conflict_report.md | optimistic lock check |
| `backup_workbook` | D.9 | wb | backup_path | timestamped |
| `apply_bd_patch` | D.10 | patch_plan, approval=APPROVED | written_wb | only approved patches |
| `write_cell_comments` | D.11 | written_wb, traceability | wb with comments | reviewer-facing |
| `verify_written_cells` | D.12 | wb, patch_plan | verify_report.md | read-back compare |
| `verify_format_preservation` | D.13 | template, written_wb | format_diff_report.md | binary diff |
| `generate_dd_handoff_md` | E.14 | rd_normalized, written_wb, traceability | DD_input.md | |
| `build_bidirectional_traceability` | E.15 | patch_plan, written_wb | traceability.json | forward + reverse |
| `audit_log` | E.16 | all artifacts + llm_traces/ | audit_log.md | |
| `idempotency_check` | E.17 | current_run, previous_run | identical: bool + diff | regression gate |

---

## 6. Project Structure

```text
rd-to-bd-compiler/
├── ai/                              # SDD artifacts
│   ├── RD.md
│   ├── SD.md
│   ├── BD.md
│   ├── status.md
│   └── handoff-claude.md
│
├── rd-to-bd-mcp/                    # MCP server (Python, fastmcp)
│   ├── pyproject.toml
│   └── src/rd_to_bd_mcp/
│       ├── server.py
│       ├── tools/
│       │   ├── inspect.py
│       │   ├── extract.py
│       │   ├── validate.py
│       │   ├── patch_plan.py
│       │   ├── apply.py
│       │   └── handoff.py
│       ├── core/
│       │   ├── excel_io.py          # openpyxl (or xlwings sau smoke test)
│       │   ├── normalize.py         # NFKC, 全角/半角
│       │   ├── locking.py           # optimistic locking
│       │   ├── traceability.py
│       │   └── audit.py
│       └── schemas/                 # pydantic models
│
├── mappings/
│   ├── rd_sheet_mapping.yaml
│   ├── bd_output_mapping.yaml
│   └── terminology.yaml             # JP keywords cho header validation
│
├── schemas/                         # JSON schemas
│   ├── rd_extraction.schema.json
│   ├── bd_patch.schema.json         # với expected_old_value, locking
│   ├── traceability.schema.json
│   └── dd_handoff.schema.json
│
├── templates/
│   └── basic_design_template.xlsx
│
├── workbooks/
│   ├── input/RD.xlsx
│   ├── output/BasicDesign.generated.xlsx
│   └── backup/
│
├── intermediate/
│   ├── rd_extracted.json
│   ├── rd_normalized.json
│   ├── bd_patch_plan.json
│   ├── conflict_report.md
│   └── verbatim_report.md
│
├── output/
│   ├── DD_input.md
│   ├── traceability.json
│   ├── audit_log.md
│   ├── validation_report.md
│   ├── verify_report.md
│   └── format_diff_report.md
│
├── audit/
│   └── llm_traces/                  # raw prompts/responses per patch
│
└── tests/
    ├── test_smoke_format.py
    ├── test_extract_functional.py
    ├── test_locking.py
    ├── test_verbatim.py
    └── test_idempotency.py
```

---

## 7. Human Review Gates

| Gate | Khi nào | Artifact review | Pass criteria |
|---|---|---|---|
| **G0** | Sau smoke test | format_smoke_report.json | Format loss acceptable, stack chosen |
| **G1** | Sau extract+normalize | rd_normalized.json + validation_report.md | Đúng sheet/cell, không thiếu required, xref pass |
| **G2** | Sau patch plan | bd_patch_plan.json + verbatim_report.md + conflict_report.md | Đúng target cells, verbatim pass, no unresolved conflicts |
| **G3** | Sau apply+verify | verify_report.md + format_diff_report.md | Cells khớp, format preserved |
| **G4** | Sau DD handoff | DD_input.md + traceability.json | Đủ context, không hallucinate |
| **G5** | Sau audit + idempotency | audit_log.md + idempotency check | Re-run identical, LLM decisions traceable |

---

## 8. MVP Roadmap (theo SDD)

### Phase 0 — SDD artifacts (BẮT BUỘC trước code)
- [ ] Viết `ai/RD.md` từ template `SDD-toolkit/templates/RD.md`
- [ ] Open questions: format preservation strategy, idempotency policy, conflict policy default
- [ ] APPROVE RD

### Phase 1 — Foundation
- [ ] G0: Format preservation smoke test → quyết định openpyxl vs xlwings
- [ ] Setup MCP server skeleton (fastmcp)
- [ ] Pydantic schemas cho extraction + patch + traceability

### Phase 2 — MVP scope (機能要件 → 機能一覧)
- [ ] `inspect_workbook` + `validate_mapping_against_headers`
- [ ] `extract_rd_requirements` + `normalize_japanese` + `validate_extraction`
- [ ] G1 review
- [ ] `generate_bd_patch_plan` (with locking) + `validate_verbatim` + `detect_conflicts`
- [ ] G2 review
- [ ] `backup` + `apply_bd_patch` + `write_cell_comments` + `verify_written_cells` + `verify_format_preservation`
- [ ] G3 review
- [ ] `generate_dd_handoff_md` + `build_bidirectional_traceability`
- [ ] G4 review
- [ ] `audit_log` + `idempotency_check`
- [ ] G5 review

### Phase 3 — Idempotency regression test
- [ ] Chạy MVP 3 lần liên tiếp với cùng input → output hash identical
- [ ] Chạy với RD đã sửa 1 cell → chỉ patch liên quan thay đổi (không drift)

### Phase 4+ — Mở rộng
- 画面要件 → 画面設計
- 帳票要件 → 帳票設計
- 外部IF要件 → 外部IF設計
- 非機能要件 → 非機能設計

---

## 9. Risk Register

| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Format loss khi save | High | G0 smoke test, fallback xlwings | Phase 1 |
| Re-run wipe khách edits | High | Optimistic locking (expected_old_value) | Phase 2 |
| LLM paraphrase số/ID | High | Verbatim constraint + post-validator | Phase 2 |
| Mapping schema drift | High | Header keyword validation, fail-fast | Phase 2 |
| Macro/VBA workbook | Medium | Detect ở inspect, warn early | Phase 1 |
| Excel file lock | Low | Pre-check, fail-fast | Phase 2 |
| LLM non-determinism (re-run khác output) | Medium | Cache LLM responses per patch_id, idempotency check | Phase 2 |
| Token cost cao | Low | Log per-patch tokens, batch similar patches | Phase 3 |

---

## 10. Câu chốt

```text
RD-to-BD Compiler:
- Deterministic Python pipeline + LLM với verbatim constraint
- Excel I/O qua MCP tools, không qua LLM
- Optimistic locking + format preservation gates
- Bidirectional traceability + cell comments
- LLM observability + idempotency check
- 5 human review gates, không chạy một mạch
- SDD-driven: RD → SD → BD → Implementation
```

---

## 11. Build vs Reuse & References

> Mỗi MCP tool / JSON schema: tự code hay dùng lib có sẵn? Dưới đây là decision table cụ thể.

### 11.1 Decision table

| Step / Tool | Build / Reuse | Source |
|---|---|---|
| MCP server framework | ✅ Reuse | [`fastmcp`](https://github.com/jlowin/fastmcp) hoặc [`mcp` Python SDK](https://github.com/modelcontextprotocol/python-sdk) |
| Excel read/write low-level | ✅ Reuse | [`openpyxl`](https://openpyxl.readthedocs.io) (default) hoặc [`xlwings`](https://www.xlwings.org) (sau G0) |
| Format preservation diff | 🟡 Reuse + wrap | `pywin32` Excel COM cho NumberFormat/ConditionalFormatting compare |
| JSON schema enforce | ✅ Reuse | [`pydantic` v2](https://docs.pydantic.dev) — define `BDPatchCandidate`, `DDFunctionNotes` |
| LLM structured output | ✅ Reuse | [Anthropic tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) với `input_schema` từ pydantic |
| Prompt caching | ✅ Reuse | [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — `cache_control` block |
| Japanese NFKC normalize | ✅ Reuse | Python built-in `unicodedata.normalize('NFKC', text)` |
| YAML mapping config | ✅ Reuse | `pyyaml` + pydantic |
| MD generation từ template | ✅ Reuse | `jinja2` template engine |
| Cell comments `[RD-TRACE]` | ✅ Reuse | `openpyxl.comments.Comment` |
| Existing Excel MCP server | 🟡 Tham khảo API | [`haris-musa/excel-mcp-server`](https://github.com/haris-musa/excel-mcp-server) — không fit prod (thiếu locking/trace) |
| `extract_rd_requirements` | 🔴 Self-code | Mapping YAML + openpyxl scan · ~50–100 LOC |
| `normalize_japanese` logic | 🔴 Self-code | 令和→西暦, ID dedup, full-width trim · ~80 LOC |
| `validate_extraction` | 🔴 Self-code | Cross-sheet xref, duplicates, orphans · ~100 LOC |
| `generate_bd_patch_plan` (L1) | 🔴 Self-code | Pydantic + Anthropic SDK + few-shot + cache · ~150 LOC |
| `validate_verbatim` | 🔴 Self-code | Regex numbers/IDs/dates vs RD source · ~60 LOC |
| Optimistic locking | 🔴 Self-code | Compare `expected_old_value` với current cell · ~40 LOC |
| `apply_bd_patch` | 🔴 Self-code | Loop patches, write, preserve style · ~80 LOC |
| Bidirectional traceability | 🔴 Self-code | Forward + reverse index builder · ~50 LOC |
| `audit_log` builder | 🔴 Self-code | Jinja2 + collect LLM traces · ~80 LOC |
| `idempotency_check` | 🔴 Self-code | Hash compare files · ~30 LOC |

### 11.2 Ước lượng

- **~30% reuse** (framework, libs, SDK)
- **~70% self-code** — nghiệp vụ riêng RD↔BD + locking + audit
- **Tổng project**: 1500–2500 LOC Python
- **Không** có MCP có sẵn fit nghiệp vụ Nhật + locking + traceability → phải build `rd-to-bd-mcp` riêng

### 11.3 References cần đọc trước khi code

| Topic | Link |
|---|---|
| MCP Python SDK + fastmcp quickstart | https://modelcontextprotocol.io/quickstart/server |
| Anthropic tool use + structured output | https://docs.anthropic.com/en/docs/build-with-claude/tool-use |
| Anthropic prompt caching | https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching |
| openpyxl (cell comments, merged cells, comments) | https://openpyxl.readthedocs.io |
| pydantic v2 schema | https://docs.pydantic.dev/latest |
| Existing Excel MCP (reference API design) | https://github.com/haris-musa/excel-mcp-server |
| fastmcp examples | https://github.com/jlowin/fastmcp#examples |
| xlwings (fallback nếu openpyxl mất format) | https://docs.xlwings.org |

### 11.4 Recommended spike sequence

1. **Day 1 — Learn:** fastmcp quickstart + viết 1 tool đơn giản (`inspect_workbook`)
2. **Day 2 — G0:** Format preservation smoke test → quyết định openpyxl vs xlwings
3. **Day 3–9 — MVP:** Build pipeline scope 機能要件 → 機能一覧 (~5–7 ngày)
4. **Day 10 — Regression:** Idempotency test 3-run identical

---

## 12. Next steps

1. Viết `ai/RD.md` đầy đủ theo `SDD-toolkit/templates/RD.md`
2. Design chi tiết `bd_patch.schema.json` với optimistic locking
3. Viết `format_preservation_smoke_test` script (G0 gate)
