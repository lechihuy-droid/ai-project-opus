# BD — Waves: InsightHub Co-pilot (mở rộng sau MVP)
**Date:** 2026-05-23
**Status:** 🔵 Planning
**Ref:** `RD` / `SD` / `CR-001` / `CR-002` — insighthub-copilot-mvp
**Thực thi:** Codex chạy **từng Wave**; sau mỗi Wave, Claude verify (pytest + CLI E2E) rồi mới sang Wave sau.

> Phạm vi: các hạng mục gap còn lại trừ pitch slides / demo video / push GitHub.
> Pipeline lõi đã chạy E2E. Mỗi Wave chỉ làm đúng phần của nó, **không đụng Wave khác**.

## Quy tắc chung cho Codex

- Interpreter: `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`. Test: env `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`.
- `schema.py`: được phép **THÊM model mới** cho monthly/portfolio/diff; **KHÔNG** đổi tên/xóa field cũ.
- Anti-hallucination bất biến: số/ID do Python tính; `validate` chặn số bịa. Không làm yếu lớp này.
- Không `git commit`. Mỗi Wave: chạy smoke test của Wave đó, tự verify trước khi kết thúc.
- Chỉ làm Wave được giao trong prompt.

---

## WAVE 1 — De-risk + quick wins

### W1.1 — Robustness + dữ liệu biến thể (#6)
**Mục tiêu:** pipeline không gãy trên dữ liệu chưa từng thấy (rủi ro chấm W5 data niêm phong).
**Việc:**
- Audit `datasource.py`, `reconcile.py`, `anomalies.py`, `facts.py` tìm giả định cứng: chia cho 0
  (MTTF, completion_pct, phase %), field optional thiếu (story_points, jira_key, resolved date),
  list rỗng (0 issue/bug/commit/minute/sprint), section rỗng.
- Xử lý mọi edge case → pipeline luôn ra `Report` hợp lệ (status=Green khi 0 anomaly).
- Mở rộng `scripts/gen_sample_data.py`: thêm tham số `--seed`/`--variant` sinh **bộ data thứ 2**
  khác hình dạng (project name khác, số lượng khác, tên sprint/phase khác, vài category rỗng) →
  `data/sample-variant/`.
- Tạo `tests/test_robustness.py`: chạy full pipeline trên data biến thể + trên các ProjectState
  suy biến (rỗng/thiếu field) → assert không crash, `Report` 9 section, `validate` pass.
**Files:** sửa `insighthub/*.py` (chỗ cần), `scripts/gen_sample_data.py`; mới `tests/test_robustness.py`, `data/sample-variant/`.
**Smoke:** `pytest tests/test_robustness.py` pass; `python -m insighthub generate` trên data biến thể ra đủ file.

### W1.2 — Localize header export (#11)
**Mục tiêu:** header báo cáo cũng đúng ngôn ngữ (giờ còn EN: "Weekly Status Report", "Period", "Overall Status").
**Việc:** thêm bảng header vào `i18n.py`; `export.py` dùng `i18n` cho dòng tiêu đề/Period/Overall Status (cả `.md` và DOCX) theo `report.language`.
**Files:** sửa `insighthub/i18n.py`, `insighthub/export.py`.
**Smoke:** `python -m insighthub generate` → `output/weekly.md` header tiếng Nhật.

### W1.3 — Citation hyperlink (#12)
**Mục tiêu:** citation bấm được trong DOCX/PDF/MD.
**Việc:** `connections.yaml` thêm `base_urls` (jira/github tùy chọn). `export.py`: render `[system:ref]`
thành hyperlink — DOCX dùng hyperlink field, MD dùng `[ref](url)`. Thiếu base_url → giữ text như cũ.
**Files:** sửa `insighthub/export.py`, `connections.yaml`.
**Smoke:** `generate` → `weekly.md` có link markdown; DOCX mở ra citation là hyperlink.

**DoD Wave 1:** `pytest` toàn bộ pass; CLI E2E ra 5 file; header JP; citation có link.

---

## WAVE 2 — Core

### W2.1 — Báo cáo tháng (#1)
**Mục tiêu:** `--type monthly` — deliverable bắt buộc brief §7.
**Việc:**
- `__main__.py`: `--type` nhận `monthly`.
- `schema.py`: thêm model cho section tháng (THÊM mới, không sửa cũ).
- Monthly facts = 9 section weekly + 3 section tháng tính từ `ProjectState` hiện có:
  `phase_trend` (tiến độ phase theo 4 tuần), `budget_effort` (planned MM vs actual MM, burn rate),
  `quality_kpis` (defect density, review coverage từ PR/bug data). Phần cần data ngoài tầm
  (resource snapshot, deliverables) → bỏ qua hoặc tối giản, ghi rõ trong code.
