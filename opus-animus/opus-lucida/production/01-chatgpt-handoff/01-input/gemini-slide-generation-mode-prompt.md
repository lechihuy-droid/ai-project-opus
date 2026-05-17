# Gemini Prompt - Slide Generation Mode
**Status:** Ready to copy
**Use case:** Use with Gemini app / Gemini Advanced / Gemini Canvas to regenerate the first 6 visual slides
**Recommended uploads:** PPTX + PDF + slide deck spec

---

## Upload These 3 Files

Use this order if Gemini lets you upload multiple files:

```text
1. Wake_Logic_Blueprints.pptx
   Role: editable/source attempt from Gemini, used as current design reference.

2. Wake_Logic_Blueprints.pdf
   Role: visual reference, used to preserve the dark blueprint style.

3. production/00-active/wake-cluster/03-slide-deck.md
   Role: content truth for slide intent, on-screen text, and teaching checks.
```

If Gemini only allows 2 uploads:

```text
Upload:
1. Wake_Logic_Blueprints.pdf
2. production/00-active/wake-cluster/03-slide-deck.md

Then paste the prompt below.
```

If Gemini does not accept `.md`:

```text
Open production/00-active/wake-cluster/03-slide-deck.md
Copy only Slide 01-05 section
Paste it under the prompt manually
```

---

## Copy This Prompt To Gemini

```text
You are now in SLIDE GENERATION MODE.

Do not summarize my feedback.
Do not wait for more feedback.
Do not ask me whether to continue.

Please regenerate the revised first section of my slide deck now.

I uploaded:
1. Current PPTX / source attempt
2. Current PDF / visual reference
3. Slide deck spec / content truth

Your task:
Create a revised 6-slide section for a YouTube JLPT N2 lesson.

Topic:
わけだ・わけではない・わけがない・わけにはいかない

Audience:
Vietnamese learners around late N3 / early N2.

Style to preserve:
- dark logic blueprint
- cinematic Japanese lesson
- large readable Japanese text
- high contrast
- clear blue/yellow color coding for the two hook patterns
- clean educational flow
- minimal text
- one slide = one job

Output:
Generate 6 slides total:

1. Slide 1 - Opening Contrast
2. Slide 2A - Hook Quiz Before Reveal
3. Slide 2B - Hook Answer Reveal
4. Slide 3 - Four Logic Map
5. Slide 4 - Story Context
6. Slide 5 - Nghia - Hinh - Dung

If you can export PPTX:
- keep text editable if possible
- do not flatten every slide into one bitmap image if possible

If you cannot export editable PPTX:
- export high-resolution visual slides
- no watermark
- keep all text sharp and readable

Important:
No NotebookLM / tool watermark.
No source footer.
No generic corporate template.

---

GLOBAL TERMINOLOGY

Use these learner-facing terms:

- 3 cách nhìn
- Ý nghĩa - Dạng - Cách dùng
- Dấu hiệu chọn mẫu
- Mạch logic của câu nói

Use these grammar labels:

- わけだ = kết luận hợp lý
- わけではない = không phải là... / không có nghĩa là...
- わけがない = bác bỏ khả năng mạnh
- わけにはいかない = ràng buộc nên không thể làm

Do not use:

- "Bác bỏ cực mạnh"
- "Rủ Nomikai"
- "< Góc nhìn 3 chiều >"

---

SLIDE 1 - OPENING CONTRAST

Purpose:
Create a strong first 3-second hook.

Main Japanese:

行きたくないわけではありません。
今日は行くわけにはいきません。

Vietnamese subtitles:

Không phải là tôi không muốn đi
Hôm nay tôi không thể đi

Add bottom line:

Cùng có わけ, nhưng khác mạch logic

Design:
- keep side-by-side contrast
- blue highlight for わけではありません
- yellow highlight for わけにはいきません
- Japanese must be the hero
- Vietnamese subtitles readable but secondary

---

SLIDE 2A - HOOK QUIZ BEFORE REVEAL

Purpose:
Let the viewer pause for 3 seconds and choose.

Title/cue:

Dừng 3 giây và chọn thử

Quiz:

行きたくない＿＿ありません。
でも、今日は行く＿＿いきません。

Options:

A. わけでは / わけには
B. わけが / わけでは
C. わけだ / わけが

Design:
- show blanks clearly
- include a small 3s timer cue
- do not show the answer
- keep dark blueprint style

---

SLIDE 2B - HOOK ANSWER REVEAL

Purpose:
Reveal answer and attach two color-coded meanings.

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

Design:
- keep blue/yellow mapping from Slide 1
- make this clearly an answer reveal slide
- no extra explanation beyond the two mappings

---

SLIDE 3 - FOUR LOGIC MAP

Purpose:
Show that 4 patterns are 4 different logic paths.

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

Design:
- keep the network / blueprint connection motif
- title large but not crushing the map
- each box readable
- do not use "Bác bỏ cực mạnh"

---

SLIDE 4 - STORY CONTEXT

Purpose:
Set up the story for the grammar explanation.

Visual story:

Công ty -> Rủ đi 飲み会 -> Deadline

Text:

Công ty
Rủ đi 飲み会
Deadline

Bubble:

Muốn đi...
nhưng không thể.

Design:
- keep icons
- keep red deadline tension
- make the bubble visible
- story must be readable in 3 seconds
- do not use "Rủ Nomikai"

---

SLIDE 5 - NGHIA - HINH - DUNG

Purpose:
Introduce Lucida teaching method.

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

Design:
- keep 3 vertical columns
- keep icons if possible
- make it feel like a reusable Lucida method slide
- avoid technical/code-like title styling

---

FINAL CHECK BEFORE OUTPUT

Before exporting, check:

1. Does Slide 2A hide the answer?
2. Does Slide 2B reveal the answer clearly?
3. Does Slide 3 say "Bác bỏ khả năng mạnh"?
4. Does Slide 4 say "Rủ đi 飲み会"?
5. Does Slide 5 say "Ý nghĩa - Dạng - Cách dùng"?
6. Is there any watermark? If yes, remove it.
7. Is the Vietnamese subtitle readable on dark background?
8. Is the PPTX editable if possible?

Now generate the revised 6-slide section.
```

---

## One-line Recovery Prompt

If Gemini starts summarizing instead of generating, send:

```text
Do not summarize. Please generate the revised 6 slides now, using the uploaded files as reference.
```

