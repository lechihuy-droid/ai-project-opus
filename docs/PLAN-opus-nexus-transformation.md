# Opus Nexus — Product Plan

> **Status as of 2026-05-30:** MVP fully shipped. Phases 0–5 complete + 3 beyond-plan features added.
> Implementation record: `docs/IMPL-opus-nexus.md`.

---

## 1. Vision

Opus Nexus is the conversational command center for the Opus second brain.

```
Before: opus-vita = health / workout / finance dashboard
After:  Opus Nexus = daily interface to the Opus second brain
```

Core promise:

> Nexus does not only display personal data. Nexus turns personal context into plans and approved actions.

Tagline:

> Talk to Nexus. Nexus talks to Opus.

---

## 2. Product Architecture

```
OPUS
├── Nexus       — mobile/chat command center (this app)
├── Vita        — health, workout, finance, life metrics (module inside Nexus)
├── Consilium   — decision brain / strategy memory
├── Animus      — agentic automation layer
└── Lucida      — content / production workflow
```

---

## 3. Product Level

| Level | Description | Status |
|---|---|---|
| 1 — Tracker | Display raw personal data | ✅ Shipped (Vita) |
| 2 — Dashboard | Today summary, trends, insight cards | ✅ Shipped |
| 3 — Assistant | Calendar-aware advice, weekly planning | ✅ Shipped |
| 4 — Operator | LLM proposals + user approval + calendar writes | ✅ Shipped |
| 4.5 — Commander | Mobile natural language → auto Calendar/Tasks via pipeline | ✅ Shipped (beyond plan) |
| 5 — Autonomous | Fully autonomous agent loop | ⏸ Not planned for MVP |

---

## 4. Current Feature Map

### ✅ Feature A — Nexus Today
The Today screen answers within 5 seconds:
- Vita snapshot: kcal / protein / sleep / steps vs targets
- Calendar Context: busy level, free windows, eating-out signal
- Task Context: open tasks, overdue count, link to Actions

### ✅ Feature B — Vita Module
Health / workout / finance data from GitHub (PAT-based):
- Health: calories, macros, water, sleep, steps, weight
- Workout: session history, exercise logs
- Finance: transaction history, budget bars
- Range selector: 7 / 14 / 30 / 90 days

### ✅ Feature C — Calendar Context
Google Calendar read integration (OAuth GIS browser flow):
- Connects with `calendar.readonly` scope
- Loads 7 days from `primary` calendar
- Summarizes: busy level, eating-out risk, late events, free windows

### ✅ Feature D — Calendar + Tasks Action Assistant
Proposal review flow — no auto-write:
```
LLM JSON paste → validate → preview cards → per-item Approve → insert to Calendar or Tasks
```
- Supports both calendar events and Google Tasks in same pipeline
- Each proposal card has individual ✓ Approve button + batch approve for multiple
- Events tagged `extendedProperties.private.source='opus-nexus'`

### ✅ Feature E — Plan My Week
Flagship assistant workflow:
1. User taps ✨ Plan My Week
2. Nexus builds context:
   - 7-day calendar events
   - Real historical habits: avgKcal, avgProtein, proteinHitRate, workout frequency/timing/types
   - Per-day free slot map (Sáng/Chiều/Tối zones, ≥45 min gaps)
3. Nexus generates LLM prompt — user copies to LLM
4. User pastes JSON result back → reuses full D pipeline (validate → preview → approve)

### ✅ Feature F — Nexus Command Pipeline *(beyond original plan)*
Mobile natural language → auto-write to Calendar/Tasks:
```
iPhone → ChatGPT/Claude App → JSON commit to nexus-commands/ 
       → GitHub Actions → Google Calendar/Tasks API → archived
```
- Supported commands: `add_event`, `add_task`
- Server-side validation + OAuth refresh token (GitHub Secrets)
- Zero friction: works from any LLM with GitHub integration

---

## 5. Deferred Features

### Feature G — Daily Brief
Auto-generated when app opens (not push notification for MVP):
- Key calendar events today
- Health status vs targets
- Workout/meal suggestion

### Feature H — Weekly Review
End-of-week summary:
- Workout count, sleep avg, protein hit rate, eating-out frequency
- Suggestion for next week → convertible to Plan My Week input

### Phase 6 — Consilium Integration
- Pull selected decision summaries
- Save decision note from weekly review
- Route important plans to Consilium

---

## 6. Data Architecture

### Active
```
health-data/         — daily health/meal logs (JSON per day)
workout-data/        — workout sessions
finance-data/        — finance transactions
nexus-commands/      — command queue (LLM commits here)
nexus-commands/processed/  — archive after execution
health-app/          — app source + docs
scripts/             — exec-command.js, get-refresh-token.js
.github/workflows/   — nexus-command.yml, sync-dashboard.yml
```

### Not created (original plan, not needed)
```
user-profile/        — habits inferred from data instead
nexus-plans/         — LLM JSON goes directly to Calendar/Tasks
nexus-actions/       — same reason
```

### Runtime only (never stored in GitHub)
```
Google Calendar events
Google Tasks
OAuth access token
```

---

## 7. LLM Proposal Schema (dashboard paste flow)

```json
{
  "summary": "...",
  "events": [
    {
      "title": "Strength training",
      "type": "workout",
      "start": "2026-06-02T19:00:00+09:00",
      "end": "2026-06-02T19:45:00+09:00",
      "location": "Gym",
      "description": "...",
      "reminders": [{ "method": "popup", "minutes": 30 }],
      "confidence": "high",
      "reason": "..."
    }
  ],
  "tasks": [
    {
      "title": "Review Q2 goals",
      "due": "2026-06-02",
      "notes": "..."
    }
  ]
}
```

---

## 8. Nexus Command Schema (pipeline flow)

```json
{ "action": "add_event", "title": "...", "start": "ISO8601+09:00", "end": "ISO8601+09:00", "type": "workout|..." }
{ "action": "add_task", "title": "...", "due": "YYYY-MM-DD", "notes": "..." }
```

---

## 9. Safety and Control Principles

```
1. User approval before any external action (dashboard flow).
2. Pipeline flow auto-writes — but requires structured JSON + explicit commit intent.
3. Calendar data is not stored in GitHub by default.
4. LLM outputs proposal only in dashboard flow.
5. App validates proposal before action.
6. Nexus-created events are marked source='opus-nexus'.
7. OAuth refresh token stored only in GitHub Secrets — never in code.
8. Health advice remains lifestyle-level, not medical diagnosis.
```

---

## 10. Strategic Summary

```
Opus Nexus is the new product shell.
Vita is the health/life data module.
Calendar + Tasks are the execution layer.
LLM is the planner (paste flow) and commander (pipeline flow).
User approval remains the control gate for dashboard flow.
GitHub Actions is the trusted executor for command pipeline flow.
```

---

## Appendix — Development History

Original transformation plan was drafted before implementation. The plan defined 5+2 phases (0–7). Phases 0–5 were implemented as planned. Three additional features were shipped beyond the original plan:

| Addition | Not in original plan because |
|---|---|
| Google Tasks integration | Original plan was Calendar-only |
| Nexus Command Pipeline | Entirely new concept — mobile LLM → auto-write |
| Historical habits in Plan My Week prompt | Original plan used `user-profile/*.json` instead |

Phase 6 (Daily Brief + Weekly Review) and Phase 7 (Consilium integration) remain deferred.
