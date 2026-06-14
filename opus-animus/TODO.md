# TODO — OPUS ANIMUS
**Updated:** 2026-05-02
**North Star:** [NORTH-STAR.md](NORTH-STAR.md) ← đọc trước khi chọn việc làm tiếp
**Dev approach:** [dev-approach/README.md](dev-approach/README.md)
**Architecture:** [docs/SA-system-architecture.md](docs/SA-system-architecture.md)

---

## Quy tắc tracking

```text
1 file duy nhất cho mọi sub-project: TODO.md này
Mỗi item có ID dạng [PROJECT-N], ví dụ [LUCIDA-3], [CONS-2]
Completed items chuyển xuống ## Done theo ngày

ĐẦU MỖI SESSION MỚI:
  → Hỏi người dùng: "Muốn làm sub-system nào?" (liệt kê tên + status ngắn)
  → Chỉ đọc và track todos của sub-system đó
  → Không load toàn bộ file vào context — tiết kiệm context window

Session TodoWrite chỉ dùng để track progress trong phiên — không thay thế file này
Cuối session: cập nhật status + completed items vào TODO.md
```

**Project prefixes:**

| Prefix | Sub-project |
|---|---|
| `LUCIDA` | opus-lucida — video lesson pipeline |
| `HOME` | Personal home dashboard web app |
| `CONS` | Opus Consilium — central inbox + routing |
| `WIKI` | Personal wiki + knowledge system |
| `MEM` | Cross-session memory / self-improving agent layer |
| `NS` | North Star transformation layer |
| `INFRA` | Infrastructure / scheduler |
| `IDEA` | Ideas chưa scope |

---

## Trạng Thái Tổng Quan

| Component | Status | Ghi chú |
|---|---|---|
| Module A — ResearchCrew | 🟡 Manual | Chạy tay un_research.py AI` — chưa schedule |
| Module B — Daily Brief | 🟡 Manual | Chạy tay un_daily.py` — chưa schedule |
| Module C — Wiki Agent | ✅ Running | wiki-poll + wiki-lint-weekly — path fixed 2026-04-29 |
| markitdown-agent | ✅ Integrated | Integrated mode, watch raw/inbox/ |
| Content Collector batch | ✅ Running | Task Scheduler 05:30 active, last run OK |
| Hermes Skill Layer | ❌ No-Go (2026-06-11) | Module C + Telegram đã bỏ, tương tác qua app LLM — xem EVAL doc |
| **Lucida — TTS pipeline** | ✅ Done | edge-tts + Voicevox + RVC agent + assembly |
| **Lucida — HTML slide pipeline** | ✅ Done | deck_generator + Playwright screenshot, 17 frames |
| **Lucida — Multi-agent workflow** | ✅ Done | Gates A-K, runners 31-38, SOP docs |
| **Lucida — Video (MP4)** | 🔴 Blocked | 02-script.md chưa stable, chưa run assembly |
| **HOME — Web dashboard** | 🟡 Planned | RD+BD done, chưa build (plan: enumerated-sniffing-dusk) |

---

## 🔵 Next — Cần Thảo Luận / Planning

