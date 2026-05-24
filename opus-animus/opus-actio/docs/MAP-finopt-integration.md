# MAP — FINOPT ↔ opus-actio Integration

**Date:** 2026-05-19
**Status:** Decisions locked 2026-05-19 — ready to execute

Tài liệu này map kết quả đọc `files.zip` (FINOPT_HANDOFF.md + investment-optimizer.jsx) vào kế hoạch opus-actio.

---

## 1. Bản chất 2 hệ thống

| Khía cạnh | FINOPT (files.zip) | opus-actio (hiện tại) |
|---|---|---|
| **Form factor** | Mobile React SPA (max 430px, iPhone PWA) | Skills markdown + tab dashboard desktop |
| **User mode** | Daily glance, position tracking, alerts | Deep research, modeling, thesis |
| **LLM access** | Claude API direct từ browser | Claude Code skills (trigger-based) |
| **Data source** | Yahoo Finance / Fincept Terminal | EDINET (custom) + Anthropic core skills |
| **Portfolio state** | localStorage trong browser | Markdown files (manual) |
| **Deploy target** | Vercel public URL → iPhone Add-to-Home | Localhost:8765 (opus home) |

→ **Bổ sung, không cạnh tranh.** FINOPT là UI mobile thực hành; opus-actio là engine research sau lưng.

---

## 2. Mapping 4 Agent FINOPT → Skill opus-actio

| FINOPT Agent | Skill / plugin tương đương | Status |
|---|---|---|
| **Market Analyst** (📈 BUY/HOLD/SELL + P/E + targets + risks) | `plugins/equity-research/skills/earnings-analysis/`, `morning-note/`, `plugins/financial-analysis/skills/comps-analysis/` | ✅ Đã có trong opus-actio |
| **Risk Manager** (🛡️ VaR, Sharpe, FX, concentration) | — | ❌ Cần build custom: `skills/risk-manager/SKILL.md` |
| **Portfolio Optimizer** (⚖️ rebalance, stop-loss, MPT) | `wealth-management/rebalance` (plugin trong anthropics/financial-services) | ⬜ Plugin chưa clone |
| **News Sentiment** (📰 mood score, sector rotation, Fed/BOJ) | `opus-consilium/api/intel/simple` (daily Claude synthesis đã chạy) | ✅ Đã có — FINOPT chỉ cần fetch endpoint |

### Implication

- 4/4 agent của FINOPT có thể **giảm dependency lên Claude API call thẳng** bằng cách:
  - Market Analyst → invoke skill (Claude Code) hoặc embed prompt từ skill markdown
  - Risk Manager → build skill mới (1 file SKILL.md mới, ~200 dòng)
  - Portfolio Optimizer → clone thêm 1 plugin
  - News Sentiment → fetch `opus-consilium /api/intel/simple` (đã chạy daily 05:30 JST qua Task Scheduler)

→ Tiết kiệm token cost + tận dụng infrastructure opus đã có.

---

## 3. Architecture đề xuất

```
┌──────────────────────────────────────────────────────────┐
│  FINOPT Mobile Web (iPhone PWA, max 430px)               │
│  4 screens: Portfolio · Agents · Alerts · Settings       │
└────────┬────────────────────────────────┬────────────────┘
         │                                │
         │ /api/portfolio/quote           │ /api/intel/simple
         │ (Yahoo Finance proxy)          │ (đã có ở opus-consilium)
         ▼                                ▼
   ┌──────────────┐               ┌──────────────────┐
   │  yahoo-proxy │               │ opus-consilium    │
   │  (Node/Py)   │               │ intel pipeline    │
   └──────────────┘               │ (daily Claude     │
                                  │  synthesis)       │
         │                        └──────────────────┘
         │
         │ Claude API direct (với system prompt
         │ tham chiếu opus-actio skills)
         ▼
   ┌──────────────────────────────────────────┐
   │  Claude Sonnet 4 / Opus 4.7              │
   │  + skills auto-invoke từ opus-actio:     │
   │    - equity-research/*                    │
   │    - financial-analysis/*                 │
   │    - edinet-fetcher (JP filings)         │
   │    - jp-tax-account (account decision)   │
   │    - jp-fiscal-calendar (timing)         │
   └──────────────────────────────────────────┘
```

