# Đánh giá ECC (`affaan-m/ECC`) — để cân nhắc áp dụng cho `ai-project-opus`

> Ngày đánh giá: 2026-06-19 · Người đánh giá: Claude (Opus) · Repo nguồn: https://github.com/affaan-m/ECC
> Phạm vi yêu cầu: **chỉ báo cáo, không sửa repo**. File này là tài liệu tham khảo để bạn tự quyết định.

---

## 1. ECC là gì

ECC (`ecc-universal` v2.0.0, MIT) tự mô tả là **"harness-native agent operating system"** — một
bộ cấu hình + công cụ chạy xuyên nhiều AI coding harness: **Claude Code, Codex, Cursor, Gemini,
OpenCode, Zed, GitHub Copilot**.

Không phải một ứng dụng. Nó là một **layer tái sử dụng** gồm:

| Thành phần | Số lượng | Vai trò |
|---|---|---|
| Skills | **271** | Hướng dẫn theo domain (agentic-engineering, eval-harness, security theo ngôn ngữ…) |
| Agents | **67** | Sub-agent chuyên biệt (code-reviewer, security-reviewer, architect, spec-miner…) |
| Commands | **92** | Slash command (`/plan`, `/code-review`, `/model-route`, `/loop-start`, `/checkpoint`…) |
| Rules | **22 bộ** | Quy tắc theo ngôn ngữ (python, typescript, rust, go…), scoped theo `paths:` |
| Hooks | runtime | memory-persistence, hook workflows |
| MCP configs | 1 catalog | Quy ước cấu hình MCP server |
| `ecc2/` | Rust | Control-plane viết bằng Rust (Cargo) |

Cài đặt qua CLI: `npx ecc <profile>` hoặc `npx ecc-install <profile>`.

---

## 2. Chất lượng kỹ thuật — đánh giá khách quan

**Tích cực (dấu hiệu repo nghiêm túc, không phải "đống prompt"):**

- **Installer chỉn chu:** `scripts/lib/install/apply.js` dùng **deep-merge JSON** (không đè mù
  config có sẵn), có `install-state` để **idempotent**. Tức cài lại không phá cấu hình cũ.
- **Cài chọn lọc theo profile/module:** không buộc nuốt cả 271 skills.
  - `minimal` — rules + agents + commands + platform-configs (không hook runtime)
  - `core` — minimal + hooks-runtime
  - `developer` — core + framework-language + database + orchestration *(mặc định)*
  - `security` / `research` / `opencode` / `full`
- **Test & CI thực sự:** 175 file test; CI scripts `catalog:check`, `harness:audit`,
  `security:ioc-scan`, `release:approval-gate`.
- **Rules có cấu trúc tốt:** ví dụ `rules/python/` tách `coding-style / patterns / testing /
  security / fastapi / hooks`, scoped bằng frontmatter `paths:` — dùng được cho Cursor/Claude.
- **Đa ngôn ngữ tài liệu:** có sẵn bản dịch, gồm **`docs/vi-VN/README.md`** (tiếng Việt).

**Cần lưu ý / rủi ro:**

- **Mức marketing cao:** README quảng bá "211.9K+ stars", badge tự host qua `api.ecc.tools`,
  có tier thương mại (**ECC Pro $19/seat/mo**, sponsor tiers). Không sai trái, nhưng đừng đánh
  đồng marketing với chất lượng — phần code thực mới đáng giá (và phần đó ổn).
