# Opus Nexus — Current State & Implementation Record

> Source of truth for what is actually shipped as of 2026-05-30.
> App file: `health-app/dashboard.html` · CI syncs to `opus-vita/index.html` on push to `main`.
> Development history and original phase plan: see §7.

---

## 1. File Map

### Core app
| File | Role |
|---|---|
| `health-app/dashboard.html` | Single-file SPA — all HTML + CSS + JS (~1800 lines) |
| `health-app/instructions.md` | System prompt for Claude health logging |
| `health-app/roadmap.md` | Product roadmap (Vita module) |
| `health-app/architecture.html` | Visual architecture diagram |

### Command pipeline
| File | Role |
|---|---|
| `nexus-commands/README.md` | LLM system prompt + command schema doc |
| `nexus-commands/*.json` | Command queue — LLM commits here to trigger actions |
| `nexus-commands/processed/` | Archive after execution |
| `scripts/exec-command.js` | Node.js executor — no npm deps, Node 18+ native fetch |
| `scripts/get-refresh-token.js` | One-time OAuth setup: generates refresh token + `gh secret set` commands |
| `.github/workflows/nexus-command.yml` | Trigger: push `nexus-commands/*.json` → execute → archive |

### CI
| File | Role |
|---|---|
| `.github/workflows/sync-dashboard.yml` | Push to `main` → copy `dashboard.html` → `opus-vita/index.html` |

---

## 2. Data Sources

| Source | What | Access method |
|---|---|---|
| `health-data/` | Daily health + meal logs (JSON per day) | `ghGet` via PAT in localStorage |
| `workout-data/` | Workout sessions | `ghGet` via PAT |
| `opus-animus/opus-actio/finance-data/` | Finance transactions | `ghGet` via PAT |
| Google Calendar | Upcoming events, free windows | `gapi.client.calendar` — OAuth GIS browser flow |
| Google Tasks | Open tasks, overdue | `gapi.client.tasks` — same OAuth token |

Google Calendar and Tasks data are **in-memory only** — never written to GitHub from the browser app.

---

## 3. Shipped Features

### ✅ Phase 0 — Stabilize Vita
- Dual-key schema: `grams`/`amount_g`, `protein`/`protein_g`, `total_protein`/`total_protein_g`
- Empty states: water/steps/weight = 0 → "chưa log"
- `validateHealthLog()` — console warnings for non-canonical schema

### ✅ Phase 1 — Nexus Shell
- Branding: `🌐 Opus Nexus` title + topbar
- 4-view nav: **Today | Vita | Calendar | Actions**
- `renderToday()` — Vita snapshot + Calendar context + Task context

### ✅ Phase 2 (partial) — Design Primitives
- CSS: `.proposal-card`, `.proposal-approve`, `.proposal-card.approved`, nav/tab styles
- Reusable render functions: `renderProposalCard()`, `renderTaskContext()`

### ✅ Phase 3 — Google Calendar Read
- `initGapiClient()` — loads Calendar + Tasks discovery docs
- `connectCalendar()` — OAuth GIS token flow, scopes: `calendar.readonly` + `tasks`
- `loadCalendarEvents(7)` — 7-day window from `primary` calendar
- Calendar Context card: busy level, free windows, eating-out signal

### ✅ Phase 4 — Calendar Action Assistant
- `parseProposals(text)` — parses `events[]` and `tasks[]` from LLM JSON
- `validateProposal(ev)` — title/start/end/overlap/duration/type checks
- `renderProposalPreview()` — proposal cards + per-item ✓ Approve button + batch approve
- `approveOne(idx)` + `runApproval(indices)` — shared execution helper
- `insertCalendarEvent(ev)` — `gapi.client.calendar.events.insert` + `source='opus-nexus'`
- Control gate: **no auto-write**, user must approve each item

### ✅ Phase 5 — Plan My Week
- `summarizeHabits()` — aggregates real historical data:
  - Eating: avgKcal, avgProtein, proteinHitRate, breakfastRate, lateDinnerRate
  - Workout: perWeek, weekdays, typicalHour, types, avgDur
- `buildFreeSlotMap(events, 7)` — per-day JST free windows ≥45 min, split into Sáng/Chiều/Tối
- `buildWeekContext()` — calendar events + habits + free slot map
- `buildPlanPrompt(ctx)` — LLM prompt with THÓI QUEN THỰC TẾ section + slot map + HARD RULES

### ✅ Extra — Google Tasks Integration
- `loadTasks()` — reads `@default` tasklist, filters uncompleted
- `normalizeTask()` + `normalizeDueDate()` — task normalizers
- `insertTask(cmd)` — `gapi.client.tasks.tasks.insert` to `@default` list
- `renderTaskContext()` — Today view: open tasks count + overdue badges + Actions link
- Tasks scope merged into single OAuth consent flow with Calendar
- Tasks fully supported in proposal pipeline: parse → validate → preview → approve → insert

### ✅ Extra — Nexus Command Pipeline
LLM on mobile → natural language → JSON commit → GitHub Actions → Google Calendar/Tasks.

