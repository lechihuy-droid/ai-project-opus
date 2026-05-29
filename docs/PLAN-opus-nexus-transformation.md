# Opus Nexus — Transformation Plan

## 1. Vision

Opus Nexus is the conversational command center for the Opus second brain.

Current state:

> `opus-vita` = health / workout / finance dashboard.

Target state:

> `Opus Nexus` = the daily interface where the user talks to the Opus second brain, receives briefs, gives tasks, reviews plans, approves actions, and creates calendar events.

Core promise:

> Nexus does not only display personal data. Nexus turns personal context into plans and approved actions.

Tagline:

> Talk to Nexus. Nexus talks to Opus.

Vietnamese positioning:

> Nói với Nexus. Nexus điều phối Opus.

---

## 2. Product Architecture

```text
OPUS
├── Nexus
│   └── Mobile/chat command center
│
├── Consilium
│   └── Decision brain / strategy memory
│
├── Animus
│   └── Agentic automation layer
│
├── Lucida
│   └── Content / production workflow
│
└── Vita
    └── Health, workout, finance, life metrics module
```

### Module meaning

- **Opus** = the whole second brain / personal operating system.
- **Nexus** = the main app shell and conversational command center.
- **Vita** = health, workout, finance, and life metrics module.
- **Consilium** = decision memory, research memory, strategy brain.
- **Animus** = automation and agent execution layer.
- **Lucida** = creation and content production workflow.

---

## 3. Rename Strategy

Do not delete the Vita concept. Demote it from the whole app name to one module inside Nexus.

```text
Before:
Vita = main app

After:
Nexus = main app shell
Vita = health / workout / finance module inside Nexus
```

Example MVP UI:

```text
🌐 Opus Nexus
Tabs: Today | Vita | Calendar | Actions
```

---

## 4. Product Level Upgrade

### Level 1 — Tracker

The app displays raw personal data: calories, macros, sleep, steps, weight, workout, and finance.

### Level 2 — Dashboard

The app adds today summary, trends, progress, empty states, and insight cards.

### Level 3 — Assistant

The app adds chat / command input, daily brief, weekly review, and calendar-aware advice.

### Level 4 — Operator

The app adds LLM-proposed actions, user approval, and writes approved events to Google Calendar.

### Target for this transformation

Move from Level 1/2 to approximately Level 3.5:

```text
Dashboard + calendar-aware planning + approved calendar actions
```

Do not implement full autonomous agent behavior yet.

---

## 5. Core Features After Transformation

## Feature A — Nexus Today

The Today screen should answer within 5 seconds:

```text
What should I pay attention to today?
What is on my calendar?
How is my health/life status?
What action should I take next?
```

UI concept:

```text
Today Brief
- key calendar events
- health status
- workout suggestion
- meal suggestion
- one recommended action

Vita Snapshot
- kcal
- protein
- sleep
- steps

Calendar Snapshot
- busy level
- eating-out risk
- workout window

Action Queue
- approve weekly plan
- add workout to calendar
- review finance
```

---

## Feature B — Vita Module

Vita is the health/life data module preserved from `opus-vita`.

Includes:

```text
Health
Workout
Finance
Meal logs
Sleep
Steps
Weight
Weekly trend
```

Required improvements:

```text
1. Fix schema compatibility.
2. Add design tokens.
3. Add progress rings.
4. Add insight cards.
5. Improve empty states.
6. Keep GitHub personal data store.
```

Vita becomes the personal life data layer for Nexus, not the full app identity.

---

## Feature C — Calendar Context

Nexus reads Google Calendar to understand the user's week.

It reads:

```text
upcoming events
busy days
free windows
late meetings
eating-out events
travel
gym / workout blocks
```

OAuth scope for read:

```text
https://www.googleapis.com/auth/calendar.readonly
```

Output:

```text
Calendar Context Card

This week:
- Monday and Wednesday are high-busy days.
- Friday has eating-out risk.
- Tuesday 19:00 is a good workout window.
- Sunday is suitable for meal prep or weekly review.
```

