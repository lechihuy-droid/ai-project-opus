# Slide QA Criteria - Wake Cluster
**Status:** Active
**Role:** Wake-specific extension of generic slide QA
**Generic base:** `production/03-qa/criteria/03-slide-qa-criteria.md`
**Target deck:** `production/00-active/wake-cluster/03-slide-deck.md`
**Source skeleton:** `production/00-active/wake-cluster/01-master-teaching-skeleton.md`
**Wake architecture:** `production/00-active/wake-cluster/05-wake-mvp-output-architecture.md`

---

## 1. QA Goal

Wake slide QA checks whether the deck is ready to become the locked presentation layer for the Wake MVP video.

It does not judge final design polish. It judges whether the slide architecture can guide:

```text
script polish -> Canva/PPT build -> audio/recording -> video edit
```

---

## 2. Wake Pass Definition

Deck passes when:

- it keeps the locked 17-slide Wake architecture;
- it teaches `わけ` as 4 speaker actions, not as dictionary translations;
- it gives early payoff for the hook quiz;
- it promises both exam transfer and real-life usage, not only a test-taking trick;
- each grammar slide includes speaker action, core meaning, form, and a visible anchor;
- comparison slides solve real confusion pairs;
- Slide 13 turns the lesson into a clue-based exam tool;
- Slide 14 is a true worked-example retrieval;
- Slide 15 is a true diagnostic practice;
- Slide 16 is screenshot-friendly;
- Slide 17 sells worksheet + diagnostic quiz as trap practice, not a generic PDF.

---

## 3. Wake-Specific Accuracy Checks

### 3.1 Core Map

Required map:

```text
わけだ
= rút ra kết luận hợp lý từ lý do / thông tin đã biết

わけではない
= phủ định một nhận định / đính chính / không có nghĩa là...

わけがない
= bác bỏ khả năng rất mạnh / không thể nào...

わけにはいかない
= bị ràng buộc nên không thể làm
```

Fail if:

- `わけだ` is taught only as "thảo nào";
- `わけではない` is taught only as "phủ định một phần";
- `わけがない` is softened too much;
- `わけにはいかない` is described as inability rather than constraint;
- `Vないわけにはいかない` is missing or overemphasized.

---

### 3.2 Required Forms

Required visible forms:

```text
普通形 + わけではない
V辞書形 + わけにはいかない
Vない + わけにはいかない
普通形 + わけだ
普通形 + わけがない
嫌いなわけがない
```

Fail if:

- `嫌いなわけがない` loses `な`;
- bonus `Vないわけにはいかない` is absent;
- form lines are so visually buried that they will not be noticed.

---

## 4. Wake Slide-by-slide Checklist

### Slide 01 - Opening

- Does it show two similar-looking `わけ` sentences?
- Does the pain point appear within 3-5 seconds?
- Does it avoid over-explaining?

### Slide 02 - Hook Quiz

- Is the quiz readable?
- Is answer A revealable cleanly?
- Does it give a temporary payoff without doing the full lesson early?

### Slide 03 - Topic Intro + Exam Promise

- Does it clearly introduce the 4 Wake patterns in this N2 lesson?
- Does it name the exam promise: read faster, avoid near-meaning traps, choose with more confidence?
- Does it name the real-life promise: understand whether the speaker is concluding, correcting, strongly denying, or constrained?
- Does it connect the 4 patterns to speaker actions?
- Does it avoid reducing the lesson promise to "look at clue -> choose answer" only?
- Does it avoid sounding like a dictionary list?

### Slide 04 - Story

- Does the Nam / company / nomikai / deadline context create natural tension?
- Does it avoid mapping all 4 patterns too early?

### Slide 05 - 3 Cách Nhìn

- Does it use learner-facing language?
- Is it short enough not to become methodology lecture?
- Does it introduce the mantra: "Ở câu này, người nói đang muốn nói gì?"

### Slides 06-09 - Grammar Points

Each grammar slide must include:

```text
speaker action
core meaning
form
example or cue
teaching check / trap warning
```

Fail if any grammar slide is only a definition card.

### Slide 10 - Comparison Map

- Are all 4 rows clean and screenshot-friendly?
- Does it reinforce speaker action as the decision rule?

### Slide 11 - わけではない vs わけがない

- Does it distinguish correction from strong denial?
- Does it use `嫌いな` correctly?
- Does it avoid calling `わけではない` merely "soft" without the logic?

### Slide 12 - わけがない vs わけにはいかない

- Does it distinguish possibility judgment from constrained action?
- Does it make clear why both can be mistranslated as "không thể"?

### Slide 13 - Dấu Hiệu Chọn Mẫu

- Does it teach clue spotting?
- Does it include before/after/logical cue?
- Does it avoid turning clues into rigid keyword rules?
- Does it naturally seed the worksheet?

### Slide 14 - Worked Example Retrieval

Required reasoning path:

```text
read question
-> mark clue
-> identify speaker action
-> eliminate tempting wrong answer
-> reveal correct answer
```

Required answer logic:

```text
Blank 1:
行きたくない＿＿ありません
-> correcting misunderstanding
-> わけでは
-> わけが is too strong

Blank 2:
でも、今日は行く＿＿いきません
-> constrained action
-> わけには
-> わけだ only concludes; it does not express constraint
```

Fail if this slide only reveals answer A.

### Slide 15 - Diagnostic Practice

Required answer logic:

```text
Namさんがみんなを嫌いな＿＿。
-> strong denial of possibility
-> わけがない
-> わけではない is too soft / only correction
```

Fail if:

- answer is revealed before retrieval;
- `嫌いな` is not highlighted;
- the trap is not named.

### Slide 16 - Recap

- Are the 4 main labels large and clear?
- Is the bonus smaller?
- Does it avoid adding new teaching?

### Slide 17 - CTA

- Does it say worksheet + quiz?
- Does it mention diagnostic / trap practice?
- Does it continue the exact pain point: "hiểu rồi nhưng vào đề vẫn phân vân"?
- Does it avoid generic sales copy?

---

## 5. Wake QA Output Format

Use this format:

```text
Decision: Pass / Pass with minor revisions / Pass with revisions / Block

Wake architecture:

Grammar accuracy:

Slide-first script readiness:

Worked example:

Diagnostic practice:

CTA:

Findings:
1.
2.
3.

Required patches:
1.
2.
3.
```

---

## 6. Decision Rule

Move to script polish only when:

```text
Wake slide QA = Pass
or
Wake slide QA = Pass with minor revisions
```

If verdict is `Pass with revisions`, patch the deck before rewriting script.