### [CONS-REBUILD] Rebuild Opus Consilium — Collect Layer trước
**Codex resume 2026-05-12:** active task is now CONS-RESEARCH-TOOL. FastAPI dashboard/API is running at `http://127.0.0.1:8765`; `/api/dashboard` and `/api/articles` smoke tests pass.
**Status:** 🟡 Design phase — đang thảo luận architecture
**📄 Đọc trước khi tiếp tục:** `opus-consilium/docs/ANALYSIS-consilium-rebuild-2026-05-09.md`
**Context:** Hệ thống hiện tại collect 38 articles/ngày nhưng không có giá trị thực tế. Cần rebuild từ đầu theo mục tiêu: 5 items/ngày, goal-aligned, compound vào wiki.
**Phiên thảo luận đã có:**
- Vẽ as-is diagram → xác định 3 điểm gãy chính
- Xác định: external sources là priority, 2-30 phút/ngày budget
- Proposed architecture: Tier 1 (primary) + Tier 2 (curator) + LLM filter + Digest Engine
**Việc cần làm tiếp:**
- [ ] Bạn confirm proposed architecture
- [ ] Verify RSS URLs của sources mới (Anthropic, OpenAI, The Batch, Import.ai)
- [ ] Design digest engine (Claude subagent vs Groq)
- [ ] Rebuild config.yaml sources
- [ ] Fix 3 broken loops: Module A→wiki, Module B→real wiki, thêm Reflection layer
- [ ] Tạo subagents: consilium-researcher, consilium-briefer, consilium-reflector
- [x] Stabilize local dashboard/API resume path — 2026-05-12 (`run_dashboard.py`, `api/articles.py`, `api/actions.py`)
- [x] Add safe dry-run action option before exposing full collect from UI — 2026-05-12 (`collect_dry_run`)
- [x] Render daily Markdown-style Intel reports directly in Intel tab with links by day — 2026-05-12 (`api/intel.py`)
- [x] Write Intel tab plan: Horizon radar + AI-News-Briefing report + Agently workflow, biased for FPT Japan / AI-SDLC / FDE — 2026-05-12
- [x] Execute Intel plan slice 1: explicit Intel schema, structured report sections, actor/category/signal maps, Used/Unused state — 2026-05-12
- [x] Add gated `intel_synthesis` action placeholder — 2026-05-12
- [x] Simplify Intel tab UX to latest AI market changes → summary → suggested actions — 2026-05-12 (`/api/intel/simple`, `SimpleIntelView`)
- [x] Run today's Intel refresh without wiki ingest / Telegram — 2026-05-12 (107 fetched, 28 saved)
- [ ] Browser-check Intel/Reading/Actions views

### [POS-1] POSITIONING.md — Định Vị Bản Thân trong Làn Sóng AI
**Status:** 🟡 Thảo luận — chưa có doc
**Context:** Hướng đi: AI Engineering Presales / Forward Deployed Engineering. Cần 1 doc riêng định vị rõ "tôi là ai trong AI era này và cần gì để đến đó."
**Việc cần làm:**
- [ ] Phiên thảo luận: clarify role hiện tại + context công ty → xác định skill gap cụ thể
- [ ] Viết `POSITIONING.md`: định vị hiện tại → target role → gap → roadmap 12 tháng
- [ ] Link POSITIONING.md vào GOALS.md Track 3 (Sự nghiệp)
- [ ] Update OPUS ANIMUS filter: bias content theo presales/forward-deploy skill building

---

## 🔥 Immediate — Làm Ngay (không cần RD)

### [LUCIDA-1] Chạy full pipeline → MP4 đầu tiên
**Status:** 🔴 Ready to run — script 1154 dòng có nội dung đầy đủ, frames/ đã có 17 PNGs
**Blocker thực sự:** Chưa chạy TTS + assembly, chưa có raw-wake-cluster.mp4
**Việc cần làm:**
- [ ] Chạy TTS: `python automation/video/tts_agent.py ... --slides 1-17`
- [ ] Review audio pacing (VI/JP transitions, pause timing)
- [ ] Chạy assembly: `pipeline.py wake-cluster --skip-screenshot --skip-generate`
- [ ] Review MP4 đầu tiên → note feedback vào post-video-decision-log.md
- [ ] (Sau đó) Viết Design Layer cho `03-slide-deck.md` nếu cần nâng quality slide

- [x] **Verify Task Scheduler** — 2026-04-28
- [x] **Fix wiki-poll + wiki-lint-weekly path** — 2026-04-29 (`wiki_poll.bat` + `wiki_lint.bat`, schtasks /change OK)
- [x] **Test RSS full content** — 2026-04-28 (HF blog + Simon Willison → 6000 chars ✅)
- [x] **Test markitdown-agent integrated mode** — 2026-04-28 (txt → articles/, source → processed/ ✅)
- [x] **Verify ingest.py fix** — 2026-04-28 (.docx → readable text, category=articles ✅)
- [x] **[REVIEW] Gaps auto-filled** — 2026-04-28 (GOALS L1/L2, VISION Q4, NORTH-STAR confirmed)
- [x] **[HOME] Fix layout LIFE TRACKS** — 2026-04-28 (freedom_short strip, 3 cột thẳng hàng ✅)
- [ ] **[HOME] Điền số vào GOALS.md** — Track 1 tài chính, Track 2 sức khỏe, Track 3 sự nghiệp