Calendar data should not be stored in GitHub by default during MVP. Read it directly, summarize it in memory, and use it for planning.

---

## Feature D — Calendar Action Assistant

Nexus can create Google Calendar events from LLM proposals after user approval.

Safe flow:

```text
User intent
→ Nexus reads context
→ LLM creates event proposals as JSON
→ Nexus previews proposals
→ User approves selected events
→ Nexus inserts approved events into Google Calendar
```

OAuth scope for write:

```text
https://www.googleapis.com/auth/calendar.events
```

Control rule:

```text
LLM must not write directly to Google Calendar.
LLM only creates proposal JSON.
User must approve.
The app calls Google Calendar API only after approval.
```

---

## Feature E — Plan My Week

This should be the first flagship feature of Opus Nexus.

Flow:

```text
1. User taps “✨ Plan My Week”.
2. Nexus reads:
   - calendar for the next 7–14 days
   - health logs
   - workout logs
   - finance / eating signals
   - user goals and preferences
3. Nexus creates a weekly plan:
   - workout events
   - walk / micro-action events
   - meal prep
   - sleep protection
   - weekly review
4. User approves selected actions.
5. Nexus adds approved events to Google Calendar.
```

Example output:

```text
Nexus đề xuất tuần này:

1. Tue 19:00 — Strength training
   Reason: evening is free, and there has been no workout for 2 days.

2. Fri lunch — Light meal guardrail
   Reason: dinner outside is scheduled that evening.

3. Sun 17:00 — Meal prep
   Reason: reduce convenience-food risk next week.

4. Sun 20:00 — Weekly review
   Reason: review health, workout, finance, and schedule.
```

---

## Feature F — Daily Brief

Generated when the user opens the app, not necessarily as a push notification in MVP.

Example:

```text
Good morning.

Today:
- Calendar is busy from 10:00–17:00.
- Dinner outside is scheduled tonight.
- Yesterday's protein was low.
- Sleep is good: 7.5h.

Suggested actions:
- Keep lunch lighter and protein-focused.
- Avoid heavy training today.
- Walk 10 minutes after dinner.
```

---

## Feature G — Weekly Review

At the end of the week, Nexus summarizes life operation signals.

Example:

```text
This week:
- Workout: 2 sessions.
- Sleep: average 7.1h.
- Protein: below target on 4/7 days.
- Eating out: 3 times.
- Food spending increased.

Suggestion for next week:
- 2 strength sessions.
- 3 walking blocks.
- 1 meal prep block.
- 2 sleep-protection events on high-busy days.
```

The weekly review should be convertible into a calendar proposal.

---

## 6. Data Architecture

Existing data folders:

```text
health-data/
workout-data/
finance-data/
```

New data folders to consider:

```text
user-profile/
  goals.json
  preferences.json
  constraints.json

nexus-plans/
  index.json
  2026-W22.json

nexus-actions/
  index.json
  2026-05-29.json
```

Calendar events should not be stored in GitHub by default during MVP.

---

## 7. User Profile Schema

```json
{
  "goals": [
    {
      "id": "fat_loss",
      "label": "Giảm cân nhẹ",
      "priority": "high",
      "target": "Giảm 2kg trong 8 tuần"
    },
    {
      "id": "workout_consistency",
      "label": "Tập đều",
      "priority": "medium",
      "target": "3 buổi/tuần"
    }
  ],
  "preferences": {
    "language": "vi",
    "timezone": "Asia/Tokyo",
    "workout_time_windows": ["19:00-21:00"],
    "avoid_schedule_after": "22:30",
    "meal_style": "Vietnamese/Japanese simple meals"
  },
  "constraints": {
    "no_calendar_auto_write": true,
    "approval_required": true,
    "busy_days_need_micro_actions": true
  }
}
```

---

## 8. LLM Proposal Schema

Nexus should require LLM output as JSON only.

