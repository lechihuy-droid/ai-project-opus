# Request Change — Vita Health Cleanup + Workout Coach UX

**Date:** 2026-05-31  
**Target:** Codex implementation request  
**Repo scope:** `health-app/dashboard.html`  
**Primary scope:** `Vita > Sức khỏe` and `Vita > Tập luyện`  
**Non-goals:** Do not change Today command center, Finance, Calendar, Approval, PAT, Sync, data schema, API shape, or storage format.

---

## 1. Objective

Continue the Vita UX upgrade by doing two focused improvements:

1. Clean up the `Vita > Sức khỏe` coach block so the screen does not repeat the same risks in multiple places.
2. Upgrade `Vita > Tập luyện` from a simple activity log into a lightweight workout coach dashboard.

The product direction remains:

```text
Data tracker -> diagnosis -> priority -> next action
```

But the implementation must avoid over-explaining. Metrics should show numbers. Coach blocks should explain what to do next.

---

## 2. Global Constraints

- Keep single-file app structure.
- Do not add dependencies.
- Do not change existing data schema.
- Do not add new manual log forms in this phase.
- Do not use emoji/pictograph UI. Keep current SVG icon system.
- Preserve Opus Nexus design system:
  - dark OLED base
  - blue active state
  - semantic colors
  - compact mobile card layout
- JS parse must pass after implementation.
- Regression must not affect Today, Finance, Calendar, Approval, PAT, or Sync.

---

# Part A — Vita > Sức khỏe Cleanup

## A1. Current UX Issue

The current Health tab repeats the same information across multiple sections:

1. `Dinh dưỡng chính` already shows protein, fat, fiber, kcal-related status.
2. `Cần xử lý hôm nay` summary repeats the same risk titles.
3. Risk cards repeat each issue again with action text.

This creates cognitive load. User sees the same message three times:

```text
Chất xơ rất thấp
Fat gần giới hạn
Protein còn thiếu
Thiếu năng lượng nhẹ
```

The direction is correct, but the screen is over-explaining.

---

## A2. Required UX Rule

Separate the purpose of each section:

```text
Dinh dưỡng chính = metric + short status
Cần xử lý hôm nay = summary + one grouped next action + reason chips
```

Do not render a checklist of duplicated risk/action cards when several risks lead to one combined action.

---

## A3. Keep `Dinh dưỡng chính` as metric + short status only

### Required behavior

`Dinh dưỡng chính` should remain a scanning/metrics section.

Each macro row should show:

1. Metric name
2. Current / target
3. Progress bar
4. Very short status label

### Required examples

```text
Protein 103 / 130g -> Thiếu
Carb 131 / 220g -> Còn 89g
Fat 67 / 70g -> Gần giới hạn
Chất xơ 5 / 25g -> Rất thấp
```

### Copy requirements

Use short labels only:

| Condition | Status label |
|---|---|
| Protein below target | `Thiếu` |
| Protein severely low | `Thiếu nhiều` |
| Carb below target | `Còn {n}g` |
| Fat >= 90% target but <= target | `Gần giới hạn` |
| Fat > target | `Vượt giới hạn` |
| Fiber < 40% target | `Rất thấp` |
| Fiber < 70% target | `Còn thiếu` |
| Metric achieved | `Đạt` |

### Important

Do not put full action sentences in the macro rows. For example, avoid:

```text
Chất xơ rất thấp — thêm rau xanh hoặc salad vào bữa tiếp
```

That belongs in the coach block, not in the metric section.

---

## A4. Change `Cần xử lý hôm nay` into one grouped action card

### Required behavior

When multiple risks lead to the same practical action, show one grouped action card instead of multiple repeated risk cards.

Current case:

- Fiber very low
- Fat near limit
- Protein missing
- Kcal slightly low

These should become one combined action:

```text
Bữa tiếp theo: thêm rau xanh + protein nạc, tránh món nhiều dầu.
```

### Required block structure

