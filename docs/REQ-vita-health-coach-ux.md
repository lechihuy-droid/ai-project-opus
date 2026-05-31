# UX Change Requirements — Vita > Sức khỏe thành Health Coach

**Date:** 2026-05-31  
**Status:** Ready for implementation  
**Scope:** `health-app/dashboard.html` — only `Vita > Sức khỏe`  
**Target outcome:** Chuyển tab Sức khỏe từ màn số liệu sang màn `diagnosis + priority + next action`.

---

## 1. Executive Summary

Tab `Vita > Sức khỏe` hiện đã có nền tảng dashboard tốt: hiển thị kcal, macro, weekly summary, chart và các chỉ số liên quan. Tuy nhiên UX hiện tại vẫn thiên về `data tracker`: user phải tự đọc nhiều block để suy luận tình trạng hôm nay, vấn đề ưu tiên và hành động tiếp theo.

Yêu cầu thay đổi lần này chỉ áp dụng cho tab Sức khỏe trong Vita. Không chỉnh Today command center, Workout, Finance, Calendar, Approval, PAT, Sync hoặc schema dữ liệu.

Mục tiêu mới: khi mở tab Sức khỏe, user phải hiểu trong 5 giây:

1. Hôm nay tình trạng sức khỏe/dinh dưỡng đang tốt, cảnh báo hay thiếu dữ liệu.
2. Vấn đề ưu tiên nhất cần xử lý là gì.
3. Hành động tiếp theo nên làm là gì.

---

## 2. Scope Control

### 2.1 In scope

- Thêm logic nội bộ để build health coach insight từ dữ liệu hiện có.
- Cập nhật `renderHealth()` để hero kcal, macro rows, missing-data state, insight block và weekly nutrition summary thể hiện rõ diagnosis/action.
- Thay block insight hiện tại bằng block `Cần xử lý hôm nay`.
- Điều chỉnh layout/UI trong tab Sức khỏe để ưu tiên diagnosis và next action trước analytics/chart.
- Tăng bottom spacing cho phần chart để tránh bị bottom nav che.
- Cập nhật rule design system trong code/doc comment nếu có khu vực tương ứng.

### 2.2 Out of scope

- Không đổi Today command center.
- Không đổi Workout.
- Không đổi Finance.
- Không đổi Calendar.
- Không đổi Approval.
- Không đổi PAT/Sync behavior.
- Không đổi data schema/API.
- Không thêm dependency.
- Không thêm form log mới cho nước/ngủ/vận động.
- Không refactor app ra nhiều file; vẫn giữ single-file app.

---

## 3. Product Principle

Tab Sức khỏe không chỉ hiển thị số liệu. Nó phải đóng vai trò `health coach layer`:

```text
Raw logs/data -> metrics -> diagnosis -> prioritized risk -> next action
```

Trong mọi block quan trọng, ưu tiên UX theo thứ tự:

1. Diagnosis: tình trạng hiện tại là gì.
2. Priority: rủi ro nào cần chú ý nhất.
3. Action: bước tiếp theo nên làm gì.
4. Analytics: chart/trend để xem sâu hơn.

---

## 4. Required Internal Helpers

Triển khai helper JS nội bộ trong `health-app/dashboard.html`. Tên function có thể điều chỉnh nếu cần, nhưng cần giữ separation of concerns rõ.

### 4.1 `buildHealthCoachInsight(shown, logs)`

**Purpose:** Build object tổng hợp cho tab Sức khỏe từ metrics/log hiện có.

**Expected output shape:**

```js
{
  status: 'good' | 'warn' | 'bad' | 'missing',
  risks: HealthRisk[],
  topSummary: string,
  nextAction: string,
  missingData: {
    water: boolean,
    sleep: boolean,
    steps: boolean
  }
}
```

**Requirement:** Không mutate dữ liệu gốc. Không tạo schema mới.

### 4.2 `rankHealthRisks(metrics)`

**Purpose:** Xếp hạng risk theo mức độ cần hành động, không chỉ theo độ nổi của số.

**Priority rule:**

1. Fiber thấp nghiêm trọng.
2. Fat gần/vượt giới hạn.
3. Protein thiếu đáng kể.
4. Kcal thiếu/vượt.
5. Missing data: water/sleep/steps.