```json
{
  "summary": "Tuần này nên ưu tiên tập đều, tăng protein và bảo vệ giấc ngủ.",
  "events": [
    {
      "title": "Strength training",
      "type": "workout",
      "start": "2026-06-02T19:00:00+09:00",
      "end": "2026-06-02T19:45:00+09:00",
      "location": "Gym",
      "description": "Focus: strength session. Reason: evening is free and previous workout was 2+ days ago.",
      "reminders": [
        {
          "method": "popup",
          "minutes": 30
        }
      ],
      "confidence": "high",
      "reason": "Free evening slot and good recovery window."
    }
  ],
  "micro_actions": [
    {
      "date": "2026-06-04",
      "title": "Walk after dinner",
      "reason": "Busy day with low workout probability."
    }
  ]
}
```

---

## 9. Validation Rules

Before showing or approving a proposal, validate:

```text
- title required
- start required
- end required
- start < end
- no overlap with existing calendar events
- duration <= 3h unless special type
- type must be allowed
- timezone should be Asia/Tokyo by default
```

Allowed event types:

```text
workout
walk
meal_prep
sleep_protection
hydration
recovery
weekly_review
deep_work
study
personal_admin
```

---

## 10. Google Calendar Integration

Read events:

```text
calendar.events.list
calendarId: primary
timeMin: now
timeMax: now + 14 days
singleEvents: true
orderBy: startTime
```

Write approved events:

```text
calendar.events.insert
calendarId: primary
sendUpdates: none
```

Every Nexus-created event should include:

```js
extendedProperties: {
  private: {
    source: "opus-nexus",
    type: proposal.type
  }
}
```

This enables future filtering or editing of only Nexus-created events.

---

## 11. UI Structure

MVP top navigation:

```text
Today | Vita | Calendar | Actions
```

Today:

```text
Daily Brief
Vita Snapshot
Calendar Context
Recommended Action
```

Vita:

```text
Health dashboard
Workout dashboard
Finance dashboard
Logs
```

Calendar:

```text
Connected status
Upcoming events
Busy/free summary
Plan My Week
```

Actions:

```text
LLM proposals
Pending approvals
Add selected to Calendar
Action history
```

---

## 12. Design Direction

Keep the current dark bento style, but rename the visual language:

```text
Nexus Shell
+ Vita Cards
+ Calendar Action Cards
+ Proposal Review Cards
```

Style:

```text
Dark Bento
Apple Health/Fitness inspired
Progress rings
Insight cards
Command-center feel
```

Header:

```text
🌐 Opus Nexus
```

Module badges:

```text
Vita
Calendar
Consilium
Lucida
Animus
```

---

## 13. Implementation Phases

# Phase 0 — Stabilize current Vita

Goal: app data correctness.

```text
1. Fix health schema compatibility.
2. Normalize macro field names.
3. Fix zero / empty states.
4. Add warning for non-canonical schema.
5. Confirm Health / Workout / Finance still render.
```

Exit criteria:

```text
No metric regression.
Macros work for both old and new health-data schema.
```

---

# Phase 1 — Rename shell to Opus Nexus

Goal: product identity change without large feature change.

```text
1. Change document title from opus-vita to Opus Nexus.
2. Change topbar branding to 🌐 Opus Nexus.
3. Treat existing health/workout/finance area as Vita module.
4. Add a simple Today / Nexus summary section above existing dashboard.
5. Keep existing tabs working.
```

Exit criteria:

```text
App feels like Nexus shell, not only a health dashboard.
```

---

# Phase 2 — Design system upgrade

Goal: make UI scalable for assistant features.

```text
1. Add semantic CSS tokens.
2. Add reusable card styles.
3. Add MetricHeroCard.
4. Add RingProgress.
5. Add InsightCard.
6. Add ProposalCard.
7. Add ActionButton styles.
```

Exit criteria:

```text
New assistant cards can be added without ad-hoc inline styling.
```

---