### [POS-1] Verify 10 Open Questions của POSITIONING.md v1.1
**Status:** 🟡 Hypothesis doc — chưa execute roadmap cho đến khi verify
**File:** [POSITIONING.md](POSITIONING.md) §4 Open Questions
**Việc cần làm (ưu tiên theo cost/signal):**
- [ ] **Q4 (cheapest, highest signal):** Phỏng vấn 1 FPT AI product owner 30' → FPT thật sự có AI product hay chỉ methodology?
- [ ] **Q5:** Hỏi HR/Director — role "AI Presales" có existed hoặc có thể có ở FPT Japan?
- [ ] **Q6:** Informal conversation với GM/Director — leadership có open với pivot direct-to-end-user?
- [ ] **Q1, Q2, Q3:** Desk research — Nikkei/IDC/Gartner JP report về SIer AI adoption + end user RFP behavior
- [ ] **Q7, Q8:** Định nghĩa lại "đủ credible" + adjust timeline theo JP sales cycle 9–18 tháng
- [ ] **Q9, Q10:** Reflection — explicit cost section + plan B nếu FPT từ chối pivot
- [ ] Sau khi có data → viết v1.2: rewrite §1, §2 theo 3-cột Control Matrix
**Reference:** [skill-gap-action-plan.html](skill-gap-action-plan.html) — long-term skill plan, không execute cho đến khi v1.2

---

## 🔵 Next — Cần RD/BD Trước Khi Build

### [MEM-1] Cross-Session Memory — `recall` (Phase 1 self-improving agent) 🔴 HIGH
**Status:** 🟡 SDD ready — RD/SD/BD đã viết, chờ approve để giao Codex build
**Docs:** `opus-consilium/docs/RD-cross-session-memory.md` (🟡 In Review) · `SD-cross-session-memory.md` · `BD-cross-session-memory.md` (kèm Test Plan)
**Plan tổng:** `docs/SYNTHESIS-self-improving-agent-plan.html` — Phase 1(b)
**Mục tiêu:** `python run_recall.py "<câu>"` → index FTS5 (`ai/sessions` + `handoff` + `status` + wiki `INDEX.md`) trả ranked snippet. Pure SQLite, **không LLM** → tức thì, miễn phí, zero dep. Lấp điểm yếu "mỗi session fresh".
**Tuyến:** RD/SD/BD = Opus (done). Coding + test = Codex (`codex exec`) theo BD.
**Việc cần làm trước khi code:**
- [ ] Approve RD (🟡→🟢) + trả lời 5 Open Questions (đã có default)
- [ ] Approve SD → BD
- [ ] Giao Codex build theo BD (Step 0→6) + chạy Test Plan
- [ ] Claude review diff → merge
**Sau MEM-1:** Phase 1(a) Skills hoá 3 pipeline (RD riêng) → Phase 2 Hooks + Curator.

### [LUCIDA-2] HOME Web Dashboard — Build
**Status:** 🟢 Partially built inside `opus-consilium` — local FastAPI dashboard is now the active research/news tool surface
**Spec:** C:\Users\HUY\.claude\plans\enumerated-sniffing-dusk.md
**Mục tiêu:** Chuyển un_home.py` thành local web app (FastAPI + vanilla JS) tại localhost:8765
**Việc cần làm (theo BD):**
- [x] Step 1: `pip install fastapi uvicorn` → requirements.txt
- [x] Step 2: `api/data.py` — refactor hàm từ run_home.py
- [x] Step 3: `api/dashboard.py` — GET /api/dashboard
- [x] Step 4: `api/goals.py` — GET/POST /api/goals
- [x] Step 5: `api/articles.py` — GET /api/articles
- [x] Step 6: `api/actions.py` — POST /api/run/{action}, GET /api/run/{job_id}
- [x] Step 7: `run_dashboard.py` — FastAPI entry point, port 8765
- [x] Step 8: `dashboard/index.html` — SPA shell
- [ ] Step 9: Verify end-to-end (data hiện đúng, edit GOALS.md, trigger actions)

### [LUCIDA-3] deck_generator.py — Grammar 2-column layout
**Status:** 🟡 Planned (post-MVP upgrade)
**Mô tả:** Slides 06-09 (grammar cards) hiện render single-column. Upgrade lên 2-col: pattern headline trái, breakdown (Nghĩa/Hình/Dụng/example) phải.
**Trigger:** Sau khi video đầu tiên publish và review quality
- [ ] Implement ender_grammar_2col()` trong `deck_generator.py`
- [ ] Update CSS `.layout-grammar` thành `grid-template-columns: 320px 1fr`
- [ ] Regenerate deck + screenshot + visual review