**Important behavior:** Nếu fiber/fat/protein nghiêm trọng hơn kcal, chúng phải xuất hiện trước kcal trong summary/action.

### 4.3 `renderHealthCoachBlock(insight)`

**Purpose:** Render block `Cần xử lý hôm nay` thay cho `renderInsight()` hiện tại trong tab Sức khỏe.

**Requirement:** Mỗi item cần có:

- Risk title ngắn.
- Current/target nếu có.
- Action ngắn, cụ thể.

### 4.4 `formatCurrentTarget(current, target, unit)`

**Purpose:** Chuẩn hóa cách hiển thị `current / target` cho kcal và macro.

**Examples:**

```text
Protein 103 / 130g
Carb 131 / 220g
Fat 67 / 70g
Fiber 5 / 25g
Kcal 1,840 / 2,200
```

---

## 5. Functional UX Requirements

### H-01 — Hero kcal must include diagnosis

Hero kcal hiện không nên chỉ nói user còn thiếu bao nhiêu kcal. Cần thêm một câu diagnosis ngắn.

**Current direction:**

```text
1,840 / 2,200 kcal
còn 360 kcal để đạt mục tiêu
```

**Required direction:**

```text
Thiếu năng lượng nhẹ, nhưng fat gần giới hạn.
1,840 / 2,200 kcal
Còn 360 kcal
```

**Acceptance criteria:**

- Hero hiển thị được diagnosis từ `topSummary`.
- Nếu kcal thiếu nhẹ, không dùng red alarm mạnh.
- Nếu có risk nghiêm trọng hơn kcal, diagnosis phải nhắc risk đó.

---

### H-02 — Kcal severity color must be semantic

Kcal thiếu nhẹ không được dùng red mạnh. Red chỉ dùng cho tình trạng thật sự nghiêm trọng.

**Color semantics:**

| Status | Use case | Visual treatment |
|---|---|---|
| `good` | đạt/ổn | green/neutral |
| `warn` | cần chú ý | orange/amber |
| `bad` | vượt giới hạn hoặc risk nghiêm trọng | red |
| `missing` | chưa log/chưa đồng bộ | gray/neutral |

**Acceptance criteria:**

- Thiếu kcal nhẹ -> warn/orange.
- Fiber rất thấp hoặc fat vượt giới hạn -> có thể bad/red tùy severity.
- Missing data không hiển thị như risk đỏ nếu chỉ là chưa log.

---

### H-03 — Macro rows must use current/target format

Macro rows phải hiển thị đủ current và target để user hiểu context.

**Required examples:**

```text
Protein 103 / 130g — còn 27g
Carb 131 / 220g — còn 89g
Fat 67 / 70g — còn 3g
Fiber 5 / 25g — còn 20g
```

**Acceptance criteria:**

- Không chỉ hiển thị `103g` hoặc `còn 27g` mà thiếu target.
- Unit phải nhất quán.
- Target lấy từ dữ liệu hiện có, không thêm schema.

---

### H-04 — Fiber and fat must be visually prioritized when they are real risks

Nếu fiber thấp hoặc fat gần/vượt giới hạn, chúng phải được nhấn rõ hơn trong macro section và insight block.

**Required examples:**

```text
Chất xơ rất thấp: 5 / 25g
Thêm salad/rau xanh ở bữa tiếp theo.
```

```text
Fat gần giới hạn: 67 / 70g
Nếu ăn thêm, ưu tiên protein nạc, tránh đồ chiên/dầu.
```

**Acceptance criteria:**

- Fiber thấp nghiêm trọng không bị chìm dưới kcal.
- Fat gần giới hạn phải ảnh hưởng đến next action: tránh đề xuất ăn thêm đồ nhiều fat.
- Nếu protein thiếu nhưng fat gần giới hạn, action phải ưu tiên protein nạc.

---

### H-05 — Missing data must not be shown as plain dash

Không dùng dấu `—` đơn độc cho water/sleep/steps.

**Required data states:**

| Data state | Display |
|---|---|
| User chưa nhập | `Chưa log` |
| Thiết bị/app chưa đồng bộ | `Chưa đồng bộ` |
| Không có dữ liệu | `Không có dữ liệu` |
| Giá trị thật bằng 0 | `0` |
| Không áp dụng | `Không áp dụng` |