# Phase 3 — Google Calendar read

Goal: Nexus understands calendar context.

```text
1. Add Google OAuth config.
2. Add Connect Calendar button.
3. Add calendar.readonly scope.
4. Load upcoming 14 days.
5. Summarize:
   - busy level
   - late events
   - eating-out risk
   - free windows
6. Render Calendar Context card.
```

Exit criteria:

```text
Nexus can read calendar and show useful weekly context.
If calendar is not connected, app still works.
```

---

# Phase 4 — Calendar action assistant

Goal: create calendar events from approved proposals.

```text
1. Add calendar.events scope.
2. Add proposal JSON paste box.
3. Add proposal validator.
4. Add proposal preview UI.
5. Add selected events to Google Calendar.
6. Add extendedProperties source = opus-nexus.
```

Exit criteria:

```text
User can paste LLM event proposals and approve selected events into Google Calendar.
No auto-write.
No overlap.
```

---

# Phase 5 — Plan My Week MVP

Goal: flagship assistant workflow.

```text
1. Add Plan My Week button.
2. Build context object:
   - calendar summary
   - health summary
   - workout summary
   - finance / eating summary
   - user goals / preferences
3. Generate LLM prompt.
4. User copies prompt to LLM or app calls LLM if API exists.
5. Paste JSON proposal back.
6. Approve and add to calendar.
```

Exit criteria:

```text
Nexus can turn user intent into weekly calendar actions.
```

---

# Phase 6 — Daily Brief + Weekly Review

Goal: assistant behavior.

```text
1. Generate daily brief from current logs + calendar.
2. Generate weekly review from past 7 days.
3. Add recommended actions.
4. Allow converting recommendations into calendar proposals.
```

Exit criteria:

```text
Nexus becomes a daily/weekly life operations assistant.
```

---

# Phase 7 — Consilium integration

Goal: connect Nexus to the second brain.

```text
1. Add Consilium summary link/card.
2. Pull selected decision pages or summaries.
3. Allow "save decision" action.
4. Weekly review can produce decision note.
5. Important plans can be routed to Consilium.
```

Exit criteria:

```text
Nexus is no longer isolated. It communicates with Opus decision brain.
```

---

## 14. MVP Cutline

For the first real MVP, build only:

```text
Phase 0
Phase 1
Phase 2 partially
Phase 3
Phase 4
Phase 5 with paste-based LLM JSON
```

Do not build yet:

```text
medical checkup input
OCR
full AI API automation
calendar event editing/deletion
notification system
backend
React migration
```

---

## 15. Safety and Control Principles

```text
1. User approval before any external action.
2. Calendar write is opt-in.
3. Calendar data is not stored in GitHub by default.
4. LLM outputs proposal only.
5. App validates proposal before action.
6. Nexus-created events are marked with source = opus-nexus.
7. Health advice remains lifestyle-level, not medical diagnosis.
```

---

## 16. Claude / Codex Planning Prompt

Use this prompt to ask Claude or Codex to create a code implementation plan.

