# Multi-Agent Flow – Tự động tạo slide N2 MVP

## 0. Mục đích

Tài liệu này thiết kế một flow tự động hóa sản xuất slide/video lesson bằng multi-agent, trong đó:

```text
Claude = Planner / Instruction Architect
Gemini = Design Generator / Visual Producer
ChatGPT = Reviewer / QA / Optimization Coach
```

Mục tiêu của flow:

1. Biến giáo án N2 thành slide skeleton rõ ràng.
2. Tự động tạo direction thiết kế cho Canva/slide.
3. Review chất lượng học thuật, visual, funnel trước khi xuất bản.
4. Giảm thời gian sản xuất đại trà nhưng vẫn giữ chất lượng chuyên môn.

Flow này nằm trong kiến trúc project ở:

```text
Tầng 4: Production System
└── Multi-Agent Production Flow
```

---

# 1. Vai trò từng agent

## 1.1. Claude – Planner / Lesson-to-Slide Architect

Claude đóng vai trò **người lên kế hoạch**.

Nhiệm vụ chính:

- Đọc giáo án/sample lesson.
- Tách nội dung thành video beats.
- Quyết định slide count.
- Gán role cho từng slide.
- Viết slide skeleton text.
- Viết instruction rõ cho design agent.
- Đảm bảo slide bám framework: pain point, story, 3 View, quiz, clue map, CTA.

Claude không cần làm đẹp slide. Claude phải làm rõ:

> Slide này dùng để làm gì, cần hiện text gì, visual nên đi hướng nào, giáo viên cần nhấn/dừng ở đâu.

Output chính của Claude:

```text
File 2 – Slide Skeleton Text
Design Brief cho Gemini
Production Notes
```

---

## 1.2. Gemini – Design Generator / Visual Producer

Gemini đóng vai trò **người tạo thiết kế**.

Nhiệm vụ chính:

- Nhận Slide Skeleton Text từ Claude.
- Tạo layout visual cho từng slide.
- Đề xuất style hình ảnh, icon, màu, hierarchy chữ.
- Tạo prompt hoặc instruction để đưa vào Canva/Google Slides/PPT.
- Tạo bản slide visual-first, ít chữ.
- Đảm bảo slide không bê nguyên giáo án.

Gemini không được tự ý đổi logic bài học. Gemini chỉ được chuyển skeleton thành thiết kế.

Output chính của Gemini:

```text
Design Direction
Slide Layout Plan
Canva/Google Slides Prompt
Visual Asset List
Final Slide Draft
```

---

## 1.3. ChatGPT – Reviewer / QA / Optimization Coach

ChatGPT đóng vai trò **người review cuối**.

Nhiệm vụ chính:

- Review slide so với framework project.
- Kiểm tra slide có bám sample không.
- Kiểm tra 3 View: Meaning/Form/Usage.
- Kiểm tra ruby/furigana.
- Kiểm tra slide có quá nhiều chữ không.
- Kiểm tra nhịp video: hook, pause, practice, recap, CTA.
- Kiểm tra business/funnel: CTA, worksheet, lead magnet.
- Đề xuất sửa trước khi publish.

ChatGPT là QA gate trước khi slide được dùng quay video.

Output chính của ChatGPT:

```text
Review Report
Pass/Revise Decision
Fix List
Final Production Checklist
```

---

# 2. Nguyên tắc phân quyền

## 2.1. Không để agent làm chồng vai trò

| Agent | Được làm | Không nên làm |
|---|---|---|
| Claude | Plan, skeleton, instruction | Design chi tiết, quyết định visual cuối |
| Gemini | Visual design, layout, Canva prompt | Thay đổi nội dung ngữ pháp |
| ChatGPT | Review, QA, tối ưu | Tự ý redesign từ đầu nếu không cần |

## 2.2. Source of truth

Source of truth theo thứ tự:

```text
1. Business Plan Clean
2. Framework Clean
3. Sample Lesson
4. File 1 – Slide Method / Guideline
5. File 2 – Slide Skeleton Text
6. Final Slide Draft
```

Nếu Gemini tạo slide khác skeleton, ChatGPT phải bắt lỗi.

Nếu Claude viết skeleton lệch framework, ChatGPT phải bắt lỗi.

Nếu sample lesson chưa rõ, quay lại sample trước, không ép production.

---

# 3. Flow tổng quát