```text
Cần xử lý hôm nay

Summary short line:
Chất xơ rất thấp, fat gần giới hạn, protein còn thiếu.

Việc nên làm tiếp theo:
Thêm salad/rau xanh/trái cây + protein nạc trong bữa tiếp theo. Tránh đồ chiên, bơ, dầu, sốt béo.

Lý do:
[Chất xơ 5/25g] [Fat 67/70g] [Protein 103/130g]
```

### Required UI structure

Use one card block:

- Header: `Cần xử lý hôm nay`
- Summary paragraph: one short sentence
- Subheading: `Việc nên làm tiếp theo`
- Action paragraph: concrete action
- Reason chips: compact chips showing key metric evidence

### Do not render

Do not render four separate risk cards like:

```text
Chất xơ rất thấp
Fat gần giới hạn
Protein còn thiếu
Thiếu năng lượng nhẹ
```

unless the actions are genuinely different and cannot be combined.

---

## A5. Grouping rule for risk cards

Implement a simple grouping rule:

```text
If multiple risks lead to one food/action decision -> render one grouped action card.
If risks require materially different actions -> render max 2 separate action blocks.
```

### Example: group into one card

Risks:

- fiber low
- fat near limit
- protein low
- kcal slightly low

Action:

```text
Add fiber + lean protein, avoid fat-heavy foods.
```

### Example: allow separate blocks

Risks:

- missing water/sleep/steps logs
- fat exceeded

Actions differ:

1. Sync/log missing data.
2. Avoid additional fat-heavy food.

Even then, keep the UI concise and do not exceed two action blocks.

---

## A6. Red color usage must be reduced

### Required behavior

The whole coach block should use `warn/amber` for the current common scenario:

- fiber low
- fat near limit
- protein missing
- kcal slightly low

This is not an emergency. Do not make the whole card red.

### Red should be reserved for severe cases

Use red only for genuinely serious conditions, for example:

- fat exceeds target materially
- kcal exceeds target materially
- fiber extremely low across multiple logged days
- severe under-eating with very low protein
- impossible/invalid data state

### Acceptance criteria

- Current screenshot-like case should render as `warn`/amber, not red overall.
- Individual risk chip may indicate severity subtly, but the block should not feel like an emergency.
- `bad/red` should be rare and meaningful.

---

## A7. Copy changes

Remove English labels from user-facing UI.

### Required copy

Replace:

```text
Diagnosis:
```

with either:

```text
Tình trạng:
```

or remove the prefix entirely if the sentence already reads naturally.

Replace:

```text
Next action:
```

with:

```text
Việc nên làm tiếp theo:
```

Also replace any existing:

```text
Hành động tiếp theo:
```

with:

```text
Việc nên làm tiếp theo:
```

Reason: more natural Vietnamese and more consistent with the coach layer.

---

# Part B — Vita > Tập luyện Workout Coach UX

## B1. Current UX Issue

The Workout tab currently answers:

```text
Tôi đã tập gì?
```

But it does not answer well:

```text
Tôi tập như vậy đã đủ chưa?
Tôi đang tiến bộ hay thiếu gì?
Buổi tiếp theo nên làm gì?
```

The dashboard shows logs, counts, duration and calories, but it lacks goal context, training quality, balance and next action.

---

## B2. Workout dashboard should prioritize minutes and consistency, not only session count

### Current issue

`5 buổi tập · 21 phút · 204 kcal` can mislead the user.

Five sessions sounds good, but 21 minutes total means average duration is only 4.2 minutes/session.

### Required change

Use a more precise headline:

```text
5 hoạt động · 3 ngày có tập · 21 phút
```

If a weekly target is available or can be inferred from existing constants, show:

```text
21 / 60 phút vận động tuần này
```

If no target exists, do not add schema. Use a local constant inside the Workout render/helper only, for MVP:

```js
const WEEKLY_WORKOUT_MIN_TARGET = 60;
```

This should be internal UI logic only, not a data schema change.

---

## B3. Add workout diagnosis summary

Add a top diagnosis line for Workout.

### Required examples

```text
Tuần này: tần suất tốt, nhưng thời lượng còn thấp.
```