- `report.py` / `export.py`: render được report tháng.
**Files:** sửa `__main__.py`, `schema.py`, `facts.py`, `report.py`, `export.py`; có thể thêm `monthly.py`.
**Smoke:** `python -m insighthub generate --type monthly --no-llm` → ra report có 3 section tháng; `validate` pass.

### W2.2 — Tham chiếu tone từ báo cáo cũ (#8)
**Mục tiêu:** tone khớp báo cáo trước (tiêu chí 4).
**Việc:** nạp `data/sample/previous_reports/*.md` (nếu chưa có → sinh 1–2 bản mẫu). Trích làm
**style reference** đưa vào system prompt của `report.py` (đường LLM) — few-shot tone, KHÔNG dùng
số trong đó. Đường template-only bỏ qua.
**Files:** sửa `report.py`, `datasource.py` (loader previous reports); mới `data/sample/previous_reports/`.
**Smoke:** previous reports load được; system prompt chứa đoạn tham chiếu tone.

**DoD Wave 2:** `pytest` pass; `generate --type monthly` + `--type weekly` đều chạy.

---

## WAVE 3 — Rubric features

### W3.1 — Đa template (#10)
**Mục tiêu:** đổi/thêm template không cần sửa code (tiêu chí 5, 10đ).
**Việc:** `templates/` chứa nhiều `.docx` + file metadata (vd `templates/registry.yaml`: tên, type,
placeholder). `--template <name>` ở CLI + auto-detect mặc định. `templating.py` chọn template theo
tên. Thêm template = thả file + 1 dòng registry, không sửa code.
**Files:** sửa `templating.py`, `__main__.py`, `export.py`; mới `templates/registry.yaml` + ≥1 template thứ 2.
**Smoke:** `generate --template <name2>` dùng đúng template thứ 2.

### W3.2 — Diff vs báo cáo trước (#13)
**Mục tiêu:** nêu thay đổi tuần-trên-tuần (tiêu chí 8, 5đ).
**Việc:** lưu snapshot mỗi lần chạy (`output/history/<date>.json`). Hàm `diff` so facts kỳ này với
snapshot gần nhất → liệt kê: ticket mới đóng, đổi trạng thái, delta metric. Xuất `output/diff.md`
+ thêm 1 mục "Changes vs last report" vào báo cáo.
**Files:** mới `insighthub/diff.py`; sửa `__main__.py`, `export.py`.
**Smoke:** chạy 2 lần với data khác → `diff.md` nêu đúng thay đổi.

**DoD Wave 3:** `pytest` pass; 2 template chạy; diff hoạt động.

---

## WAVE 4 — Nặng / ít chắc chắn

### W4.1 — API adapter thật (#9)
**Mục tiêu:** chứng minh "both API and Excel modes" (tiêu chí 1).
**Việc:** `insighthub_mcp/adapters/api_adapter.py` — implement `JiraApiAdapter`/`ChatApiAdapter`/
`GithubApiAdapter` gọi HTTP thật (`httpx`/`requests`), auth bằng token env theo `connections.yaml`
(`auth: env:VAR`), trả đúng contract `SourceAdapter.fetch()`. `connections.yaml` `adapter: api`
chuyển sang dùng chúng.
**Lưu ý:** không có instance thật để test → DoD = import được + unit test **mock tầng HTTP**.
**Files:** sửa `api_adapter.py`, server adapter switch; mới `tests/test_api_adapter.py` (mocked).
**Smoke:** `pytest tests/test_api_adapter.py` pass; `import` adapter không lỗi.

### W4.2 — Portfolio roll-up (#14)
**Mục tiêu:** DM xem nhiều dự án (tiêu chí 9, bonus 5đ).
**Việc:** `--type portfolio` over N project (dùng data biến thể từ W1.1 làm project 2–3).
Tổng hợp: mỗi project 1 dòng — status traffic light, top 3 risk, metric đầu mục. Xuất dashboard
(MD + DOCX). Drill-down link tới report từng project.
**Files:** mới `insighthub/portfolio.py`; sửa `__main__.py`, `export.py`, `schema.py` (model mới).
**Smoke:** `generate --type portfolio` over ≥2 project → dashboard liệt kê đủ project.

**DoD Wave 4:** `pytest` pass; `--type portfolio` chạy; API adapter import + mocked test pass.

---

## Sau 4 Wave

- **#5 Architecture doc** — **Claude** viết (gộp SD + concept-comparison thành bản BGK đọc).
- **Claude** verify tự động sau mỗi Wave.
- **User** chạy test thủ công M-01…M-04 (đường Copilot trong VS Code) sau cùng.

---

*InsightHub Co-pilot — BD-Waves v1.0 | 2026-05-23*