### [LUCIDA-4] Multi-frame reveal export
**Status:** 🟡 Planned (post-MVP upgrade)
**Mô tả:** Mỗi reveal state trong `Build / reveal` block → 1 frame riêng (slide-14-01.png, slide-14-02.png...). Cần upgrade cả deck_generator + assembly_agent.
**Sub-tasks:**
- [ ] Parse `Build / reveal` block trong `deck_generator.py` → list reveal states
- [ ] Render HTML với reveal state JS (click/step để chuyển)
- [ ] `screenshot_slides.py` export từng state: `slide-14-01.png`, `slide-14-02.png`...
- [ ] `assembly_agent.py` nhận timing map: 1 audio segment → N frames (equal split hoặc manual timing)
- [ ] Update `pipeline.py` để pass frame timing map sang assembly

### [CONS-1] Opus Consilium â€” Central Inbox and Routing
**Status:** Planning
**Spec:** `opus-consilium/docs/SD-central-inbox-routing.md`
**Build plan:** `opus-consilium/docs/BD-central-inbox-routing.md`
**Muc tieu:** Moi input di vao `Opus Consilium` truoc, qua `Inbox -> Review -> Routing`, roi moi route sang `opus-lucida`, `personal-wiki`, `business/opportunity backlog`, hoac `agent system improvement`.
**Review truct bat buoc:**
- `AI Operator Review`
- `Knowledge Review`
- `Opportunity Review`
**Viec can lam truoc khi code:**
- [ ] Tao inbox storage format cho input tho
- [ ] Tao weekly review template
- [ ] Tao routing log
- [ ] Tao business/opportunity backlog stub
- [ ] Tao agent improvement backlog stub
- [ ] Chot Telegram la mobile input channel dau tien
- [ ] Chot convention VS Code prompt ledger

### [CONS-2] Module A → Wiki Ingest (Karpathy Gap 1) 🔴 HIGH
**Status:** Planning
**Ref:** `opus-consilium/docs/SD-karpathy-consilium.md` — Gap 1
**Vấn đề:** Module A research output (CrewAI deep research) chỉ vào `wiki/` folder ephemeral, không vào `personal-wiki/`. Knowledge bị mất sau mỗi run — vi phạm Karpathy compounding principle.
**Fix:**
- [ ] Cuối un_research.py`: save research text → aw/research/YYYY-MM-DD-{topic}.md`
- [ ] Gọi `wiki_ops/ingest.ingest(path)` trước khi publish Telegraph
- [ ] Test: chạy research → verify page xuất hiện trong personal-wiki/AI/

### [CONS-3] Module B → Query Wiki (Karpathy Gap 2) 🟡 MEDIUM
**Status:** Planning
**Ref:** `opus-consilium/docs/SD-karpathy-consilium.md` — Gap 2
**Vấn đề:** un_daily.py` đọc `wiki/` folder ephemeral thay vì query `personal-wiki/`. Brief không compound.
**Fix:**
- [ ] Thay logic đọc file bằng `wiki_ops/query.query("tóm tắt news AI và JP stock 24h qua")`
- [ ] Brief quality tốt hơn vì query từ wiki đã được synthesize sẵn
- [ ] Sau Gap 1 xong mới làm Gap 2 (để wiki có đủ content từ Module A trước)

### [WIKI-3] Karpathy LLM Wiki + Obsidian Workflow
**Status:** 🟡 Phase 3 done — concept-first ingest implemented, not live-tested with Groq
**Doc:** `opus-consilium/docs/RD-wiki-obsidian-karpathy.md`
**Build plan:** `opus-consilium/docs/BD-wiki-obsidian-phase-1-2.md`
**Phase 3 plan:** `opus-consilium/docs/BD-wiki-obsidian-phase-3.md`
**Mục tiêu:** Biến `personal-wiki/` thành Obsidian vault sống theo Karpathy LLM Wiki: concept-first, merge-first, có reflection/apply/open questions.
**Nguyên tắc:** Obsidian là thinking UI; un_wiki.py` là engine; aw/` là source bất biến; Hermes chỉ là backlog/future control layer.
**Việc cần làm trước khi code:**
- [ ] Review/approve RD
- [x] Tạo BD chi tiết cho Phase 1-2: schema + hygiene
- [x] Update `SCHEMA.md` thành Obsidian-friendly editorial constitution
- [x] Dedupe `INDEX.md` và thêm Hygiene Queue
- [x] Update Module C ingest contract trong `SD-interface-contract.md`
- [x] Implement concept-first ingest: LLM chọn `create` hoặc `update`
- [x] Normalize LLM config/docs về Groq runtime
- [x] Add un_wiki.py ingest --dry-run <source>` để preview trước khi ghi
- [x] Backup existing wiki page trước khi LLM update ghi đè
- [x] `_update_index()` dedupe-safe, không xóa Hygiene Queue
- [x] Mỗi thay đổi code/schema phải update docs trong cùng lượt làm
- [x] Không implement Hermes trong scope này
- [x] Dry-run test un_wiki.py ingest --dry-run <source>` với Groq key/network — chọn đúng `update`
- [ ] Live-test un_wiki.py ingest <source>` sau khi Groq quota reset
- [x] Reduce ingest token budget sau khi gặp Groq TPD rate limit
- [x] Disable Content Collector auto-ingest by default while concept-first updates are under review