**Acceptance criteria:**

- Water missing -> `Chưa log`.
- Sleep missing -> `Chưa log`.
- Steps/activity missing -> `Chưa đồng bộ` hoặc label tương đương theo source hiện có.
- Không còn dash đơn độc ở các vị trí critical của tab Sức khỏe.

---

### H-06 — Replace current insight block with `Cần xử lý hôm nay`

Block insight hiện tại cần đổi thành health-coach action block.

**Required structure:**

```text
Cần xử lý hôm nay

1. Chất xơ rất thấp: 5 / 25g
   Thêm salad/rau xanh ở bữa tiếp theo.

2. Fat gần giới hạn: 67 / 70g
   Nếu ăn thêm, ưu tiên protein nạc, tránh đồ chiên/dầu.

3. Chưa log nước/ngủ/vận động
   Log nhanh để đánh giá chính xác hơn.
```

**Acceptance criteria:**

- Mỗi item có risk + action.
- Missing water/sleep/steps được gom thành một item riêng nếu cùng lúc thiếu nhiều nguồn.
- Không hiển thị quá nhiều item; ưu tiên top risks để giảm cognitive load.
- Copy ngắn, rõ, không tạo cảm giác phán xét.

---

### H-07 — Weekly nutrition summary must be readable, not compressed

Bỏ text nén kiểu:

```text
fiber thấp 4/4 · lệch nhất T5 28/5 · 1,560 kcal
```

Đổi thành chip hoặc dòng riêng dễ đọc.

**Required examples:**

```text
Thiếu TB: 417 kcal/ngày
Protein hụt: 4/4 ngày
Fiber thấp: 4/4 ngày
Lệch nhất: T5 28/5 · 1,560 kcal
```

Nếu đủ dữ liệu, thêm một câu trend interpretation:

```text
Xu hướng: ăn thiếu năng lượng và thiếu chất xơ lặp lại nhiều ngày.
```

**Acceptance criteria:**

- Weekly summary không còn một dòng quá nén gây khó hiểu.
- Các metric quan trọng được tách dòng/chip.
- Nếu dữ liệu không đủ, không cố tạo trend chắc chắn.

---

### H-08 — Next action must adapt to risk combination

`nextAction` không được generic. Nó phải phản ánh tổ hợp risk hiện tại.

**Examples:**

| Scenario | Required next action direction |
|---|---|
| Fiber thấp + fat gần giới hạn | Thêm rau/salad, ưu tiên protein nạc, tránh đồ chiên/dầu |
| Protein thiếu + kcal thiếu nhẹ | Ăn thêm protein nạc vừa đủ kcal |
| Kcal thiếu nhưng fat đã gần max | Không đề xuất món nhiều dầu/mỡ |
| Water/sleep/steps missing | Log/sync trước khi đánh giá đầy đủ |
| Không có risk lớn | Duy trì nhịp hiện tại |

**Acceptance criteria:**

- Không có action mâu thuẫn với risk.
- Nếu fat gần/vượt giới hạn, next action không được khuyến khích ăn thêm món nhiều fat.
- Nếu missing data nhiều, action phải nhắc log/sync để tăng độ tin cậy.

---

## 6. Layout/UI Requirements

### UI-01 — Preserve Opus Nexus design system

Giữ các rule hiện có:

- Dark OLED base.
- Blue active state.
- Semantic colors cho health status.
- SVG icons / icon system hiện có.
- Không thêm emoji/pictograph UI mới.
- Không đổi visual language của các tab khác.

### UI-02 — Improve visual hierarchy within Health tab

Order hiển thị nên theo logic:

```text
1. Diagnosis / hero status
2. Next action / cần xử lý hôm nay
3. Core nutrition metrics
4. Weekly summary / trend
5. Chart / deeper analytics
```

Không để chart hoặc analytics chiếm priority trước khi user hiểu tình trạng hôm nay.

### UI-03 — Add bottom spacing for chart/content

Scrollable content phải có bottom padding đủ để không bị bottom nav che.

**Acceptance criteria:**

```text
padding-bottom >= bottom nav height + 24px
```