```text
Input: Sample Lesson + Framework + Slide Method
↓
Claude: tạo Slide Skeleton Text + Design Brief
↓
Gemini: tạo Design Direction + Slide Draft
↓
ChatGPT: review học thuật + visual + funnel
↓
Nếu chưa đạt: gửi Fix List về Claude/Gemini
↓
Gemini chỉnh slide
↓
ChatGPT review lần cuối
↓
Output: Final Slide Deck + Worksheet/Shorts notes
```

---

# 4. Flow chi tiết từng bước

## Step 1: Chuẩn bị input

Input cần có:

1. Sample lesson đã qua checkpoint.
2. Slide Method / Guideline.
3. Brand/resource board nếu có.
4. Yêu cầu output: số slide, format, CTA.

Ví dụ input cho bài hiện tại:

```text
Video: N2 かい・がい・てまで
Slide count: 18 slides
Output: Canva/PPT-ready skeleton + visual direction
CTA: Comment “N2” để nhận worksheet
Style: dễ hiểu, gọn, có story công ty Nhật
```

---

## Step 2: Claude tạo kế hoạch slide

Claude nhận input và tạo:

```text
1. Slide list
2. Slide role
3. On-screen text
4. Japanese text + ruby
5. Visual idea
6. Speaker cue
7. Pause/emphasis
8. Design instruction cho Gemini
```

Claude phải kiểm tra:

- Có warm-up trước quiz không?
- Có hook trong 60 giây đầu không?
- Có đủ Meaning/Form/Usage không?
- Có clue map không?
- Có practice không?
- Có recap và CTA không?

### Prompt mẫu cho Claude

```text
Bạn là Planner / Lesson-to-Slide Architect cho một khóa học JLPT N2 cho người Việt.

Nhiệm vụ của bạn là chuyển sample lesson dưới đây thành Slide Skeleton Text, chưa cần thiết kế đẹp.

Yêu cầu:
1. Dùng cấu trúc 18 slide.
2. Mỗi slide phải có role rõ.
3. Mỗi slide có: On-screen text, Japanese text, ruby/furigana nếu cần, visual idea, speaker cue, pause/emphasis, design note, source/grammar point, conversion purpose.
4. Không bê nguyên lời dẫn lên slide.
5. Slide phải bám 3 View: Meaning / Form / Usage.
6. Có warm-up, hook quiz, story, comparison, clue map, practice, recap, CTA.
7. Slide phải phù hợp để Gemini tạo design tiếp.

Input:
[PASTE SAMPLE LESSON]
[PASTE SLIDE METHOD GUIDELINE]
```

---

## Step 3: Gemini tạo design direction

Gemini nhận skeleton và tạo:

```text
1. Overall visual style
2. Color/font/layout suggestion
3. Slide-by-slide layout
4. Visual asset list
5. Canva prompt hoặc slide generation prompt
```

Gemini cần giữ nguyên nội dung cốt lõi từ Claude.

### Prompt mẫu cho Gemini

```text
Bạn là Design Generator cho một video lesson JLPT N2.

Nhiệm vụ của bạn là chuyển Slide Skeleton Text dưới đây thành visual design direction để tạo slide trong Canva/Google Slides/PPT.

Yêu cầu:
1. Không thay đổi nội dung ngữ pháp.
2. Không thêm nội dung mới nếu skeleton không yêu cầu.
3. Thiết kế visual-first, ít chữ, dễ đọc trên video YouTube.
4. Mỗi slide cần có layout cụ thể: title area, Japanese sentence area, visual area, highlight area.
5. Giữ ruby/furigana cho kanji khó.
6. Tạo style nhất quán cho 3 View: Meaning / Form / Usage.
7. Tạo visual cho nhân vật Nam làm ở công ty Nhật.
8. CTA cuối phải rõ.

Output cần có:
- Overall design direction
- Slide-by-slide design instruction
- Asset list
- Canva prompt nếu có thể

Input:
[PASTE SLIDE SKELETON TEXT]
```

---

## Step 4: Gemini tạo slide draft

Có 2 cách triển khai:

### Option A – Manual Canva workflow

Gemini tạo design instruction, người làm slide dùng Canva dựng thủ công.

Ưu điểm:

- Kiểm soát cao.
- Dễ chỉnh style.
- Phù hợp giai đoạn MVP.

Nhược điểm:

- Tốn thời gian hơn.

### Option B – Semi-auto slide generation

Gemini tạo prompt/design spec để đưa vào công cụ tạo slide.

