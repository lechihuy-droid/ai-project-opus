# Opus Vita — Top Section UX Refactor Brief for Coding Agent

## 0. Context

This document converts the UI/UX review of the **Vita** top section into an implementation-ready brief for a coding agent.

Target screen: **Opus Nexus / Vita tab / top section**.

Current UI observed from mobile screenshot:

- Header: `Opus Nexus`, flame score, Sync button, key icon.
- Range selector: `7 ngày / 14 ngày / 30 ngày / 3 tháng`.
- Top card: `NĂNG LƯỢNG HÔM NAY`, showing `873 / 2,200 kcal mục tiêu`, `Còn 1327 kcal để đạt mục tiêu`, and an evaluation sentence.
- Alert card: `CẦN XỬ LÝ HÔM NAY`, explaining low fiber, low protein, and energy imbalance, with reason chips and additional missing data notes.

The direction is correct: the app is moving from a passive **data dashboard** toward a **coach dashboard**. However, the current top section still repeats information and over-emphasizes calories.

---

## 1. Product Goal

The Vita top section should answer three questions in under 5 seconds:

1. **What is the most important nutrition issue today?**
2. **Why does it matter?**
3. **What should I do next?**

The UI should not merely report numbers. It should translate nutrition logs into a clear daily decision.

---

## 2. Main UX Problems To Fix

### 2.1 Duplicate insight across two cards

Current top card and alert card both say roughly the same thing: calories are low, protein is still low, fiber is very low, and action is needed today.

This creates a long screen and weakens the main message.

**Fix:** merge the current `Năng lượng hôm nay` and `Cần xử lý hôm nay` concepts into one stronger **Daily Coach Card**.

### 2.2 Calories are visually over-weighted

The current `873` number is the largest and most visually dominant element. This makes the user think calories are the primary health issue.

But the real coaching priority is likely:

1. fiber is extremely low: `3 / 25g`
2. protein is still low: `63 / 130g`
3. calories are also low: `873 / 2,200 kcal`

**Fix:** make the headline and action focus on **protein + fiber**, while keeping calories as supporting context.

### 2.3 The red warning tone is too heavy

The screen currently uses strong red background, red card border, red text, and warning icon. This can feel like a failure state.

Health coaching should be clear but supportive.

**Fix:** keep red only for severe deficit indicators. Use calmer copy and reduce visual alarm density.

### 2.4 Recommendation is still too generic

Current recommendation:

> Ăn thêm một phần protein nạc vừa đủ kcal, không cần tăng fat.

This is directionally good but not concrete enough. User still needs to know what to eat, how much to target, which macro is priority, and whether to add fiber too.

**Fix:** produce a concrete next-best-action block.

### 2.5 Missing data should affect confidence

Current UI mentions missing water, sleep, and movement data near the bottom. This is useful but too late.

If data is incomplete, recommendations should be labeled as provisional.

**Fix:** add a small **confidence / data completeness** signal inside the Daily Coach Card.

---

## 3. Target Design Principle

Use this hierarchy:

1. **Meaning first** — what matters most today
2. **Action second** — what the user should do next
3. **Metrics third** — numbers that explain the recommendation
4. **Confidence last** — whether the recommendation is reliable or missing data

Do not start with the largest raw number unless that number itself is the key decision.

---

## 4. Proposed Layout

Replace the current top two cards with one consolidated card:

```text
[Daily Coach Card]

ƯU TIÊN HÔM NAY
Bổ sung protein + chất xơ

Bạn mới đạt 873 / 2,200 kcal.
Protein còn thiếu nhiều và chất xơ đang rất thấp,
nên bữa tiếp theo nên ưu tiên protein nạc + nguồn chất xơ,
thay vì chỉ tăng kcal bằng đồ nhiều fat.

NEXT BEST ACTION
Bữa tiếp theo: thêm khoảng 25–35g protein + 8–12g chất xơ.
Gợi ý: thịt gà/cá/trứng/đậu phụ + rau, yến mạch, đậu hoặc trái cây.

[Protein 63 / 130g] [Fiber 3 / 25g] [Kcal 873 / 2,200]

Độ tin cậy: trung bình — còn thiếu dữ liệu nước, ngủ, vận động.
```