### [COL-1] Content Collector Batch ✅ DONE
**Built:** 2026-04-28
**Files:** `tools/collect_tool.py`, un_collect.py`, `wiki_ops/ingest.py:ingest_batch()`
**Task Scheduler:** `content-collector` — daily 05:30
**Sources active (8/12):** simon-willison, hf-blog, import-ai, interconnects, the-gradient, arxiv-cl, arxiv-lg, nikkei-asia
**Blocked:** hf-papers (401), papers-with-code (302), anthropic-news (404), bloomberg-jp (404)
**Test:** `python run_collect.py --dry-run` → 38 articles fetched ✅

### [WIKI-1] ingest_batch() cho Module C
**Không cần RD riêng** — extend ingest.py
**Mô tả:** Scan raw/ → ingest files chưa có trong log.md (check bằng slug)
**Việc cần làm:**
- [ ] Thêm `ingest_batch(limit=15)` vào `wiki_ops/ingest.py`
- [ ] Dùng `log.md` để dedup (không ingest lại file đã processed)
- [ ] Test: drop 3 file mới → `ingest_batch()` → verify 3 pages trong INDEX.md

### [WIKI-2] Telegram file → raw/inbox/
**Mô tả:** User gửi file cho Telegram bot → bot save vào raw/inbox/ → markitdown-agent convert
**Việc cần làm:**
- [ ] Update `wiki_ops/telegram_handler.py` — handle document/photo message type
- [ ] Download attachment → save to raw/inbox/
- [ ] Reply: "Converting {filename}..."
- [ ] Test: gửi PDF từ điện thoại

---

## 📋 Planned — Scope Rõ, Chưa Start

### [OPT-3] Hermes Skill Layer — ❌ Closed No-Go (2026-06-11)
**Mô tả:** Future natural-language control layer cho OPUS ANIMUS — wrap operations thành skill nói tự nhiên.
**Kết luận:** Đánh giá đầy đủ tại `docs/EVAL-hermes-agent-integration.html`. Ban đầu GO có điều kiện, nhưng premise đổi: Module C + Telegram đã bỏ, tương tác chuyển qua cửa sổ app LLM → Hermes trùng vai trò interface layer, không đáng chi phí (API key mới + security hardening + runtime thứ hai). **Đóng.**
**Điều kiện mở lại:** xuất hiện lại nhu cầu truy cập từ chat platform/mobile, hoặc cần cron có delivery đa kênh.
**Lưu ý kỹ thuật (nếu mở lại):** Hermes skill = SKILL.md (markdown, chuẩn agentskills.io) gọi CLI — KHÔNG phải Python API. Ghi chú Groq Llama tool-calling cũ đã lỗi thời.

### [INFRA-1] markitdown-agent — Task Scheduler
**Mô tả:** Auto-start markitdown-agent khi Windows boot thay vì chạy tay
**Việc cần làm:**
- [ ] Task Scheduler: trigger = At startup, action = python agent.py (integrated)
- [ ] Test: reboot → agent tự start

### [INFRA-2] Wiki Maintenance
**Mô tả:** Sau khi wiki > 20 pages, cần maintenance routine
**Việc cần làm:**
- [ ] Chạy un_wiki.py lint` — fix BROKEN links (ingest missing sources)
- [ ] Ingest thêm sources để wiki > 10 pages → enable Phase 5B wiki_context
- [ ] Review INDEX.md — tag quality check

