# Example Intelligence System Rules
**Status:** Active  
**Role:** Source-of-truth rules for creating, selecting, and approving lesson examples

---

## 1. Purpose

Lucida should not create examples by improvising from grammar names alone.

The system should produce examples that are:

```text
scene-first
grammar-fit
natural in Japanese
natural in Vietnamese
useful for exams
usable in real life
```

---

## 2. Core Principle

Do not generate examples in this order:

```text
grammar
-> write sentence
-> patch naturalness later
```

Use this order instead:

```text
grammar logic
-> choose scene
-> draft natural Japanese
-> draft natural Vietnamese teaching line
-> keep support translation separate
-> run QA
-> approve or reject
```

Short form:

```text
scene first
language second
grammar fit third
```

---

## 3. Non-Negotiable Rules

### Rule A - Scene Before Sentence

Start with:

- what is happening?
- who is speaking?
- what misunderstanding / pressure / constraint exists?

Only then write the Japanese line.

### Rule B - Dialogue Before Explanation

Write the real utterance first.

Only after that:

- explain grammar;
- add clue logic;
- add teaching contrast.

### Rule C - Public Line vs Support Line

Every approved example must separate:

```text
Japanese natural line
Vietnamese public-facing line
Vietnamese support translation
```

Do not let the support translation become the spoken narration.

### Rule D - Naturalness Is A Hard Gate

An example can be:

- grammatically correct;
- pedagogically useful;

and still fail if it sounds unnatural.

### Rule E - One Lesson, One Spine

Do not let examples multiply into a mixed collage.

Preferred lesson pattern:

```text
1 primary spine
1 practical expansion
0-1 trend-aware support example
```

### Rule G - Separate Scene Examples From Form Examples

Not every example plays the same role.

Separate:

```text
scene spine
practical expansion
comparison example
trend support
form-focused micro-example
```

A form-focused micro-example may exist to teach:

- attachment pattern;
- adjective/noun connection;
- short contrast pair.

But it must not silently replace the approved scene line.

If both appear in one lesson:

```text
scene example = teaches logic in context
form micro-example = teaches shape or attachment
```

Keep the roles explicit.

### Rule H - Bank Sync Rule

When an approved lesson-specific bank exists, downstream artifacts should inherit:

```text
scene
Japanese natural line
Vietnamese public-facing line
support translation
role
watchout
```

If downstream wording changes, the change must be one of these:

```text
same scene, lighter spoken trimming
form-focused micro-example
comparison-specific rewrite
```

Do not drift into a new scene unintentionally.

### Rule F - Trend Is Optional Flavor

Trend provides context.

Grammar logic decides the example.

If the trend weakens clarity or naturalness, reject it.

---

## 4. Required Example Record

Every approved example should include:

```text
Example ID
Use role
Situation
Speaker intention
Japanese natural line
Vietnamese public-facing line
Vietnamese support translation
Grammar logic
Persona fit
Exam transfer
Real-life transfer
Register note
Risk note
Labels
```

---

## 5. Reference Position In Lucida

This bank is a reference layer, not a mandatory lesson workflow step.

Use it during:

- skeleton drafting;
- slide structure drafting;
- script cleanup;
- worksheet / shorts ideation.

Do not let it override:

- grammar scope;
- lesson promise already locked in the skeleton;
- beat order already locked in output architecture.

---

## 6. Minimum Approval Flow

```text
1. Start from grammar logic.
2. Check persona slice.
3. Retrieve 3-5 scenes.
4. Draft 2-3 examples.
5. Separate public line vs support line.
6. Run Japanese/Vietnamese naturalness QA.
7. Run pedagogy fit QA.
8. Approve 1 primary + 1 backup if needed.
```

---

## 7. Storage Rule

Store materials at three levels:

```text
Level 1:
System rules and persona

Level 2:
Reusable situation banks

Level 3:
Lesson-specific approved examples
```

Example:

```text
production/02-assets/example-intelligence/
production/02-assets/example-intelligence/wake/
```