or:

```text
Tuần này: 3 ngày có tập, tổng 21 / 60 phút.
```

or if no activity:

```text
Tuần này chưa có hoạt động tập luyện.
```

### Status logic suggestion

| Condition | Status | Summary direction |
|---|---|---|
| 0 activities | missing/warn | chưa có hoạt động |
| active days >= 3 and minutes < target | warn | tần suất tốt, thời lượng thấp |
| active days < 2 and minutes < target | warn | cần tăng tần suất và thời lượng |
| minutes >= target | good | đạt mục tiêu tuần |

---

## B4. Add next workout action

Workout tab needs a clear next action.

### Required examples

If active days are okay but minutes are low:

```text
Việc nên làm tiếp theo:
Thêm 20-30 phút vận động nhẹ hoặc mobility hôm nay.
```

If only core/gym short sessions exist:

```text
Việc nên làm tiếp theo:
Buổi tới tập full-body nhẹ 25-30 phút, ưu tiên push/pull/legs.
```

If Muay Thai dominates and no recovery/mobility:

```text
Việc nên làm tiếp theo:
Thêm 10-15 phút mobility hoặc giãn cơ để hỗ trợ phục hồi.
```

If no workout:

```text
Việc nên làm tiếp theo:
Bắt đầu bằng 15-20 phút đi bộ nhanh hoặc mobility nhẹ.
```

---

## B5. Change primary workout chart from session count to minutes per day

### Current issue

Counting sessions/day is low-signal because two short activities can look better than one full workout.

### Required change

Primary chart should be:

```text
Phút tập / ngày
```

instead of:

```text
Số buổi / ngày
```

### Optional MVP toggle

If low effort, add no toggle. Just replace chart metric.

If easy to implement, allow simple labels/toggle:

```text
Phút tập | Số hoạt động | Kcal
```

But toggle is not required for this phase.

---

## B6. Calories should become secondary

Workout calories should not be hero metric because it is not a reliable primary progress indicator for strength training or Muay Thai.

### Required metric hierarchy

Priority order:

1. Total workout minutes
2. Active days
3. Activities/sessions count
4. Workout type balance
5. Calories

### Required hero example

```text
Tuần này
21 / 60 phút
3 ngày có tập · 5 hoạt động · 204 kcal
Tần suất ổn, thời lượng còn thấp
```

---

## B7. Add workout type breakdown

Add a compact breakdown by workout type.

### Required example

```text
Muay Thai: 3 hoạt động · 18 phút
Gym: 2 hoạt động · 3 phút
Mobility: 0
Recovery: 0
```

### Implementation note

Use existing workout log data. Do not require new schema.

Normalize technical labels for UI:

| Raw value | Display label |
|---|---|
| `MUAY_THAI` | `Muay Thai` |
| `GYM` | `Gym` |
| `MOBILITY` | `Mobility` |
| `RECOVERY` | `Recovery` |

Do not expose enum/raw uppercase values in user-facing UI.

---

## B8. Workout history card cleanup

### Required changes

Workout history should show clear, user-friendly text:

```text
Muay Thai · T7 30/5 · 19:30
6 phút · 3 hiệp x 2 phút
Sparring
```

Gym example:

```text
Gym · T7 30/5 · 20:10
Ab wheel rollout
3 sets x 15 reps · bodyweight
```

### Do not show bad data

Never show:

```text
undefinedkg
nullkg
NaNkg
```

### Required display rules for strength sets

| Data condition | Display |
|---|---|
| weight exists | `{reps} reps x {weight}kg` |
| bodyweight exercise | `{reps} reps · bodyweight` |
| weight not applicable | `{reps} reps` |
| weight missing but expected | `{reps} reps · chưa nhập tạ` |

For exercises like `Ab wheel rollout`, show no kg unless a real weight exists.

---

## B9. Add workout reason chips

The Workout coach card should include compact reason chips, similar to Health.

### Required examples

```text
[21/60 phút]
[3 ngày có tập]
[5 hoạt động]
[Gym 3 phút]
```

