# Lucida Slide Framework QA Checklist
**Status:** Active v1  
**Scope:** Slide architecture, slide deck, HTML frames  
**Role:** Review gate before script sync, audio, and video assembly

---

## 1. Gate A - Architecture QA

Pass only if:

```text
- Every slide has a phase.
- Every slide has a skeleton link.
- Every slide has one primary learning function.
- The slide sequence follows a coherent learner journey.
- No slide exists only because it looks nice.
```

Fail if:

```text
- A slide cannot be traced back to the skeleton.
- A slide mixes too many roles.
- The flow jumps from hook to grammar without promise or method.
```

---

## 2. Gate B - Template Fit QA

Pass only if:

```text
- Each slide uses a named template from the template library.
- Required elements for that template are present.
- Optional elements do not clutter the slide.
- The chosen template fits the phase.
```

Fail if:

```text
- A quiz slide has no answer review path.
- A grammar card lacks speaker action or form.
- A comparison slide lacks a clear contrast axis.
- A CTA slide does not connect to the learner problem.
```

---

## 3. Gate C - Script Sync QA

Pass only if:

```text
- Every slide has a corresponding script block.
- The script explains what is visible.
- The slide does not duplicate the whole script.
- Pause / reveal cues match quiz or worked-example moments.
- Slide count matches audio segment count.
```

Fail if:

```text
- Script says "answer will reveal" but the frame gives no before/after support.
- Script changes lesson meaning without slide update.
- Slide heading and script role point to different functions.
```

---

## 4. Gate D - Language QA

Pass only if:

```text
- Japanese examples are natural.
- Vietnamese explanations are natural and learner-facing.
- Public slide labels avoid unclear English production terms.
- Terms follow Lucida learner-facing language.
```

Preferred terms:

```text
Nghia - Hinh - Dung
Dau hieu chon mau
Nguoi noi dang lam gi?
Truoc khi chot
Sau khi chot
Bay hay gap
```

Fail if:

```text
- Japanese sounds machine-generated.
- Vietnamese translation is stiff or unnatural.
- Headings are tiny, vague, or production-internal.
```

---

## 5. Gate E - Production Readiness QA

Pass only if:

```text
- HTML deck is compatible with screenshot_slides.py.
- Exported frame count matches script slide count.
- Frames are 1920x1080.
- No text is clipped.
- No mojibake appears.
- Quiz slides remain understandable as static MVP frames.
```

Fail if:

```text
- A slide depends on animation that is not implemented.
- A frame is blank or stale.
- Numbering does not match audio segment naming.
```

---

## 6. Final Decision Labels

Use:

```text
PASS
PASS_WITH_NOTES
REVISE
BLOCK
```

Decision rule:

```text
PASS = ready for downstream audio/video.
PASS_WITH_NOTES = usable for MVP, known polish issue.
REVISE = fix before production.
BLOCK = return to skeleton / slide architecture before continuing.
```