---

## 5. Content Requirements

### 5.1 Card title

Avoid narrow titles like `NĂNG LƯỢNG HÔM NAY`.

Use a coaching-oriented title:

- `ƯU TIÊN HÔM NAY`
- `TÌNH TRẠNG DINH DƯỠNG HÔM NAY`
- `DAILY NUTRITION COACH`

Recommended Vietnamese title:

```text
ƯU TIÊN HÔM NAY
```

### 5.2 Main headline

The headline should say what matters, not only what was measured.

Recommended:

```text
Bổ sung protein + chất xơ
```

Alternative based on severity:

```text
Chất xơ rất thấp, protein còn thiếu
```

### 5.3 Main explanation

Use concise, non-judgmental copy:

```text
Bạn mới đạt 873 / 2,200 kcal. Protein còn thiếu nhiều và chất xơ đang rất thấp, nên bữa tiếp theo nên ưu tiên protein nạc + nguồn chất xơ, thay vì chỉ tăng kcal bằng đồ nhiều fat.
```

Avoid language that feels like blame:

- `rất tệ`
- `fail`
- `nguy hiểm` unless medically justified
- too many red warnings

### 5.4 Next Best Action block

Must be concrete.

Recommended:

```text
Bữa tiếp theo: thêm 25–35g protein + 8–12g chất xơ.
```

Optional suggestion line:

```text
Gợi ý: thịt gà/cá/trứng/đậu phụ + rau, yến mạch, đậu hoặc trái cây.
```

If the app does not yet support meal recommendation logic, render this as static guidance generated from the current macro gaps.

### 5.5 Reason chips

Keep the chips, but use them as supporting evidence, not the main explanation.

Recommended chip order:

1. `Protein 63 / 130g`
2. `Chất xơ 3 / 25g`
3. `Kcal 873 / 2,200`

Rationale: this order matches the coaching priority better than putting calories first.

### 5.6 Confidence / missing data

Add a compact data completeness signal:

```text
Độ tin cậy: trung bình — còn thiếu dữ liệu nước, ngủ, vận động.
```

Alternative if many signals are missing:

```text
Khuyến nghị tạm thời — sync hoặc log nhanh để đánh giá chính xác hơn.
```

This should be visually calmer than the main alert. Use muted text or a small info row, not another red warning block.

---

## 6. Visual Requirements

### 6.1 Reduce red intensity

Current red usage is too dense. Adjust as follows:

- Use red only for the most severe deficit state.
- Avoid full-card red dominance unless the state is genuinely critical.
- Prefer dark neutral card background with red accent border or red icon.
- Keep warning icon small.

Suggested visual hierarchy:

- Headline: white / high contrast
- Priority keyword: red or orange accent
- Action block: highlighted but not alarming
- Chips: color-coded by metric severity
- Confidence line: muted gray

### 6.2 Single-card compression

The final top section should be shorter than the current two-card version.

Approximate structure:

```text
Card padding: 24–28px horizontal
Card sections:
1. eyebrow title
2. main headline
3. explanation paragraph
4. next best action block
5. metric chips
6. confidence row
```

Avoid excessive vertical spacing between explanation and chips.

### 6.3 Mobile readability

Prevent truncated labels. No important insight should end with `...`.

Rules:

- Main insight text must wrap cleanly up to 2–3 lines.
- Chips can wrap to second row.
- Do not truncate `Protein`, `Chất xơ`, or `Kcal` chips.
- Avoid long labels like `Xu hướng: năng lượng lệch mục tiêu, prot...`.

---

## 7. Data / Logic Requirements

The component should accept these input values:

```ts
type DailyNutritionInput = {
  kcalCurrent: number;
  kcalTarget: number;
  proteinCurrent: number;
  proteinTarget: number;
  fiberCurrent: number;
  fiberTarget: number;
  hasWaterLog: boolean;
  hasSleepLog: boolean;
  hasMovementLog: boolean;
};
```

Derived values:

```ts
kcalRemaining = kcalTarget - kcalCurrent
proteinRemaining = proteinTarget - proteinCurrent
fiberRemaining = fiberTarget - fiberCurrent
kcalRatio = kcalCurrent / kcalTarget
proteinRatio = proteinCurrent / proteinTarget
fiberRatio = fiberCurrent / fiberTarget
```

Priority logic suggestion:

```ts
if (fiberRatio < 0.4 && proteinRatio < 0.7) {
  priority = 'protein_fiber';
  headline = 'Bổ sung protein + chất xơ';
} else if (fiberRatio < 0.4) {
  priority = 'fiber';
  headline = 'Ưu tiên chất xơ';
} else if (proteinRatio < 0.7) {
  priority = 'protein';
  headline = 'Bổ sung protein';
} else if (kcalRatio < 0.65) {
  priority = 'energy';
  headline = 'Bổ sung năng lượng có kiểm soát';
} else {
  priority = 'balanced';
  headline = 'Dinh dưỡng hôm nay khá ổn';
}
```

Confidence logic suggestion:

```ts
const missing = [];
if (!hasWaterLog) missing.push('nước');
if (!hasSleepLog) missing.push('ngủ');
if (!hasMovementLog) missing.push('vận động');

if (missing.length >= 2) confidence = 'trung bình';
else if (missing.length === 1) confidence = 'khá';
else confidence = 'cao';
```

Confidence copy:

```ts
if (missing.length > 0) {
  confidenceText = `Độ tin cậy: ${confidence} — còn thiếu dữ liệu ${missing.join(', ')}.`;
} else {
  confidenceText = 'Độ tin cậy: cao — dữ liệu hôm nay đã đủ tốt.';
}
```

---

## 8. Acceptance Criteria

Implementation is acceptable when:

- The current two-card top section is replaced or visually compressed into one Daily Coach Card.
- The card headline tells the user the top nutrition priority today.
- The main action is specific enough to execute immediately.
- Protein and fiber are not visually subordinate to calories.
- Red warning styling is reduced and reserved for severe deficit indicators.
- No key insight text is truncated on iPhone-width screens.
- Missing data is shown as a confidence indicator.
- The range selector remains visible above the card.
- Existing bottom navigation layout is not broken.
- The card still works when values change dynamically.

---

## 9. Suggested Component Name

Use one of:

```text
DailyNutritionCoachCard
VitaDailyCoachCard
TodayNutritionPriorityCard
```

Recommended:

```text
VitaDailyCoachCard
```

---

## 10. Example Final Copy For Current Data

Use this for immediate UI implementation with the screenshot values:

```text
ƯU TIÊN HÔM NAY
Bổ sung protein + chất xơ

Bạn mới đạt 873 / 2,200 kcal. Protein còn thiếu nhiều và chất xơ đang rất thấp, nên bữa tiếp theo nên ưu tiên protein nạc + nguồn chất xơ, thay vì chỉ tăng kcal bằng đồ nhiều fat.

Bữa tiếp theo: thêm 25–35g protein + 8–12g chất xơ.
Gợi ý: thịt gà/cá/trứng/đậu phụ + rau, yến mạch, đậu hoặc trái cây.

Protein 63 / 130g · Chất xơ 3 / 25g · Kcal 873 / 2,200

Độ tin cậy: trung bình — còn thiếu dữ liệu nước, ngủ, vận động.
```

---

## 11. Do Not Do

- Do not implement another weekly comparison card here.
- Do not keep both current cards if they repeat the same insight.
- Do not make calories the only large visual focus.
- Do not add more text than the current section. The target is stronger compression, not more explanation.
- Do not use aggressive health warnings unless there is validated medical logic behind them.