---

## 🧭 Phase 6 — Transformation Layer (từ North Star)
*Những gì cần để INPUT→STORE trở thành INPUT→STORE→REFLECT→APPLY*

### [NS-1] GOALS.md — Goals Layer
**Gap:** Hệ thống không biết user đang phát triển theo hướng nào
**Việc cần làm:**
- [ ] Tạo `GOALS.md` tại root — define skills, hướng phát triển, 12-month target
- [ ] Content Collector rank bài theo goals, không chỉ theo tier nguồn
- [ ] Wiki SCHEMA.md update: thêm tag `goal::` để link wiki page với goal

### [NS-2] Personal Input — `/wiki thought`
**Gap:** 95% input là external, không có suy nghĩ/quan sát cá nhân của user
**Việc cần làm:**
- [ ] Telegram: `/wiki thought <text>` → save vào aw/notes/` → ingest vào `Personal/`
- [ ] CLI: un_wiki.py ingest "thought: ..."` → tương tự

### [NS-3] Reflection Layer — un_wiki.py reflect`
**Gap:** Không có cơ chế tiêu hóa tri thức hàng tuần
**Việc cần làm:**
- [ ] `wiki_ops/reflect.py` — weekly prompt qua Groq: "3 điều đáng chú ý nhất tuần này?"
- [ ] Output: `personal-wiki/Personal/reflection-YYYY-WW.md`
- [ ] Task Scheduler: Sunday 20:00 → un_wiki.py reflect`

### [NS-4] Application Tracking — `applied::` tag
**Gap:** Không biết tri thức đã được dùng thực tế chưa
**Việc cần làm:**
- [ ] Telegram: `/wiki used <page-slug> for <action>` → thêm tag vào page
- [ ] `lint.py` — flag page có age > 60 ngày chưa có `applied::` tag

### [NS-5] Spaced Repetition trong Weekly Digest
**Gap:** Tri thức ingest một lần rồi ngủ
**Việc cần làm:**
- [ ] un_wiki.py reflect` include "3 pages cũ đáng đọc lại" (oldest unread)
- [ ] Lint suggest: page > 30 ngày chưa access → đưa vào reading list

---

## 📥 Backlog — Từ Session 2026-04-28

### [IDEA-6] Idea Capture App — Telegram → Raw Ideas
**Ý tưởng:** Mỗi khi có idea, gửi Telegram → lưu vào aw/ideas/` → optional: ingest vào Personal wiki
**Trigger:** `/idea <text>` hoặc forward bất kỳ message nào đến bot
**Flow:**
- `/idea <text>` → save aw/ideas/YYYY-MM-DD-HH:MM-idea.md`
- Weekly: un_wiki.py reflect` tự gom ideas → tổng hợp thành insight
- Option: `/idea list` → xem lại ideas tuần này
**Why:** Ý tưởng tốt nhất đến lúc không ngờ — cần capture friction-less nhất có thể
**Scope:** Nhỏ — thêm handler vào telegram_handler.py, tạo aw/ideas/` folder

---

### [IDEA-7] Research Radar — Wiki Input Expansion (gộp IDEA-7 + IDEA-9)
**Ý tưởng:** Weekly batch mở rộng input wiki: academic sources + GitHub trending AI repos → LLM filter → suggest apply OPUS ANIMUS
**Trigger:** Content Collector stable ≥ 1 tuần + wiki > 20 pages

**Flow:**
```
Thứ 2 06:30 →
  GitHub Trending (Python + AI, top 10/week, ≥100 stars) +
  Academic APIs (Papers With Code, Semantic Scholar) +
  Academic RSS (PyTorch, Distill.pub) →
  LLM filter: "Có apply được vào OPUS ANIMUS không? Ở đâu?" →
  Ingest vào wiki →
  Telegram: "Research Radar W{N} — Top repos + suggestions"
```

**Sources cần verify:**

| Tier | Nguồn | Type | Ghi chú |
|---|---|---|---|
| ⭐⭐⭐⭐⭐ | GitHub Trending AI | scrape/API | top 10 repos/week, Python+AI |
| ⭐⭐⭐⭐⭐ | Papers With Code | REST API | `/papers/?ordering=-github_stars` |
| ⭐⭐⭐⭐ | Semantic Scholar | REST API | Cần API key (free) |
| ⭐⭐⭐⭐ | PyTorch Blog | RSS | pytorch.org/blog/feed.xml |
| ⭐⭐⭐ | Distill.pub | RSS | distill.pub/rss.xml |

