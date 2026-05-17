# Architect của dự án N2 Content / Course MVP

## 0. Mục đích của tài liệu

Tài liệu này là bản **kiến trúc tổng thể** của project. Nó dùng để xác định:

1. Project đang có những tầng file/canvas nào.
2. File nào là source of truth.
3. Luồng làm việc từ business strategy đến sản xuất video/slide/worksheet.
4. Flow tối ưu hóa nội dung dự án.
5. Flow sản xuất đại trà sau khi sample đầu tiên ổn định.

Nguyên tắc chung:

> Không sản xuất nội dung rời rạc. Mọi nội dung phải đi qua hệ thống: Business → Framework → Sample → Production System → Output → Data → Optimization.

---

# 1. Nhận định chỉnh kiến trúc

Việc chuyển **Resource / Canva Boards** vào trong **Production System** là hợp lý hơn.

Lý do:

- Resource/Canva board không phải là tầng chiến lược độc lập.
- Nó là một phần của hệ thống sản xuất: template, brand kit, slide board, worksheet board, shorts board.
- Nếu để Resource thành một tầng riêng, kiến trúc dễ bị rời rạc giữa “method” và “production”.
- Khi đưa vào Production System, workflow rõ hơn: **method → resource/template → skeleton → final deck → output**.

Vì vậy kiến trúc mới sẽ gồm 5 tầng:

```text
Tầng 1: Business / Strategy
Tầng 2: Framework / Methodology
Tầng 3: Sample Lesson / Content Prototype
Tầng 4: Production System
Tầng 5: Distribution / Data / Optimization
```

Trong đó, **Resource / Canva Boards** sẽ nằm trong **Tầng 4: Production System**.

---

# 2. Cấu trúc phân tầng mới của project

```text
PROJECT: N2 CONTENT / COURSE MVP
│
├── TẦNG 1: BUSINESS / STRATEGY
│   │
│   └── Business Plan N2 MVP Clean
│       ├── Định vị kênh
│       ├── Target customer
│       ├── Monetization model
│       ├── Product ladder
│       ├── Roadmap 3 tháng
│       └── 3 View Grammar Coaching as differentiation
│
├── TẦNG 2: FRAMEWORK / METHODOLOGY
│   │
│   └── Framework Giao Án Video N2 MVP Clean
│       ├── Pain point 2 tầng
│       ├── 3 View: Meaning / Form / Usage
│       ├── Story concept
│       ├── Interactive exercises
│       ├── JLPT clue map
│       ├── Lời dẫn video
│       └── Checkpoint trước sản xuất
│
├── TẦNG 3: SAMPLE LESSON / CONTENT PROTOTYPE
│   │
│   └── Sample Giáo Án N2 – Week 2 Day 1
│       ├── Topic: かい・がい・てまで
│       ├── Source: Soumatome Week 2 Day 1
│       ├── Pain point riêng
│       ├── Story: Nam làm ở công ty Nhật
│       ├── Meaning View
│       ├── Form View
│       ├── Usage View
│       ├── Quiz / bài tập tương tác
│       ├── Lời dẫn video
│       ├── Worksheet draft
│       └── Shorts ideas
│
├── TẦNG 4: PRODUCTION SYSTEM
│   │
│   ├── 4.1 Resource / Asset System
│   │   │
│   │   └── Resource Canva Boards N2 MVP
│   │       ├── Brand Kit
│   │       ├── YouTube lesson template
│   │       ├── 3 View Grammar Card
│   │       ├── Quiz / Exercise Board
│   │       ├── JLPT Clue Map Board
│   │       ├── Worksheet Template
│   │       ├── Shorts/TikTok Template
│   │       └── Thumbnail / CTA Board
│   │
│   ├── 4.2 Slide Method / Guideline
│   │   ├── Phương châm làm slide
│   │   ├── Quy tắc ít chữ
│   │   ├── Quy tắc ruby/furigana
│   │   ├── Quy tắc highlight
│   │   ├── Slide role system
│   │   ├── Checklist trước khi design
│   │   └── Checklist map với sample
│   │
│   ├── 4.3 Slide Skeleton Text
│   │   ├── Slide number
│   │   ├── Slide role
│   │   ├── On-screen text
│   │   ├── Japanese text + ruby
│   │   ├── Visual idea
│   │   ├── Speaker cue
│   │   ├── Pause / Emphasis
│   │   └── Conversion purpose
│   │
│   ├── 4.4 Final Slide Deck
│   │   ├── PowerPoint / Canva-ready deck
│   │   ├── Visual layout
│   │   ├── Final slide text
│   │   ├── Quiz slides
│   │   ├── 3 View slides
│   │   ├── Clue map slides
│   │   ├── Recap slide
│   │   └── CTA slide
│   │
│   └── 4.5 Output Assets
│       ├── YouTube long-form video
│       ├── Shorts/TikTok scripts
│       ├── Worksheet PDF
│       ├── Thumbnail
│       ├── YouTube description
│       └── Lead magnet / CTA asset
│
└── TẦNG 5: DISTRIBUTION / DATA / OPTIMIZATION
    │
    ├── Publish & Distribution
    │   ├── YouTube
    │   ├── TikTok / Shorts / Reels
    │   ├── Facebook group / Zalo / Email
    │   └── Landing page / waitlist
    │
    ├── Data Tracking
    │   ├── Retention
    │   ├── CTR thumbnail
    │   ├── Comment / save / share
    │   ├── Worksheet download
    │   ├── Lead collected
    │   └── Waitlist / beta conversion
    │
    └── Optimization Loop
        ├── Feedback chuyên môn
        ├── Feedback người học
        ├── Update sample
        ├── Update framework nếu cần
        ├── Update production guideline nếu cần
        └── Chuẩn hóa rule mới
```