Chart cuối tab Sức khỏe phải đọc được đầy đủ.

### UI-04 — Keep copy user-facing, not technical

Không expose internal enum/raw code trong UI.

**Examples:**

```text
fiber -> Chất xơ
kcal đốt -> kcal
undefined/null/NaN -> không được xuất hiện trong UI
```

---

## 7. Implementation Constraints

- File chính: `health-app/dashboard.html`.
- Single-file app vẫn được giữ.
- Không thêm package/dependency.
- Không đổi schema dữ liệu.
- Không thêm manual log form mới.
- CTA nếu có chỉ ở mức MVP nhẹ, ví dụ `Sync` cho dữ liệu có thể đồng bộ.
- Helper JS phải thuần, dễ test, không phụ thuộc DOM nếu chỉ tính insight.

---

## 8. Test Plan

### 8.1 Static validation

- Parse inline JS bằng `new Function(...)` phải pass.
- Scan `health-app/dashboard.html` không có emoji/pictograph UI mới.
- Không có text `undefined`, `null`, `NaN` xuất hiện trong rendered Health tab.
- Không có dash đơn độc cho water/sleep/steps critical state.

### 8.2 Scenario validation

#### Scenario A — Fiber thấp + fat gần giới hạn + protein thiếu

Expected:

- Fiber/fat/protein được ưu tiên trước kcal nếu nghiêm trọng hơn.
- `topSummary` nhắc risk chính.
- `nextAction` đề xuất rau/salad + protein nạc, tránh fat.

#### Scenario B — Kcal thiếu nhẹ

Expected:

- Kcal dùng warn/orange, không dùng red alarm.
- Summary không tạo cảm giác critical nếu chỉ thiếu nhẹ.

#### Scenario C — Water/sleep/steps missing

Expected:

- Hiển thị `Chưa log` hoặc `Chưa đồng bộ`.
- Missing data được gom thành một item trong `Cần xử lý hôm nay`.

#### Scenario D — Macro rows

Expected:

- Protein/Carb/Fat/Fiber đều hiển thị current/target.
- Remaining vẫn có thể hiển thị nhưng không thay thế target.

#### Scenario E — Weekly summary

Expected:

- Không còn text quá nén.
- Các dòng/chip như `Thiếu TB`, `Protein hụt`, `Fiber thấp`, `Lệch nhất` hiển thị dễ đọc.
- Có trend interpretation nếu đủ dữ liệu.

#### Scenario F — Bottom nav overlap

Expected:

- Chart cuối tab Sức khỏe không bị bottom nav che.
- Scroll tới cuối vẫn đọc được axis/label.

### 8.3 Regression validation

- Today không đổi behavior chính.
- Workout không đổi.
- Finance không đổi.
- Calendar không đổi.
- Approval không đổi.
- PAT/Sync không đổi.

---

## 9. Acceptance Checklist

- [ ] `buildHealthCoachInsight()` hoặc helper tương đương được thêm.
- [ ] `rankHealthRisks()` hoặc logic tương đương xếp priority đúng.
- [ ] Hero kcal có diagnosis.
- [ ] Kcal thiếu nhẹ không bị red alarm.
- [ ] Macro rows dùng current/target.
- [ ] Fiber/fat có warning rõ khi là risk thật.
- [ ] Water/sleep/steps không dùng dash đơn độc.
- [ ] `renderInsight()` được thay bằng block `Cần xử lý hôm nay` hoặc function mới tương đương.
- [ ] Missing logs được gom thành item riêng.
- [ ] Weekly nutrition summary được tách dòng/chip.
- [ ] Chart không bị bottom nav che.
- [ ] Không thêm schema/API/dependency/form mới.
- [ ] Không ảnh hưởng các tab ngoài Sức khỏe.

---

## 10. Definition of Done

Implementation được xem là hoàn thành khi:

1. Tab `Vita > Sức khỏe` thể hiện rõ diagnosis, priority và next action.
2. Các scenario test trong tài liệu này pass.
3. Static JS parse pass.
4. Không phát sinh regression ở Today, Workout, Finance, Calendar, Approval, PAT, Sync.
5. UI vẫn giữ đúng Opus Nexus design system.
6. Code vẫn nằm trong single-file app và không đổi data schema.