Reason chips should explain why the next action was suggested.

---

## B10. Recovery context, MVP only

Do not build a full recovery model in this phase.

But if sleep data is missing or low and available from Health logs, show a light note:

```text
Chưa có dữ liệu ngủ hôm nay, nên chưa đánh giá phục hồi chính xác.
```

or:

```text
Ngủ thấp, buổi tới nên giảm intensity hoặc ưu tiên mobility.
```

Only use existing health data. Do not add schema.

---

# Part C — Suggested Helper Functions

Implementation can rename functions as needed, but keep these responsibilities clear.

## C1. Health helpers

```js
buildHealthCoachInsight(shown, logs)
rankHealthRisks(metrics)
buildHealthNextAction(risks, metrics)
renderHealthCoachBlock(insight)
formatMacroStatus(metric, risk, left)
```

### Key change

`renderHealthCoachBlock()` should no longer render a full list of four separate repeated risk cards by default.

It should render:

```text
summary -> next action -> reason chips
```

## C2. Workout helpers

```js
buildWorkoutCoachInsight(workoutLogs, healthLogs)
summarizeWorkoutWeek(workoutLogs)
normalizeWorkoutTypeLabel(type)
renderWorkoutCoachBlock(insight)
renderWorkoutTypeBreakdown(summary)
formatExerciseSet(exercise, set)
```

---

# Part D — Acceptance Criteria

## D1. Health acceptance criteria

- `Dinh dưỡng chính` only shows metric + short status.
- Protein status example: `Thiếu`.
- Fat status example: `Gần giới hạn`.
- Fiber status example: `Rất thấp`.
- `Cần xử lý hôm nay` renders one grouped action card in common combined-risk scenarios.
- The grouped card includes:
  - summary short line
  - `Việc nên làm tiếp theo`
  - reason chips
- No duplicate four-card risk list for the common case.
- Overall coach block uses warn/amber for the current common case.
- Red is reserved for severe risks only.
- No English UI label `Diagnosis:` or `Next action:` remains.
- `Hành động tiếp theo:` is replaced by `Việc nên làm tiếp theo:`.

## D2. Workout acceptance criteria

- Workout headline uses minutes and active days, not only session count.
- `5 buổi tập` is replaced or clarified as `5 hoạt động` if entries are activity-level logs.
- Weekly minutes target is visible as `current / target` if local constant is used.
- Workout diagnosis summary is visible near top.
- Workout next action is visible and specific.
- Primary chart shows minutes per day.
- Calories are secondary.
- Workout type breakdown is visible.
- Raw enum labels like `MUAY_THAI` and `GYM` are normalized for UI.
- `undefinedkg`, `nullkg`, `NaNkg` never appear.
- Workout history remains readable and compact.

## D3. Regression criteria

- Today behavior unchanged.
- Finance unchanged.
- Calendar unchanged.
- Approval unchanged.
- PAT/Sync unchanged.
- No schema/API change.
- No dependency added.
- Inline JS parse passes with `node --check` or equivalent.

---

# Part E — Recommended Implementation Order

1. Health copy cleanup:
   - replace `Diagnosis:` / `Next action:` / `Hành động tiếp theo:`.
2. Health macro status cleanup:
   - shorten macro row status labels.
3. Health coach block grouping:
   - summary + next action + chips.
4. Health severity/color adjustment:
   - warn/amber for common case, red only for severe.
5. Workout helper build:
   - summarize active days, activity count, total minutes, kcal, type breakdown.
6. Workout hero/card update:
   - minutes-first hierarchy.
7. Workout chart switch:
   - minutes per day.
8. Workout history cleanup:
   - normalize labels and prevent `undefinedkg`.
9. Run static parse/regression checks.

---

## Final Product Direction

Vita should feel like a compact personal coach, not a verbose analytics dashboard.

Health:

```text
Metrics tell what happened.
Coach card tells what to do next.
```

Workout:

```text
Logs tell what was done.
Coach card tells whether it was enough and what the next session should be.
```