---

# 3. Vai trò của từng tầng

## Tầng 1: Business / Strategy

**File chính:** Business Plan N2 MVP Clean

Vai trò:

> Trả lời câu hỏi: dự án này bán cho ai, kiếm tiền như thế nào, khác biệt ở đâu.

Nội dung cốt lõi:

- Target chính: người học ở Việt Nam muốn đậu N2 nhưng cần giải thích dễ hiểu.
- Target phụ: người Việt ở Nhật cần N2 cho career/work/visa-related demand.
- Content umbrella: Tiếng Nhật – Nhật Bản – AI ứng dụng.
- Sản phẩm MVP: N2 Grammar Dễ Hiểu – 4 Tuần Nền Tảng.
- Điểm khác biệt: 3 View Grammar Coaching.

Tình trạng:

> Đã tương đối ổn. Không chỉnh lớn nếu chưa có thay đổi về offer, pricing, funnel hoặc positioning.

---

## Tầng 2: Framework / Methodology

**File chính:** Framework Giao Án Video N2 MVP Clean

Vai trò:

> Trả lời câu hỏi: mỗi bài N2 phải được thiết kế theo logic nào.

Nội dung cốt lõi:

- Pain point 2 tầng.
- 3 View: Meaning / Form / Usage.
- 3–4 mẫu chính/video.
- Mẫu gây nhiễu ngoài bài.
- Story concept.
- Interactive exercises.
- JLPT clue map.
- Checkpoint trước sản xuất.

Tình trạng:

> Là framework chính. Chỉ update sau khi hoàn thành sample thực tế và rút ra nguyên tắc mới.

---

## Tầng 3: Sample Lesson / Content Prototype

**File chính:** Sample Giáo Án N2 – Week 2 Day 1

Vai trò:

> Đây là bài mẫu thật để kiểm chứng framework trước khi sản xuất đại trà.

Nội dung hiện tại:

- Topic: かい・がい・てまで.
- Source: Soumatome Week 2 Day 1.
- Pain point riêng: nhầm “đáng công – đáng làm – làm đến mức đó”.
- Story: Nam làm ở công ty Nhật.
- Giải thích theo Meaning / Form / Usage.
- Có quiz, clue map, worksheet, shorts plan.

Tình trạng:

> Đang phát triển. Đây là nơi lắp thịt vào framework.

---

## Tầng 4: Production System

Vai trò:

> Biến sample giáo án thành bộ asset có thể xuất bản thật: slide, worksheet, video, shorts, thumbnail, CTA.

Tầng này bao gồm Resource/Canva Boards, Slide Method, Skeleton, Final Deck và output assets.

### 4.1 Resource / Asset System

**File chính:** Resource Canva Boards N2 MVP

Vai trò:

> Cung cấp template và asset để sản xuất nhanh, đồng bộ, không làm lại từ đầu mỗi lần.

Bao gồm:

- Brand Kit.
- YouTube lesson deck.
- 3 View Grammar Card.
- Quiz board.
- JLPT clue map.
- Worksheet template.
- Shorts/TikTok template.
- Thumbnail/CTA board.

