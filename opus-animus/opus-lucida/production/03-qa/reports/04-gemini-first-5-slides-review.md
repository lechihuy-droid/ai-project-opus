# Gemini First 5 Slides Review - Wake Cluster
**Status:** Reviewed
**Source PPTX:** `C:\Users\HUY\Downloads\Wake_Logic_Blueprints.pptx`
**Source PDF:** `C:\Users\HUY\Downloads\Wake_Logic_Blueprints.pdf`
**Reviewed slides:** 1-5
**Date:** 2026-04-30

---

## Overall Verdict

**Pass with revisions.**

The visual direction is strong for a public YouTube lesson: dark blueprint look, clear contrast colors, big Japanese text, and a consistent "logic map" feeling. It is much better than a generic teaching deck.

However, the PPTX is image-only: each slide is one bitmap picture, with no editable text layer. That is the biggest production issue. It is fine for quick preview, but not ideal for final slide production because text, layout, and timing cannot be easily edited in PowerPoint.

---

## Technical Finding

### Major - PPTX is not editable

Each slide contains only one picture shape.

Impact:

- text cannot be edited directly;
- animation / reveal states cannot be controlled cleanly;
- typo fixes require regenerating the whole slide;
- future localization or template reuse is harder.

Recommendation for Gemini:

Ask Gemini to output editable slide specs or keep text as separate editable layers if possible. If Gemini cannot do that, use it as visual concept only, then rebuild the final deck in PPT/Canva manually.

---

## Slide-by-slide Review

### Slide 1 - Opening Contrast

What works:

- Very strong hook visual.
- The two-sentence contrast is clear.
- Color coding blue/yellow helps distinguish two patterns.
- Japanese text is large and readable.

Issues:

- Good as visual, but it omits the meta message "same わけ, different logic" on screen.
- The Vietnamese translation is slightly low contrast and small.

Suggested improvement:

Add a small but clear bottom line:

```text
Cung co わけ, nhung khac mach logic
```

Keep the Japanese as the hero.

---

### Slide 2 - Hook Payoff

What works:

- Clean answer reveal.
- The two pattern labels are readable.
- Color mapping continues from Slide 1.

Issues:

- This is a reveal slide, not a quiz slide.
- If used immediately after Slide 1, the viewer does not get a real 3-second choice moment.
- The timer icon says `3s` but the slide already shows the answer.

Suggested improvement:

Generate two states:

```text
Slide 02A - Quiz before reveal
Slide 02B - Answer reveal
```

Before reveal should show only blanks and A/B/C.

After reveal can show the current layout.

---

### Slide 3 - Four Logic Map

What works:

- Strong title and memorable visual.
- The "blueprint" network motif fits the lesson.
- Four boxes make the cluster feel systematic.

Issues:

- `Bac bo cuc manh` is a bit too colloquial and less precise.
- Better wording is `Bac bo kha nang manh`.
- The title is very large; it works visually, but leaves less breathing room for the map.

Suggested improvement:

Use:

```text
わけがない
(Bac bo kha nang manh)
```

Optionally change title to:

```text
4 mau わけ = 4 mach logic
```

---

### Slide 4 - Story Context

What works:

- Visual storytelling is good: company -> nomikai -> deadline.
- Icons make the situation easy to grasp.
- The red deadline path creates tension.

Issues:

- `Ru Nomikai` is a bit unnatural in Vietnamese.
- Better phrase: `Ru di nomikai` or `Ru di 飲み会`.
- The small bubble `Muon di... nhung khong the.` is low contrast and easy to miss.

Suggested improvement:

Use:

```text
Ru di 飲み会
```

Make the bubble more prominent:

```text
Muon di...
nhung khong the.
```

This bubble is the bridge into `わけにはいかない`, so it should not be too quiet.

---

### Slide 5 - Nghia - Hinh - Dung

What works:

- Clean 3-column structure.
- The icons help memory.
- This is a good recurring Lucida method slide.

Issues:

- Title `< Goc nhin 3 chieu >` feels technical/code-like and less aligned with the new terminology.
- We already decided the learner-facing term should be `3 cach nhin` or `Nghia - Hinh - Dung`.
- The subtitle under `Hinh` should be `Noi voi dang nao?` or `Cau truc noi the nao?`; current phrasing is acceptable but can be clearer.

Suggested improvement:

Change title to:

```text
3 cach nhin
```

or:

```text
Nghia - Hinh - Dung
```

Keep the three columns:

```text
NGHIA
Mau nay noi y gi?

HINH
Noi voi dang nao?

DUNG
Dung khi nao?
Sac thai ra sao?
```

---

## Gemini Prompt Improvements

Use these instructions for the next Gemini run:

```text
Hay tao slide theo style dark logic blueprint, nhung can giu cac nguyen tac sau:

1. Neu xuat PPTX, uu tien text editable. Khong flatten moi slide thanh 1 anh duy nhat neu co the.
2. Moi slide chi co 1 job ro.
3. Slide quiz phai co 2 state:
   - before reveal
   - after reveal
4. Giu learner-facing terminology:
   - 3 cach nhin
   - Nghia - Hinh - Dung
   - Dau hieu chon mau
   - Mach logic cua cau noi
5. Dung label chinh xac:
   - わけだ = ket luan hop ly
   - わけではない = phu dinh nhan dinh / khong co nghia la...
   - わけがない = bac bo kha nang manh
   - わけにはいかない = rang buoc nen khong the lam
6. Khong dung "bac bo cuc manh"; dung "bac bo kha nang manh".
7. Slide story dung "Ru di 飲み会" hoac "Ru di nomikai", khong dung "Ru Nomikai".
8. Khong de watermark hoac branding cua tool tren slide final.
9. Neu dung dark background, subtitle tieng Viet phai du contrast de doc duoc tren video.
```

---

## Final Recommendation

Use these 5 slides as a visual direction reference.

For final production:

- keep the dark blueprint style;
- fix wording on Slides 3-5;
- split Slide 2 into quiz/reveal states;
- remove tool watermark;
- request editable text layers or rebuild final slides manually in an editable tool.