---

## 4. Phương án tích hợp

### Phương án A — FINOPT nested trong opus-actio (recommended)
```
opus-actio/
├── CLAUDE.md, USAGE.md
├── skills/ (custom JP)
├── plugins/ (Anthropic core)
├── docs/ (RD, MAP, ...)
├── finopt/                    ← NEW
│   ├── src/
│   │   ├── App.jsx
│   │   ├── screens/
│   │   ├── agents/
│   │   │   └── agents.config.js   (system prompts reference skill paths)
│   │   └── services/
│   ├── package.json
│   └── vercel.json
└── server/                    ← NEW (optional proxies)
    ├── yahoo-proxy.js
    └── intel-bridge.js
```
**Pros:** Single source of truth, share .env, agent prompts đồng bộ skill content, dashboard opus quản lý cả 2.
**Cons:** Repo size lớn hơn, mix node + python.

### Phương án B — FINOPT standalone song song
```
opus-animus/
├── opus-actio/  (skills + plugins only)
└── finopt/      (mobile app, gọi opus-actio qua REST API)
```
**Pros:** Clean separation. **Cons:** Phải build REST layer cho skills, overkill cho personal use.

### Phương án C — FINOPT giữ ở repo riêng (Vercel)
- Vẫn deploy độc lập, không liên quan code-base opus
- opus-actio chỉ là "knowledge layer" — manual copy system prompt từ skill markdown sang `agents.config.js`
**Pros:** Đơn giản nhất. **Cons:** 2 nơi maintain prompts, dễ drift.

---

## 5. Decisions (locked 2026-05-19)

| # | Quyết định | Lý do / hệ quả |
|---|---|---|
| 1 | **Phương án A**: FINOPT nested ở `opus-actio/finopt/` | Single repo, share .env, prompt đồng bộ skill markdown |
| 2 | **Clone `wealth-management`** plugin | Có sẵn `/rebalance`, `/tlh`, `/financial-plan` match Portfolio Optimizer agent |
| 3 | **Defer** `risk-manager` custom skill | Chờ FINOPT chạy thực tế → quyết định scope risk skill sau |
| 4 | **Yahoo Finance** (npm `yahoo-finance2`) là quote provider primary | Free, no key, support `.T` suffix cho JP. Fincept defer |
| 5 | API key strategy: chưa quyết, tạm dùng **localStorage** (FINOPT default) | Sẽ revisit khi deploy production |

---

## 6. Next actions (execute order)

1. **Clone `wealth-management` plugin** → `opus-actio/plugins/wealth-management/`
2. **Scaffold FINOPT**:
   - `npm create vite@latest opus-actio/finopt -- --template react`
   - Copy `investment-optimizer.jsx` → `opus-actio/finopt/src/App.jsx`
   - `npm install yahoo-finance2 axios`
3. **Refactor `agents.config.js`**: 4 system prompt reference skill paths trong `opus-actio/skills/` và `opus-actio/plugins/*/skills/` (không hardcode content, dễ sync)
4. **Build `server/yahoo-proxy.js`** (Node/Express, port 5001) → quote API cho `7203.T`, `AAPL`, etc.
5. **Settings screen** trong FINOPT: input API key (Claude) + portfolio input (symbol/qty/avgPrice)
6. **Wire News Sentiment** → fetch `http://localhost:8765/api/intel/simple` (opus-consilium)
7. **Deploy Vercel** + Add-to-Home iPhone
8. (Defer) Build `risk-manager` custom skill nếu FINOPT cần Risk Manager agent chi tiết hơn

---

## 7. Risks / open questions

- **Token cost:** 4 agent FINOPT call Claude API daily → cần ước tính. Mitigate: cache + chỉ call khi user mở screen
- **API key exposure:** FINOPT lưu Anthropic key trong localStorage = unsafe nếu phone bị compromise. Mitigate: proxy server local hoặc dùng Claude Console limited-scope key
- **Fincept Terminal license:** chưa rõ free tier có đủ cho JP TSE quotes không
- **Drift:** Skill markdown (opus-actio) vs agent prompts (FINOPT) dễ lệch nếu copy manual. Mitigate: build sync script