### 4.2 Slide Method / Guideline

Vai trò:

> Luật viết slide cho mọi video.

Cần có:

- Phương châm làm slide.
- Slide role system.
- Quy tắc ít chữ.
- Quy tắc ruby/furigana.
- Quy tắc highlight.
- Cách map script sang slide.
- Checklist trước khi tạo skeleton.
- Checklist map với sample.

### 4.3 Slide Skeleton Text

Vai trò:

> Bản text trung gian map từng slide trước khi đưa vào Canva/PPT.

Format chuẩn:

```text
Slide 01
Role:
On-screen text:
Japanese text:
Ruby/Furigana:
Visual idea:
Speaker cue:
Pause/Emphasis:
Design note:
Source/Grammar point:
Conversion purpose:
```

### 4.4 Final Slide Deck

Vai trò:

> Slide deck cuối cùng để đưa vào Canva/PPT/video.

Nguyên tắc:

- Không thêm nội dung mới ngoài skeleton nếu chưa review.
- Không bê nguyên lời dẫn lên slide.
- Slide chỉ giữ keyword, ví dụ, quiz, bảng, clue, recap, CTA.

### 4.5 Output Assets

Vai trò:

> Các sản phẩm đầu ra dùng để đăng hoặc gom lead.

Bao gồm:

- YouTube video dài.
- Shorts/TikTok scripts.
- Worksheet PDF.
- Thumbnail.
- YouTube description.
- Lead magnet / CTA asset.

---

## Tầng 5: Distribution / Data / Optimization

Vai trò:

> Đưa nội dung ra thị trường, đo phản hồi và đưa dữ liệu ngược lại vào project.

Bao gồm:

- Publish YouTube/TikTok/Shorts.
- Gom lead qua worksheet/PDF/group/waitlist.
- Đo retention, CTR, comment, conversion.
- Phân tích feedback.
- Cập nhật sample/framework/resource nếu cần.

---

# 4. Luồng làm việc chuẩn sau khi chỉnh kiến trúc

```text
Business Plan
↓
Framework giáo án
↓
Sample lesson
↓
Production System
   ├── Resource / Canva Boards
   ├── Slide Method
   ├── Slide Skeleton Text
   ├── Final Slide Deck
   └── Output Assets
↓
Distribution / Data / Optimization
↓
Update ngược lại Framework / Sample / Production Guideline nếu cần
```

Ý nghĩa:

- Business Plan quyết định bán cho ai và khác biệt ở đâu.
- Framework quyết định cách dạy.
- Sample kiểm chứng framework.
- Production System biến sample thành tài sản có thể xuất bản.
- Distribution/Data cho biết nội dung có hiệu quả không.
- Optimization Loop đưa dữ liệu quay lại cải tiến hệ thống.

---

# 5. Flow 1 – Tối ưu hóa nội dung dự án

Flow này dùng sau mỗi sample hoặc sau khi có dữ liệu thật từ video.

## 5.1. Mục tiêu

Tối ưu framework, nội dung, slide và funnel dựa trên feedback thực tế, không tối ưu bằng cảm tính.

## 5.2. Flow tổng quát

```text
Sample / Video đã sản xuất
↓
Thu feedback & data
↓
Phân loại vấn đề
↓
Xác định tầng cần sửa
↓
Cập nhật file tương ứng
↓
Test lại ở sample tiếp theo
↓
Chuẩn hóa thành rule mới
```

## 5.3. Bước chi tiết

### Step 1: Thu feedback & data

Nguồn feedback:

- Góp ý chuyên môn của giáo viên.
- Comment người xem.
- Retention YouTube.
- Tỷ lệ click worksheet.
- Tỷ lệ comment “N2”.
- Feedback học viên beta.
- Cảm nhận khi quay/dựng video.

### Step 2: Phân loại vấn đề

Chia lỗi theo tầng:

| Vấn đề | Tầng cần xem |
|---|---|
| Nội dung không đúng target | Business Plan |
| Bài quá nặng/quá nhiều mẫu | Framework |
| Ví dụ chưa sát người học | Sample Lesson |
| Thiếu template/asset | Production System – Resource |
| Slide nhiều chữ/khó nhìn | Production System – Slide Method/Skeleton |
| Video không giữ retention | Script / Slide / Hook |
| Không gom được lead | CTA / Funnel / Distribution |