**Files cần build:**
- `tools/research_radar_tool.py` — fetch GitHub trending + academic APIs
- un_radar.py` — entry point, `--dry-run` support
- Task Scheduler: esearch-radar` thứ 2 06:30

**Việc cần làm trước khi build:**
- [ ] Verify GitHub Trending có public API không (hiện dùng scrape)
- [ ] Đăng ký Semantic Scholar API key tại semanticscholar.org/product/api
- [ ] Test Papers With Code API endpoint

---

### [IDEA-8] Personal Goal × System Architecture Clarity
**Ý tưởng:** Vẽ rõ sơ đồ GOALS.md → OPUS ANIMUS modules → output cho từng goal
**Cụ thể:**
- Goal: 10 man yen/12 tháng → cần learn gì → OPUS ANIMUS filter gì → output nào
- Goal: Sức khỏe → không có module nào serve — cần manual tracking hoặc integration
- Goal: Sự nghiệp → AI skill → Module A research + wiki → apply vào công việc
**Output:** Diagram trong VISION.md hoặc file riêng `GOALS-SYSTEM-MAP.md`
**Why:** Hiện tại GOALS.md và system chạy song song, chưa có explicit link
**Trigger:** Sau khi điền xong GOALS.md (Immediate task)

---

## 🗂️ Ideas — Chưa Scope

### [IDEA-10] Phiên thảo luận L3 Product Direction
**Trigger:** Skill L1/L2 AI Engineering đã đủ vững (có thể build production system)
**Mục tiêu:** Chốt 1 trong 3 hướng: AI SaaS / AI Consulting / Automated Investing
**Cần chuẩn bị trước phiên:**
- Research market size + time-to-revenue từng hướng
- So với constraint: thời gian rảnh/tuần, vốn ban đầu, risk appetite
- L3 quyết định OPUS ANIMUS nên filter content gì → update config.yaml

---

### [IDEA-1] JP Stock Deep Dive
- Bloomberg Japan full article, Kabutan news, TOPIX workaround
- USD/JPY, JPY/VND tỉ giá tracking
- **Trigger để scope:** Khi Module A JP_STOCK output không đủ sâu

### [IDEA-2] Multi-topic Expansion
- Thêm topic: Macro Economics, Vietnam Market, Crypto
- Config-driven hoàn toàn — không cần code change
- **Trigger để scope:** Khi AI + JP_STOCK pipeline stable

### [IDEA-3] Interactive Brief
- Telegram inline buttons: "Deep dive AI", "More stock detail"
- Webhook mode thay vì Task Scheduler push-only
- **Trigger để scope:** Khi user thấy push-only không đủ

### [IDEA-4] Voice Note → Wiki
- Record voice note → markitdown transcribe → raw/notes/ → ingest
- Chờ markitdown audio support stable
- **Trigger để scope:** Khi WIKI-2 (Telegram file) đã stable

### [IDEA-5] Personal Wiki — Query UI
- Web UI nhỏ để query wiki thay vì Telegram
- Chỉ cần khi wiki > 50 pages và Telegram query bất tiện

---

## ✅ Done

### 2026-05-12 (Lucida schema-first Wake)
- [x] **[LUCIDA] Wake schema-first renderer** — expanded typed deck 5 → 17 slides, added 7 deterministic templates, validate PASS, tests 10/10, build PASS, export 17/17 PNG, QA PASS
- [x] **[LUCIDA] Wake validator hardening** — Japanese anchors, learner-facing banned phrase lint, 3-view label enforcement, template-specific quiz/worked/diagnostic/CTA checks, public Vietnamese renderer labels, tests 13/13
- [x] **[LUCIDA] Wake design-rule pass 1** — before/after quiz boards, worked-example reasoning board, grammar-card hierarchy, semantic accents, quieter exam-console background, export 17/17, QA PASS