Ưu điểm:

- Nhanh hơn.
- Có thể scale.

Nhược điểm:

- Cần review kỹ vì AI có thể thêm/sửa nội dung ngoài ý muốn.

Khuyến nghị hiện tại:

```text
MVP nên dùng Option A hoặc hybrid:
Gemini tạo design direction → người/AI dựng slide → ChatGPT review
```

---

## Step 5: ChatGPT review slide draft

ChatGPT review theo 4 lớp:

```text
1. Content Accuracy
2. Pedagogy / Learning Flow
3. Visual / Slide Quality
4. Funnel / Conversion
```

### 5.1. Content Accuracy

Kiểm tra:

- Ví dụ tiếng Nhật có tự nhiên không?
- Form có đúng không?
- Meaning có đúng không?
- Usage/nuance có bị lệch không?
- Ruby/furigana có sai không?

### 5.2. Pedagogy / Learning Flow

Kiểm tra:

- Có warm-up trước quiz không?
- Hook có dễ hiểu không?
- Có đủ story không?
- 3 View có rõ không?
- Comparison có giải quyết pain point không?
- Practice có tương tác không?

### 5.3. Visual / Slide Quality

Kiểm tra:

- Slide có quá nhiều chữ không?
- Hierarchy rõ không?
- Highlight đúng phần cần học không?
- Ruby có làm rối slide không?
- Bảng có đọc được trên video không?

### 5.4. Funnel / Conversion

Kiểm tra:

- CTA có rõ không?
- Worksheet có được nhắc đúng lúc không?
- Có comment trigger không?
- Recap có dễ screenshot không?

### Prompt mẫu cho ChatGPT Review

```text
Bạn là Reviewer / QA cho slide lesson JLPT N2.

Hãy review slide draft dưới đây dựa trên framework project:
- Pain point 2 tầng
- 3 View Grammar Coaching: Meaning / Form / Usage
- Slide Method / Guideline
- Mục tiêu video 12–15 phút
- CTA gom lead bằng worksheet

Yêu cầu review theo 4 lớp:
1. Content Accuracy
2. Pedagogy / Learning Flow
3. Visual / Slide Quality
4. Funnel / Conversion

Output:
- Pass/Revise decision
- Top issues
- Fix list theo slide
- Final recommendation

Input:
[PASTE SLIDE DRAFT OR DESCRIPTION]
```

---

# 5. Review gate

## 5.1. Gate 1 – Skeleton Gate

Reviewer: ChatGPT hoặc giáo viên.

Skeleton chỉ được chuyển sang design nếu:

- Có đủ 18 slide production version.
- Có slide role rõ.
- Có 3 View.
- Có practice.
- Có clue map.
- Có CTA.
- Không quá nhiều chữ.

## 5.2. Gate 2 – Design Gate

Reviewer: ChatGPT.

Slide design chỉ được dùng quay video nếu:

- Đúng skeleton.
- Visual không làm sai nghĩa.
- Text đọc được trên video.
- Japanese/ruby đúng.
- Highlight đúng.
- CTA rõ.

## 5.3. Gate 3 – Publishing Gate

Reviewer: giáo viên + ChatGPT.

Trước khi publish:

- Script khớp slide.
- Slide khớp worksheet.
- CTA khớp link/form.
- Shorts có thể cắt ra được.
- Thumbnail/title khớp nội dung.

---

# 6. Feedback loop giữa các agent

## 6.1. Nếu ChatGPT phát hiện lỗi nội dung

Gửi về Claude để sửa skeleton.

Ví dụ lỗi:

- Form sai.
- Usage giải thích lệch.
- Thiếu practice.
- Pain point không rõ.

Flow:

```text
ChatGPT Review → Fix List → Claude revise skeleton → Gemini update design
```

## 6.2. Nếu ChatGPT phát hiện lỗi visual

Gửi về Gemini.

Ví dụ lỗi:

- Slide quá nhiều chữ.
- Visual không phù hợp.
- Highlight sai.
- Layout khó đọc.

Flow:

```text
ChatGPT Review → Visual Fix List → Gemini revise design
```

## 6.3. Nếu lỗi đến từ chiến lược bài

Quay lại Sample Lesson hoặc Framework.

Ví dụ:

- Bài ôm quá nhiều mẫu.
- Story không sát target.
- CTA không hợp funnel.

Flow:

```text
ChatGPT Review → Project Owner quyết định → update Sample/Framework → Claude tạo lại skeleton
```