### Step 3: Xác định tầng cần sửa

Không sửa loạn nhiều file cùng lúc. Mỗi feedback phải được đưa về đúng tầng.

Ví dụ:

- Nếu người xem nói “bài khó quá” → xem lại Framework: có quá nhiều mẫu không?
- Nếu người xem nói “slide chữ nhiều” → sửa Slide Method/Skeleton.
- Nếu người xem nói “không hiểu かい vs がい” → sửa Sample Lesson và 3 View explanation.
- Nếu nhiều view nhưng ít lead → sửa CTA hoặc lead magnet trong Business/Funnel.

### Step 4: Cập nhật file tương ứng

Quy tắc cập nhật:

- Feedback chiến lược → Business Plan.
- Feedback phương pháp dạy → Framework.
- Feedback bài cụ thể → Sample Lesson.
- Feedback template/asset → Production Resource.
- Feedback slide → Slide Method/Skeleton.
- Feedback xuất bản → Distribution/CTA.

### Step 5: Test lại ở sample tiếp theo

Không cập nhật framework chỉ vì một cảm nhận nhỏ. Nên xác nhận bằng ít nhất một sample tiếp theo.

Nếu rule mới tiếp tục hiệu quả, đưa vào framework chính.

### Step 6: Chuẩn hóa thành rule mới

Ví dụ rule mới:

- Mỗi video không quá 4 mẫu chính.
- Quiz mở đầu phải có ruby cho kanji khó.
- Mỗi mẫu cần Meaning/Form/Usage.
- Cứ 2–3 phút phải có interaction hoặc visual shift.
- CTA worksheet phải xuất hiện ở cuối và mô tả video.

---

# 6. Flow 2 – Bước sản xuất đại trà

Flow này dùng khi sample đầu tiên đã ổn và muốn scale sang nhiều bài trong Soumatome.

## 6.1. Mục tiêu

Sản xuất hàng loạt video, slides, worksheets, shorts mà vẫn giữ chất lượng và consistency.

## 6.2. Điều kiện bắt đầu sản xuất đại trà

Chỉ scale khi có đủ:

1. Business Plan Clean ổn.
2. Framework Clean ổn.
3. Sample đầu tiên đã qua checkpoint.
4. Production Resource/Canva Boards đủ dùng.
5. Slide Method ổn.
6. Slide Skeleton Text chuẩn.
7. Final Slide Deck mẫu đã được review.
8. Có ít nhất một template worksheet.
9. Có ít nhất một template shorts.

Nếu chưa có các điều kiện này, không nên sản xuất hàng loạt.

## 6.3. Flow tổng quát

```text
Chọn nhóm bài trong Soumatome
↓
Map mẫu ngữ pháp
↓
Tách thành cụm video 3–4 mẫu
↓
Tạo brief cho từng video
↓
ChatGPT tạo giáo án nháp
↓
Giáo viên review 3 View + nuance
↓
Tạo Slide Skeleton Text
↓
Review skeleton
↓
Tạo Final Slide Deck bằng Resource/Canva Boards
↓
Tạo worksheet
↓
Tạo Shorts/TikTok scripts
↓
Quay / voice-over / edit
↓
Đăng video + CTA
↓
Thu data
↓
Tối ưu batch tiếp theo
```

## 6.4. Bước chi tiết

### Step 1: Chọn nhóm bài

Nguồn chính:

- Soumatome theo tuần/ngày.
- Index ngữ pháp.
- Practice exercise pages.

Nguyên tắc chọn:

- Ưu tiên nhóm mẫu dễ nhầm.
- Ưu tiên nhóm có thể gắn với story công việc/đời sống.
- Ưu tiên nhóm có nhu cầu tìm kiếm cao.

### Step 2: Map mẫu ngữ pháp

Với mỗi ngày/bài trong sách, tạo bảng:

| Mẫu | Meaning | Form | Usage | Dễ nhầm với | Có nên đưa vào cùng video không? |
|---|---|---|---|---|---|

### Step 3: Tách thành cụm video

Nguyên tắc:

- 3–4 mẫu chính/video.
- 2–3 mẫu ngoài bài để so sánh.
- Không ép toàn bộ một ngày trong sách thành một video nếu quá nặng.

### Step 4: Tạo brief cho từng video

Brief gồm:

- Tên video.
- Pain point tầng 2.
- Mẫu chính.
- Mẫu gây nhiễu.
- Story concept.
- Promise.
- CTA.

