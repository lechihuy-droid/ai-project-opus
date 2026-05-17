# Example Bank LLM Retrieval Contract
**Status:** Active draft  
**Role:** Standard retrieval rules for LLM agents selecting examples from the bank

---

## 1. Purpose

This file defines how an LLM or subagent should choose examples from the example bank.

The agent should not browse the bank like a human paragraph-by-paragraph reader.

It should retrieve by:

```text
lesson need
-> label filter
-> grammar fit
-> persona fit
-> transfer fit
-> risk control
-> shortlist
```

---

## 2. Required Inputs

Every retrieval request should define:

```text
Grammar cluster
Target asset
Persona priority
Primary teaching goal
Secondary teaching goal
Wanted shelf life
Risk tolerance
Need for trend layer: yes/no
```

Example:

```text
Grammar cluster: Wake
Target asset: opening hook
Persona priority: vn_n3_n2
Primary teaching goal: correction + constraint
Secondary teaching goal: exam transfer
Wanted shelf life: evergreen
Risk tolerance: low cringe
Need for trend layer: no
```

---

## 3. Retrieval Steps

### Step 1

Filter by asset role label:

```text
hook
story_spine
worksheet
shorts
```

### Step 2

Filter by grammar logic labels:

```text
correction
constraint_logic
logical_conclusion
strong_denial_logic
```

### Step 3

Filter by persona and transfer:

```text
vn_n3_n2
exam_transfer_high
real_life_transfer_high
```

### Step 4

Remove risky mismatches:

```text
textbook_risk
drama_risk
slang_risk
```

unless the task explicitly asks for that style.

### Step 5

Return:

```text
1 primary choice
1 backup choice
1 optional trend-aware choice
```

---

## 4. Output Format

Use this structure:

```text
Primary choice:
- ID
- why selected
- labels
- best use

Backup choice:
- ID
- why selected
- labels
- best use

Optional trend-aware choice:
- ID
- why selected
- labels
- best use
```

---

## 5. Rule For Long-form Lessons

For long-form lessons:

```text
prefer evergreen
prefer exam_transfer_high or real_life_transfer_high
prefer low_cringe
prefer examples that support at least two grammar actions
```

Do not choose a trend-aware example over a stronger evergreen example unless the asset is explicitly:

```text
shorts
thumbnail
hook test
social post
```