---

# 7. File/output của từng agent

| Step | Agent | Output | File tương ứng |
|---|---|---|---|
| Plan | Claude | Slide Skeleton Text | File 2 |
| Design | Gemini | Design Direction / Draft Slide | File 3 draft |
| Review | ChatGPT | Review Report / Fix List | Review log |
| Revise | Claude/Gemini | Revised Skeleton / Revised Design | File 2/3 updated |
| Final QA | ChatGPT | Pass decision | Production checklist |

---

# 8. Multi-agent flow cho bài かい・がい・てまで

## Input hiện tại

Đã có:

- Business Plan Clean.
- Framework Clean.
- Sample lesson かい・がい・てまで.
- File 1 – Slide Method / Guideline.
- File 2 – Slide Skeleton Text đã pass review.

## Flow tiếp theo

```text
File 2 Skeleton đã pass
↓
Gemini tạo Design Direction cho 18 slide
↓
Tạo Final Slide Draft
↓
ChatGPT review slide draft
↓
Gemini chỉnh theo review
↓
ChatGPT final QA
↓
Xuất Final Slide Deck
```

## Lưu ý riêng cho bài này

1. Dùng production version 18 slide.
2. Không thêm slide riêng cho **だけのことはある**.
3. Giữ ruby cho kanji khó ở quiz/ví dụ chính.
4. Story slide cần visual Nam ở công ty Nhật.
5. 3 View slide phải reusable.
6. Practice slide nên có reveal hoặc tách question/answer nếu không dùng animation.
7. CTA worksheet ở cuối phải rõ.

---

# 9. Review report template cho ChatGPT

Khi ChatGPT review output của Gemini, dùng format này:

```text
# Review Report – Slide Deck [Tên video]

## 1. Decision
Pass / Revise / Block

## 2. Overall Assessment
[Đánh giá tổng quan]

## 3. Content Accuracy
- Issue:
- Fix:

## 4. Pedagogy / Learning Flow
- Issue:
- Fix:

## 5. Visual / Slide Quality
- Issue:
- Fix:

## 6. Funnel / Conversion
- Issue:
- Fix:

## 7. Slide-by-slide Fix List
| Slide | Issue | Fix Priority | Suggested Fix |
|---|---|---|---|

## 8. Final Recommendation
[Chốt bước tiếp theo]
```

---

# 10. Checklist automation-ready

Trước khi coi flow này là automation-ready, cần có:

- [ ] Prompt chuẩn cho Claude.
- [ ] Prompt chuẩn cho Gemini.
- [ ] Prompt chuẩn cho ChatGPT review.
- [ ] File naming convention.
- [ ] Versioning convention.
- [ ] Review gate rõ.
- [ ] Checklist pass/fail.
- [ ] Quy định khi nào quay lại sửa sample/framework.
- [ ] Template output cho mỗi agent.

---

# 11. File naming convention đề xuất

```text
01_strategy_business_plan_clean
02_framework_lesson_method_clean
03_sample_[topic]_lesson
04_production_slide_method
05_skeleton_[topic]_v1
06_design_brief_[topic]_v1
07_slide_deck_[topic]_draft_v1
08_review_report_[topic]_v1
09_slide_deck_[topic]_final_v1
```

Ví dụ:

```text
05_skeleton_kai_gai_temade_v1
06_design_brief_kai_gai_temade_v1
07_slide_deck_kai_gai_temade_draft_v1
08_review_report_kai_gai_temade_v1
09_slide_deck_kai_gai_temade_final_v1
```

---

# 12. Kết luận

Flow multi-agent đề xuất là:

```text
Claude = lập kế hoạch / tạo skeleton
Gemini = tạo design / dựng slide draft
ChatGPT = review / QA / tối ưu
```

Đây là cấu trúc hợp lý vì mỗi agent có một vai trò rõ:

- Claude mạnh ở planning, reasoning dài, cấu trúc hóa nội dung.
- Gemini phù hợp cho visual/design direction và tích hợp hệ sinh thái Google/Canva workflow.
- ChatGPT giữ vai trò reviewer, kiểm soát framework, nuance, slide quality và funnel.

Bước tiếp theo nên là:

```text
Tạo Design Brief cho Gemini dựa trên File 2 Skeleton 18 slide
```

Sau khi Gemini tạo draft, ChatGPT sẽ review theo Review Report Template ở trên.