- **Phụ thuộc cài đặt:** chạy CLI từ source bị thiếu `ajv` (cần `npm install` trước). Một số
  tính năng đòi API key: `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `ASTRAFLOW_API_KEY`, `ATLAS_API_KEY`.
- **Diện tích bề mặt lớn:** 271 skills + 92 commands là rất nhiều context. Với workspace cá nhân,
  cài full dễ gây nhiễu hơn là giúp ích.

---

## 3. Trùng lặp với hệ hiện tại của bạn

`ai-project-opus` đã có một "agent OS" cá nhân khá hoàn chỉnh — và **triết lý gần như trùng khớp**
với ECC, đây vừa là điểm cộng (dễ tiếp nhận) vừa là rủi ro (đụng concept):

| Khái niệm | Hệ của bạn (CLAUDE.md / SDD-toolkit) | Tương đương trong ECC |
|---|---|---|
| Spec-driven development | SDD-toolkit (RD→SD→BD), bắt buộc | skill spec-driven + agent `spec-miner`, command `/plan-prd`, `/prp-*` |
| Plan trước khi code | Plan mode, "/plan" | command `/plan`, `/feature-dev`, agent `planner`/`architect` |
| Model routing | Bảng route Opus/Sonnet/Codex | skill `cost-aware-llm-pipeline`, command `/model-route` |
| Code review / security | (thủ công) | agent `code-reviewer`/`security-reviewer`, command `/code-review`, `/security-scan` |
| Self-improvement loop | `tasks/lessons.md` | skill `agent-self-evaluation`, command `/learn`, `/evolve` |
| Handoff / session | `/handoff`, `ai/status.md` | command `/save-session`, `/resume-session`, `/checkpoint` |

→ **Kết luận:** ECC không thay thế hệ của bạn; nó là một **kho ý tưởng/triển khai trưởng thành hơn**
cho cùng triết lý. Nếu cài đè full sẽ tạo hai hệ SDD/command song song, mâu thuẫn với chính quy tắc
"no scope creep / không đè code sẵn có" trong `CLAUDE.md` của bạn.

---

## 4. Khuyến nghị: cherry-pick, KHÔNG cài full

Đáng mượn, nhưng theo kiểu **chọn lọc và adapt**, không `npx ecc developer` vào repo. Ứng viên
giá trị cao (đã xem nội dung, phù hợp workflow của bạn):

**Agents (`agents/*.md`):**
- `code-reviewer.md`, `security-reviewer.md` — bù đúng khoảng trống review/security của bạn.
- `architect.md`, `code-explorer.md`, `refactor-cleaner.md`.

**Skills (`skills/*/SKILL.md`):**
- `agentic-engineering` — eval-first loop, quy tắc "đơn vị 15 phút", model routing (rất hợp Karpathy principles bạn đã ghi).
- `agent-eval` / `eval-harness` — bạn đang thiếu lớp "verify before done" định lượng.
- `context-budget`, `cost-tracking` — tối ưu chi phí/ngữ cảnh.

**Rules (`rules/python/`, `rules/typescript/`):**
- Bộ rule scoped theo `paths:` — có thể nhặt vào `.claude` mà không đụng `CLAUDE.md` gốc.

**Commands (`commands/*.md`):**
- `/model-route`, `/checkpoint`, `/quality-gate` — bổ trợ, ít xung đột.
- Tránh `/plan-prd`, `/prp-*`, `/spec-*` vì **trùng** với SDD-toolkit của bạn.

---

## 5. Quyết định gợi ý

| Lựa chọn | Phù hợp khi | Đánh giá |
|---|---|---|
| **Cherry-pick 3–5 agents/skills** rồi adapt | Muốn nâng cấp dần, giữ hệ riêng | ✅ Khuyến nghị |
| Cài profile `minimal`/`developer` qua CLI | Chấp nhận chạy song song, có thời gian dọn trùng | ⚠️ Cân nhắc, rủi ro đụng SDD |
| Cài `full` | (không) | ❌ Quá nặng cho workspace cá nhân |
| Chỉ tham khảo, không lấy gì | Hệ hiện tại đã đủ | ✅ Hợp lệ |

**Tóm tắt:** ECC là dự án chất lượng, đáng học hỏi, license MIT nên copy thoải mái. Nhưng vì bạn
đã có một agent-OS cá nhân chín chắn, giá trị lớn nhất nằm ở **vài agent review/security + skill
eval-harness**, không phải ở việc thay nền tảng. Khi nào bạn muốn, tôi có thể cherry-pick và adapt
những mục cụ thể trên vào `.claude/` (theo đúng style hiện tại, không đụng `CLAUDE.md`).