### Step 5: ChatGPT tạo giáo án nháp

ChatGPT tạo:

- Khung nội dung.
- Lời dẫn.
- Meaning/Form/Usage.
- Quiz.
- Clue map.
- Worksheet draft.
- Shorts ideas.

### Step 6: Giáo viên review

Giáo viên phải kiểm tra:

- Ý nghĩa có đúng không.
- Form có đúng không.
- Usage/nuance có tự nhiên không.
- Ví dụ tiếng Nhật có dùng được không.
- Có bám nguồn Soumatome không.
- Có phù hợp người Việt từ N3 lên N2 không.

### Step 7: Tạo Slide Skeleton Text

Không làm Canva ngay. Trước tiên phải có skeleton:

- Slide role.
- On-screen text.
- Japanese text + ruby.
- Visual idea.
- Speaker cue.
- Pause/Emphasis.
- Conversion purpose.

### Step 8: Review skeleton

Checkpoint:

- Slide có quá nhiều chữ không?
- Có đúng 3 View không?
- Có interaction không?
- Có clue map không?
- Có CTA không?
- Có ruby cho kanji khó không?

### Step 9: Tạo Final Slide Deck

Dựa trên skeleton đã review và Resource/Canva Boards.

Không thêm nội dung ngoài skeleton nếu chưa cần.

### Step 10: Tạo worksheet

Mỗi video cần worksheet gồm:

- Bảng 3 View.
- Clue map.
- Bài tập chọn đáp án.
- Bài tập sửa lỗi.
- Bài tập tự tạo câu.

### Step 11: Tạo Shorts/TikTok scripts

Mỗi video dài tách thành 3–5 shorts:

- 1 short pain point.
- 1 short comparison.
- 1 short quiz.
- 1 short workplace example.
- 1 short recap.

### Step 12: Quay / voice-over / edit

Quy tắc:

- Không nói đều đều.
- Dùng [NHẤN], [PAUSE], [ON SCREEN].
- Cứ 2–3 phút phải có visual shift hoặc bài tập.
- Giữ CTA rõ ở cuối.

### Step 13: Đăng và đo data

Theo dõi:

- Retention.
- CTR thumbnail.
- Comment.
- Save/share.
- Click worksheet.
- Lead.
- Topic nào có conversion tốt.

### Step 14: Tối ưu batch tiếp theo

Dữ liệu dùng để quyết định:

- Chủ đề nào nên làm tiếp.
- Hook nào hiệu quả.
- Slide nào cần rút gọn.
- CTA nào chuyển đổi tốt.
- Mẫu nào nên đưa vào khóa beta.

---

# 7. To-do theo từng tầng

| Tầng | File | Việc cần làm tiếp |
|---|---|---|
| 1 | Business Plan N2 MVP Clean | Tạm ổn, không chỉnh lớn nữa |
| 2 | Framework Giao Án Video N2 MVP Clean | Chỉ update sau sample đầu tiên |
| 3 | Sample Giáo Án N2 Week 2 Day 1 | Tiếp tục refine nội dung/lời dẫn nếu cần |
| 4.1 | Resource Canva Boards N2 MVP | Bổ sung Brand Kit chi tiết sau |
| 4.2 | Slide Method / Guideline | Làm hoàn chỉnh trước |
| 4.3 | Slide Skeleton Text | Tạo sau khi File 1 ổn |
| 4.4 | Final Slide Deck | Tạo cuối cùng, dựa trên skeleton |
| 5 | Distribution/Data/Optimization | Chưa làm cho đến khi có output đầu tiên |

---

# 8. Next Action

Thứ tự làm tiếp:

```text
1. Hoàn chỉnh File 1 – Slide Method / Guideline
2. Tạo File 2 – Slide Skeleton Text cho video かい・がい・てまで
3. Review skeleton
4. Tạo File 3 – Final Slide Deck bằng Resource/Canva Boards
5. Dùng slide deck để sản xuất video mẫu
6. Thu feedback
7. Cập nhật framework nếu cần
8. Bắt đầu sản xuất batch tiếp theo
```

Kết luận:

> Cấu trúc mới hợp lý hơn vì Resource/Canva Boards là một phần của Production System. Business và Framework giữ vai trò định hướng; Sample là nơi kiểm chứng; Production System là nơi biến sample thành tài sản xuất bản; Distribution/Data là nơi tối ưu và scale.

