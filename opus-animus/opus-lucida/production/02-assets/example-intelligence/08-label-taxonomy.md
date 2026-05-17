# Example Bank Label Taxonomy
**Status:** Active draft  
**Role:** Shared labels for retrieval, filtering, and LLM-assisted selection

---

## 1. Purpose

This taxonomy makes the example bank easier to use by:

- humans scanning the bank quickly;
- LLM agents retrieving examples by purpose;
- future automation that needs stable labels.

Use labels consistently across:

- situation banks;
- lesson-specific candidate files;
- approved example files;
- negative example bank when useful.

---

## 2. Label Families

### A. Asset Role Labels

Use these to describe where an example fits in production:

```text
hook
hook_quiz
story_spine
practical_expansion
grammar_card
comparison
worked_example
diagnostic_practice
worksheet
shorts
cta_bridge
```

### B. Persona Labels

```text
vn_n3_n2
student_japan
office_worker_japan
baito_worker
career_focused
casual_sns_learner
```

### C. Emotion / Tension Labels

```text
misunderstanding
social_pressure
responsibility
constraint
guilt
temptation
relief
strong_denial
awkwardness
excitement_blocked
```

### D. Grammar Logic Labels

Use these when the example supports a grammar action:

```text
correction
constraint_logic
logical_conclusion
strong_denial_logic
minimal_pair_ready
trap_ready
```

### E. Transfer Labels

```text
exam_transfer_high
exam_transfer_medium
real_life_transfer_high
real_life_transfer_medium
```

### F. Shelf-Life Labels

```text
evergreen
seasonal
sns_current
```

### G. Risk Labels

```text
low_cringe
medium_cringe
textbook_risk
drama_risk
slang_risk
needs_social_tension
```

---

## 3. Minimum Label Set

Every approved example should have at least:

```text
1 asset role label
1 persona label
1 emotion/tension label
1 grammar logic label
1 transfer label
1 shelf-life label
1 risk label
```

---

## 4. Suggested Display Format

Use a compact block:

```text
Labels:
- hook
- vn_n3_n2
- responsibility
- constraint_logic
- exam_transfer_high
- evergreen
- low_cringe
```

For tables, use comma-separated labels if needed.

---

## 5. Retrieval Rule

When asking an LLM or subagent to select examples, query by labels first, then by wording.

Example:

```text
Need:
- hook
- vn_n3_n2
- exam_transfer_high
- evergreen
- correction
- constraint_logic
```

This is more stable than:

```text
Find a hot example
```