**End-to-end flow:**
1. User issues command via ChatGPT Plus (GitHub integration) or Claude mobile app
2. LLM converts to structured JSON → commits to `nexus-commands/YYYY-MM-DDThh-mm-ss.json`
3. `.github/workflows/nexus-command.yml` triggers on push to `main`
4. `scripts/exec-command.js` validates command + calls Google Calendar or Tasks API (server-side, refresh token)
5. Processed file archived to `nexus-commands/processed/`

**Supported actions:** `add_event`, `add_task`

**Security:** OAuth refresh token stored in GitHub Secrets. Events tagged `source='opus-nexus'`. Validation rejects malformed commands before any API call.

### ✅ Extra — UX Polish
- Per-item Approve button on each proposal card (alongside batch approve)
- Calendar span: 14 → 7 days everywhere (load + free slot map + prompt)
- `health-app/index.html` deleted (stale old version, light theme)

---

## 4. State Model

```js
let currentView   = 'today';          // today | vita | calendar | actions
let currentTab    = 'health';         // sub-tab in Vita
let currentRange  = 7;
let PAT           = localStorage.getItem('ov_pat') || '';
// Vita data
let cHealth=[], cWorkout=[], cFinance=[], healthIdx=[], workoutIdx=[], financeIdx=[];
// Calendar (in-memory, never stored in GitHub)
let gapiReady=false, gToken=null, calEvents=[];
// Tasks
let gTasks=[], tasksLoading=false, tasksError='';
// Proposals
let pendingProposals=[], selectedIdx=new Set();
```

localStorage: `ov_pat` only. OAuth token is in-memory, never persisted.

---

## 5. Validation Rules

### Calendar events — `validateProposal(ev)` returns `{ok, errors[]}`
- title required (non-empty)
- start + end required; `new Date(start) < new Date(end)`
- type ∈ `ALLOWED_TYPES`
- duration = end − start ≤ 3h (except `type === 'sleep_protection'`)
- no overlap with existing `calEvents`
- missing timezone offset → default `+09:00`

### Tasks
- title required
- due: YYYY-MM-DD format

```js
const ALLOWED_TYPES = ['workout','walk','meal_prep','sleep_protection','hydration',
  'recovery','weekly_review','deep_work','study','personal_admin'];
```

---

## 6. Nexus Command Schema

File: `nexus-commands/YYYY-MM-DDThh-mm-ss.json`

```json
// Calendar event:
{ "action": "add_event", "title": "Gym", "start": "2026-06-01T10:00:00+09:00", "end": "2026-06-01T12:00:00+09:00", "type": "workout" }

// Task:
{ "action": "add_task", "title": "Review Q2 goals", "due": "2026-06-02", "notes": "..." }

// Array also supported:
[{ "action": "add_event", ... }, { "action": "add_task", ... }]
```

Server-side validation in `exec-command.js`:
- Required fields per action type
- `add_event`: start < end, duration ≤ 3h, type allowed
- `add_task`: due format YYYY-MM-DD

---

## 7. Non-goals (still apply)

- No backend server
- No React migration
- No calendar event editing or deletion
- No notification / push system
- No medical diagnosis or OCR
- No fully autonomous agent (command pipeline requires structured JSON + explicit commit)
- No direct LLM API call from dashboard (paste-based flow for Plan My Week)

---

## 8. Development History

### Original Phase Plan

Before any code was written, a phase plan was drafted in `docs/PLAN-opus-nexus-transformation.md` + the original version of this file. Phases were:

| Phase | Goal | Result |
|---|---|---|
| 0 | Stabilize Vita schema + empty states | ✅ Done |
| 1 | Rename shell → Opus Nexus + 4-view nav | ✅ Done |
| 2 (partial) | Design primitives (card components) | ✅ Done |
| 3 | Google Calendar read-only | ✅ Done |
| 4 | Calendar action assistant (paste → validate → approve → insert) | ✅ Done |
| 5 | Plan My Week (paste-based LLM JSON) | ✅ Done |
| 6 | Daily Brief + Weekly Review | ⏸ Deferred |
| 7 | Consilium integration | ⏸ Deferred |

### Beyond-plan additions (not in original plan)

| Feature | Description |
|---|---|
| Google Tasks integration | Tasks API alongside Calendar; full proposal pipeline support |
| Per-item Approve button | Each proposal card has its own ✓ Approve, not just batch |
| `summarizeHabits()` | Real historical eating/workout patterns injected into planning prompt |
| `buildFreeSlotMap()` | Free windows per day (not raw event list) in planning prompt |
| Nexus Command Pipeline | LLM mobile → GitHub Actions → Calendar/Tasks auto-write |
| Calendar span 14→7 days | Tighter, more actionable context window |
| Delete `health-app/index.html` | Removed stale old version to avoid confusion |

### Key deviations from original plan

1. **File name**: Plan said `index.html`; actual app was always `dashboard.html` (CI copies it to `opus-vita/index.html`).
2. **No `user-profile/*.json`**: Goals/preferences not created as files; habits inferred directly from logged data.
3. **No `nexus-plans/` or `nexus-actions/` folders**: Not needed; LLM JSON goes directly to Calendar/Tasks API.
4. **`nexus-commands/` added**: Entirely new pattern not in original plan — enables mobile LLM command execution.