```md
# Task: Transform opus-vita into Opus Nexus

## Context
`opus-vita` is currently a single-file mobile-first dashboard in `index.html`.
It reads health/workout/finance data from GitHub via PAT.

The product direction is changing:

- Old: opus-vita = health/life tracker
- New: Opus Nexus = conversational command center for the Opus second brain
- Vita remains as a health/life metrics module inside Nexus

## Goal
Create a concrete code implementation plan before editing code.

## Product Architecture
OPUS:
- Nexus = mobile/chat command center
- Vita = health/workout/finance/life metrics
- Consilium = decision brain
- Animus = automation layer
- Lucida = content workflow

## Required Phase 0
Stabilize current Vita:
1. Fix schema compatibility for health data:
   - support both `grams` and `amount_g`
   - support both `protein` and `protein_g`
   - support both `total_protein` and `total_protein_g`
2. Fix zero/empty states:
   - water_ml: 0 => chưa log
   - steps: 0 => chưa log
   - weight_kg: 0 => chưa log
3. Add console warnings for non-canonical schema.

## Required Phase 1
Rename shell to Opus Nexus:
1. Change document title to `Opus Nexus`.
2. Change topbar branding to `🌐 Opus Nexus`.
3. Treat existing health/workout/finance area as the `Vita` module.
4. Add a simple Today/Nexus summary section above existing Vita dashboard.
5. Do not remove current Health / Workout / Finance features.

## Required Phase 2
Add design system primitives:
1. Semantic CSS tokens for Nexus/Vita.
2. Reusable card classes.
3. Add helper render functions:
   - renderInsightCard()
   - renderMetricHeroCard()
   - renderProposalCard()
   - renderEmptyMetric()
4. Keep app as single `index.html`.

## Required Phase 3
Add Google Calendar read integration:
1. Add Google Calendar config constants:
   - GOOGLE_CLIENT_ID
   - GOOGLE_API_KEY
   - CALENDAR_DISCOVERY_DOC
   - CALENDAR_SCOPES
2. Use Google Identity Services.
3. Use read scope:
   `https://www.googleapis.com/auth/calendar.readonly`
4. Add Connect Calendar button.
5. Load upcoming 14 days from primary calendar.
6. Summarize calendar:
   - busy level
   - eating-out risk
   - late-event risk
   - possible free windows
7. Render Calendar Context card.
8. If calendar is not connected, app must still work normally.

## Required Phase 4
Add calendar proposal approval flow:
1. Add proposal JSON paste area.
2. Parse and validate event proposal JSON.
3. Show event proposal preview cards.
4. Add approval selection.
5. For write action, use scope:
   `https://www.googleapis.com/auth/calendar.events`
6. Insert approved events using Google Calendar `events.insert`.
7. Add:
   extendedProperties.private.source = "opus-nexus"
8. Never auto-create events without user approval.

## LLM Event Proposal Schema
{
  "summary": "",
  "events": [
    {
      "title": "",
      "type": "workout|walk|meal_prep|sleep_protection|hydration|recovery|weekly_review|deep_work|study|personal_admin",
      "start": "2026-06-02T19:00:00+09:00",
      "end": "2026-06-02T19:45:00+09:00",
      "location": "",
      "description": "",
      "reminders": [
        { "method": "popup", "minutes": 30 }
      ],
      "confidence": "high|medium|low",
      "reason": ""
    }
  ]
}

## Validation Rules
- title required
- start required
- end required
- start < end
- no overlap with existing calendar events
- duration <= 3h unless type is sleep_protection
- type must be allowed
- timezone should be Asia/Tokyo by default

## Non-goals
- Do not add backend.
- Do not migrate to React.
- Do not remove GitHub PAT data loading.
- Do not store calendar events in GitHub.
- Do not auto-write to Calendar.
- Do not add medical checkup feature in this phase.
- Do not implement OCR.
- Do not add autonomous agent behavior.

## Acceptance Criteria
- Existing health/workout/finance dashboard still works.
- App branding is Opus Nexus.
- Vita is treated as a module inside Nexus.
- Calendar can be connected read-only.
- Calendar context can be displayed.
- User can paste LLM proposal JSON.
- Proposal is validated and previewed.
- User can approve selected events.
- Approved events are added to Google Calendar.
- App still runs as a single `index.html`.

Return:
1. implementation phases
2. exact files to edit
3. functions to add/change
4. risk list
5. test checklist
6. minimal first PR scope
```

---

## 17. Strategic Summary

```text
Opus Nexus is the new product shell.
Vita becomes the health/life module.
Calendar becomes the execution layer.
Consilium becomes the decision memory.
LLM becomes the planner.
User approval remains the control gate.
```

Best first flagship feature:

```text
✨ Plan My Week
```

Because it proves the full product loop:

```text
Second brain understands context
→ LLM creates plan
→ Nexus previews
→ user approves
→ Calendar executes
```
