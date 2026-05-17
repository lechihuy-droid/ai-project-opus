# Gemini Prompt - Revise First 5 Slides Short Version
**Status:** Ready to copy
**Use case:** Short prompt for Gemini / slide generation tool

---

## Copy This Prompt

```text
You are a presentation designer. Please revise/regenerate my first section of slides for a YouTube JLPT N2 lesson.

Topic:
わけだ・わけではない・わけがない・わけにはいかない

Audience:
Vietnamese learners around late N3 / early N2.

Visual style to keep:
- dark logic blueprint
- cinematic Japanese lesson
- large readable Japanese text
- strong color coding
- minimal text
- one slide = one job
- no watermark

Important output:
Create 6 slides total:
1. Slide 1 - Opening Contrast
2. Slide 2A - Hook Quiz Before Reveal
3. Slide 2B - Hook Answer Reveal
4. Slide 3 - Four Logic Map
5. Slide 4 - Story Context
6. Slide 5 - Nghia - Hinh - Dung

If exporting PPTX, keep text editable if possible. Do not flatten every slide into one image if possible.

---

Slide 1 - Opening Contrast

Main Japanese:
行きたくないわけではありません。
今日は行くわけにはいきません。

Vietnamese subtitles:
Không phải là tôi không muốn đi
Hôm nay tôi không thể đi

Add small bottom line:
Cùng có わけ, nhưng khác mạch logic

Keep blue/yellow contrast between the two patterns.

---

Slide 2A - Hook Quiz Before Reveal

Title/cue:
Dừng 3 giây và chọn thử

Quiz:
行きたくない＿＿ありません。
でも、今日は行く＿＿いきません。

Options:
A. わけでは / わけには
B. わけが / わけでは
C. わけだ / わけが

Important:
Do NOT reveal the answer on this slide.
Add a small 3s timer cue.

---

Slide 2B - Hook Answer Reveal

Main message:
Đáp án A

Pattern 1:
わけではない
= Không phải là...
= Sửa hiểu nhầm

Pattern 2:
わけにはいかない
= Không thể...
= Bị ràng buộc

Keep blue/yellow color mapping from Slide 1.

---

Slide 3 - Four Logic Map

Title:
4 mẫu わけ = 4 mạch logic

Four boxes:
わけだ
(Kết luận hợp lý)

わけではない
(Phủ định nhận định)

わけがない
(Bác bỏ khả năng mạnh)

わけにはいかない
(Ràng buộc hành động)

Keep the blueprint/network motif.
Do NOT use "Bác bỏ cực mạnh".

---

Slide 4 - Story Context

Show this story visually:
Công ty -> Rủ đi 飲み会 -> Deadline

Text:
Công ty
Rủ đi 飲み会
Deadline

Make this bubble visible:
Muốn đi...
nhưng không thể.

Do NOT use "Rủ Nomikai".
Keep icons and red deadline tension.

---

Slide 5 - Nghia - Hinh - Dung

Title:
Ý nghĩa - Dạng - Cách dùng

Three columns:

NGHĨA
Mẫu này nói ý gì?

HÌNH
Nối với dạng nào?

DỤNG
Dùng khi nào?
Sắc thái ra sao?

Keep the 3-column structure and icons.
Avoid the title "< Góc nhìn 3 chiều >".

---

Final requirement:
Return the regenerated slides as a PPTX if possible.
If PPTX is not possible, return high-resolution slide images with no watermark.
```

---

## If The Tool Refuses

Use this shorter command first:

```text
I want you to generate slide content and visual layout, not answer a factual question. Please create the revised 6-slide deck based on the instructions below.
```

Then paste the prompt above.