### 2026-05-02 (Lucida pipeline)
- [x] **[LUCIDA] TTS pipeline** — edge-tts (VI HoaiMy +20%) + Voicevox (JP 九州そら ID=16) + named pause markers [TTS_PAUSE_SHORT/MED/LONG/REVEAL]
- [x] **[LUCIDA] RVC agent** — vc_agent.py` via gradio_client → Colab T4, f0_up_key=0, vc_server.ipynb`
- [x] **[LUCIDA] Assembly** — `assembly_agent.py` MoviePy, PNG frames + WAV → MP4
- [x] **[LUCIDA] pipeline.py** — full pipeline với --generate, --skip-screenshot, --skip-tts, --skip-rvc flags
- [x] **[LUCIDA] deck_generator.py** — parse 03-slide-deck.md → HTML với deck-stage custom element, 17 slides, 5 layout types
- [x] **[LUCIDA] HTML slide frames** — 17 × 1920×1080 PNG via Playwright screenshot (slide-01..17.png) ✅
- [x] **[LUCIDA] Multi-agent workflow docs** — runners 31-38, Gates A-K, SOP 38-audio-generation-sop.md
- [x] **[LUCIDA] HTML design prototype** — lucida-n2-design-system-mvp.html, Manrope + Noto Sans JP + Source Serif 4

### 2026-04-28 (session 2)
- [x] **Content Collector batch** — un_collect.py` + `collect_tool.py` + `ingest_batch()`, Task Scheduler 05:30
- [x] **RSS sources verified** — 8/12 active, 4 blocked (no public RSS), hf-blog thay thế hf-papers
- [x] **parent AI/CLAUDE.md** — global SDD rules apply cho tất cả projects dưới AI/
- [x] **journey-reminder** — Task Scheduler Sunday 20:00, Telegram nhắc update JOURNEY.md
- [x] **GAP-3 /wiki thought** — Telegram capture personal insight → raw/notes/ → Personal wiki
- [x] **GAP-4+6 /wiki used** — Telegram tag applied:: + action vào wiki page
- [x] **GAP-2+5 Reflection layer** — `wiki_ops/reflect.py` + un_wiki.py reflect`, Task Scheduler Sunday 19:30
- [x] **GOALS.md** — 4 tracks: Tài chính (10 man yen/12 tháng) + Sức khỏe + Sự nghiệp + Knowledge
- [x] **VISION.md** — triết lý + HOME app wireframe + roadmap Phase 7
- [x] **run_home.py** — terminal dashboard: system status + wiki stats + Phase 6 status

### 2026-04-28
- [x] **markitdown-agent integrated mode** — watch raw/inbox/, route by extension, move processed
- [x] **ingest.py fix** — non-PDF files (.docx, .pptx, .xlsx, ảnh, audio) giờ dùng convert_file()
- [x] **RSS full content** — rss_tool.py fetch full HTML, fallback to snippet on failure
- [x] **SA-system-architecture.md** — full system diagram + flows + component boundaries
- [x] **dev-approach/** — SDD methodology folder, templates, checklist
- [x] **SDD-toolkit** — reusable toolkit tại C:/Users/HUY/AI/SDD-toolkit/
- [x] **Task Scheduler** — wiki-poll (5 min), wiki-lint-weekly (Sunday 6:00)
- [x] **duckduckgo-search → ddgs** migration

### 2026-04-27
- [x] **Module C** — M1 foundation, M2 ingest, M3 query, M4 Telegram poll, M5 auto-ingest
- [x] **Personal wiki** — 12 pages (AI + Tech topics), SCHEMA.md, INDEX.md, log.md
- [x] **SDD docs** — RD-requirements, SD-system-design, SD-interface-contract, BD-module-c

### 2026-04-26
- [x] **Module A** — ResearchCrew (AI + JP_STOCK), Telegraph publish, Telegram notify
- [x] **Module B** — Daily Brief pipeline (direct Groq, bypass CrewAI)
- [x] **Config-driven sources** — config.yaml, enable/disable per source


### 2026-05-07
- [x] **[LUCIDA-5] Handoff realignment** - handoff/status now updated according to opus-animus/AGENTS.md
- [x] **[LUCIDA-5] Language-generation system locked** - style guide + audit checklist + generation spec + dictionary + pattern bank + runner pack
- [x] **[LUCIDA-5] Wake smoke test** - applied on Slide 05 and logged in 18-language-runner-smoke-test.md
- [ ] **[LUCIDA-5] Next step** - apply runner pack to 1 grammar card block
- [ ] **[LUCIDA-5] Next step** - apply runner pack to 1 CTA block
