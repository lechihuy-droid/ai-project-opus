# Urgent Improvement Plan - Wake Cluster MVP
**Status:** Active
**Date:** 2026-04-30
**Scope:** Script, teaching depth, slide/Canva workflow, TTS voice

---

## 1. Problem Summary

Current output is visually promising, but the teaching content risks feeling:

- too flat;
- too definition-heavy;
- not enough like a real teacher solving JLPT questions;
- too dependent on generated slide images;
- hard to voice naturally if TTS cannot handle Japanese well.

The MVP should not only look good. It must feel like:

> A teacher is helping the learner choose the right answer faster by reading the logic of the sentence.

---

## 2. Priority Improvements

### Priority 1 - Apply Lucida brand voice to the script

The active script must be rewritten/patched with the new brand voice:

- less textbook narration;
- more coach-like explanation;
- more "nguoi noi dang lam gi?";
- more short rhythm, pause, and teacher emphasis;
- less "mau nay co nghia la..." as the main explanation.

Rule:

> Each grammar pattern must be explained as a speaker action, not only a Vietnamese meaning.

Example:

```text
Dung nhin chu wake truoc.
Hay hoi: nguoi noi dang lam gi?
Dang sua hieu nham?
Dang bac bo?
Dang bi rang buoc?
Hay dang rut ra ket luan?
```

---

### Priority 2 - Add "teacher exam-solving tips"

`Nghia - Hinh - Dung` is necessary but not enough for a JLPT product.

Add a fourth layer:

```text
Tin hieu chon dap an
```

Final teaching block for each pattern:

```text
1. Nguoi noi dang lam gi?
2. Nghia cot loi
3. Hinh thuc / cau truc
4. Cach dung / sac thai
5. Tin hieu chon dap an
6. Bay de nham
```

This makes the lesson feel like a teacher solving real JLPT questions.

---

### Priority 3 - Add quick-answer rules for the wake cluster

Core mantra:

```text
Dung nhin chu wake.
Hay hoi: nguoi noi dang lam gi?
```

Fast rules:

- `wake dewa nai` = dang dinh chinh / sua hieu nham
- `wake ga nai` = dang bac bo kha nang manh
- `wake ni wa ikanai` = bi rang buoc nen khong the lam
- `wake da` = di den ket luan hop ly

Slide-worthy catchphrases:

- `wake dewa nai` -> "khong phai vay dau"
- `wake ga nai` -> "lam gi co chuyen"
- `wake ni wa ikanai` -> "bi troi nen khong the"
- `wake da` -> "thao nao"

---

### Priority 4 - Build a "dau hieu de thi" layer

Each grammar card should include exam signals.

```text
wake dewa nai
Tin hieu: gokai, sou iu imi janai, betsu ni, phu dinh mem

wake ga nai
Tin hieu: zettai, arienai, sonna koto, khong doi nao

wake ni wa ikanai
Tin hieu: shimekiri, sekinin, rule, tachiba, shakaijin toshite

wake da
Tin hieu: co du kien truoc, ly do -> ket luan, thao nao, hoa ra
```

Use Vietnamese learner-facing labels on slide:

- `Dau hieu chon mau`
- `Cum tu di truoc`
- `Cum tu di sau`
- `Mach logic cua cau noi`

---

### Priority 5 - Patch slide deck from teaching logic, not only design

The deck should not just look cinematic. It must carry the solving method.

Needed slide improvements:

- add "Nguoi noi dang lam gi?" as a recurring slide motif;
- add one "Dau hieu chon dap an" card after each grammar pattern or as a consolidated map;
- make comparison slides contrast speaker action, not only meaning;
- keep "Nghia - Hinh - Dung", but add "Tin hieu chon dap an" where relevant.

---

### Priority 6 - Move Gemini/Canva process to reusable templates

Problem:

Gemini image quota is limited and generated slides are hard to edit.

New process:

```text
Gemini = visual concept / hero slide / difficult visual
Canva = reusable production templates
Markdown slide spec = content truth
```

Canva template groups needed:

- hook contrast;
- quiz before reveal;
- answer reveal;
- 4-logic map;
- story context;
- Nghia - Hinh - Dung;
- grammar card;
- exam signal card;
- comparison map;
- practice question;
- recap;
- CTA worksheet.

Rule:

> Do not generate every slide as a new image. Generate a few strong visual motifs, then reuse editable Canva templates.

---

### Priority 7 - Fix TTS pipeline for Japanese and natural voice

Current risk:

- TTS may read Japanese badly;
- bilingual Vietnamese + Japanese can sound robotic;
- voice may become stiff like Google Translate.

Needed workflow:

```text
script
-> voice script adapter
-> pronunciation-safe Japanese
-> TTS generation
-> audio QA
-> timing map
-> video assembly
```

Voice script adapter should:

- split Vietnamese and Japanese lines clearly;
- add pauses before/after Japanese examples;
- add furigana/romaji hints only if the TTS engine needs them;
- avoid long mixed-language sentences;
- mark emphasis for teacher-like rhythm.

Decision rule:

- If one multilingual voice reads Japanese naturally enough, use one voice for MVP.
- If Japanese pronunciation is bad, split into `voice_vi` and `voice_ja`.
- If both sound stiff, use TTS only for draft timing and record human voice for final sample.

---

## 3. Immediate Next Steps

Recommended order:

- [ ] Patch active script with Lucida brand voice.
- [ ] Add "teacher exam-solving tips" into each wake pattern.
- [ ] Sync slide deck spec with the new teaching layer.
- [ ] Define Canva template system.
- [ ] Create TTS voice-script format and test Slide 1-2 audio.
- [ ] Only after that, continue full slide/video production.

---

## 4. Resume Prompt For Next Session

Use this prompt if starting a fresh Codex session:

```text
Hay tiep tuc Opus Lucida wake-cluster MVP.

Doc context truoc:
OPUS ANIMUS/opus-lucida/production/00-active/wake-cluster/00-CONTEXT-resume-next-session.md

Sau do tiep tuc theo priority:
1. Patch active script theo Lucida brand voice
2. Them teacher exam-solving tips cho 4 mau wake
3. Sync lai slide deck theo script moi
4. Chuan bi Canva template workflow
5. Chuan bi TTS voice-script test cho slide 1-2

Khong lam visual polish truoc. Uu tien teaching lane va giong giao vien giai de.
```

Use this shorter prompt if starting directly with script patch:

```text
Doc context wake-cluster roi patch file 02-script.md theo giong Lucida:
teacher solving JLPT, khong textbook.

Them tang "nguoi noi dang lam gi?" va "tin hieu chon dap an" cho tung mau wake.

Sau khi sua, tom tat cac thay doi va nhac file nao can sync tiep.
```

---

## 5. Definition Of Done

This improvement pass is done when:

- script sounds like a teacher solving JLPT, not a textbook summary;
- each grammar point has `Nguoi noi dang lam gi?`;
- each grammar point has `Tin hieu chon dap an`;
- slide deck has Canva-friendly reusable structure;
- TTS test can read Vietnamese + Japanese acceptably, or fallback voice split is defined;
- worksheet and CTA reflect the same solving method.
