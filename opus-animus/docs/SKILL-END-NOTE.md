# Skill — END NOTE for Claude / ChatGPT / Codex

**Date:** 2026-06-21  
**Status:** Draft / Usable  
**Scope:** Reusable session-closing skill for LLM windows connected to Opus Animus  
**Primary command:** `End note.`  

---

## 1. Purpose

The END NOTE skill creates a small structured trace at the end of an important LLM session.

It prevents useful decisions, tasks, insights, and health/life notes from being trapped inside chat history.

It is intentionally much smaller than a full capsule.

```text
No full transcript.
No long summary.
No complex automation.
One useful session = one short END NOTE.
```

---

## 2. When to Use

Use this skill at the end of any session that produced something worth keeping.

Examples:

```text
- strategic discussion
- architecture decision
- task planning
- repo/file update
- useful research synthesis
- health/life note worth tracking
- content idea
- decision candidate
- open question to continue later
```

Do not use it for casual, low-value chat.

---

## 3. Trigger Commands

Supported user commands:

```text
End note.
End note for Opus Animus.
Tạo end note.
Tóm tắt cuối session theo END NOTE.
/handoff + end note.     # for Codex / implementation sessions
```

When the user says one of these, generate the END NOTE directly.

Do not ask follow-up questions unless the session is too ambiguous to summarize.

---

## 4. Standard Output Format

Always output this format:

```md
## END NOTE

### Source
ChatGPT / Claude / Codex / Other

### Session
Short session title or topic.

### What changed
1–5 bullets describing what was discussed, decided, created, or modified.

### Keep
Important insight, decision, principle, or memory worth preserving.

### Action
Concrete next action, if any. If none, write `None`.

### Route
Choose one or more:
- Consilium
- Logos
- Rector
- Nexus
- Lucida
- Wiki
- Infra
- Discard

### Suggested Save Target
Recommended location, for example:
`opus-consilium/raw/inbox/llm/YYYY-MM-DD.md`
```

Keep the answer compact. Usually under 200 words.

---

## 5. Routing Rules

Use these routes:

```text
Consilium = information, raw capture, synthesis, routing review
Logos     = strategy, priority, roadmap, decision, stop list
Rector    = task, execution, TODO, handoff, workflow
Nexus     = user interface, health/life tracking, dashboard
Lucida    = content/JLPT/video production
Wiki      = long-term knowledge
Infra     = scheduler/runtime/automation
Discard   = no durable value
```

If the session contains multiple item types, route to multiple destinations.

Example:

```text
Route: Consilium → daily review; Rector → task candidate; Wiki → knowledge candidate
```

---

## 6. Save Target Rule

The simplest daily target is one file per day:

```text
opus-animus/opus-consilium/raw/inbox/llm/YYYY-MM-DD.md
```

Append END NOTE entries into that file.

Example structure:

```md
# LLM Inbox — YYYY-MM-DD

## ChatGPT — HH:MM — Topic
[END NOTE]

---

## Claude — HH:MM — Topic
[END NOTE]

---

## Codex — HH:MM — Topic
[END NOTE]
```

If the LLM does not have file access, only output the END NOTE and tell the user to copy it to the daily LLM inbox.

Never claim the note has been saved unless the tool actually saved it.

---

## 7. Claude Usage

### Claude web/app

Claude should only generate the END NOTE. The user copies it into the daily LLM inbox.

### Claude Code / CLI with repo access

If explicitly asked to save, Claude may append the END NOTE to:

```text
opus-animus/opus-consilium/raw/inbox/llm/YYYY-MM-DD.md
```

For implementation sessions, Claude should also respect the existing project handoff rules if applicable.

---

## 8. ChatGPT Usage

ChatGPT should normally generate the END NOTE only.

Recommended user flow:

```text
1. User says: End note.
2. ChatGPT outputs END NOTE.
3. User copies it into the daily LLM inbox or Google Drive mobile inbox.
4. Consilium Daily Curator reads it during daily review.
```

ChatGPT should not claim it updated the repo unless a connected tool actually performed the write.

---

## 9. Codex Usage

Codex should use END NOTE together with handoff.

For coding sessions:

```text
/handoff + end note
```

Codex should capture:

```text
- files touched
- what changed
- validation performed
- remaining risks
- next action
- route to Rector/Consilium/Infra/etc.
```

If the session changed repo files, prefer updating the existing handoff mechanism and also writing a short END NOTE for daily Consilium review.

---

## 10. Good Example

```md
## END NOTE

### Source
ChatGPT

### Session
Simplify LLM capture flow for Opus Animus.

### What changed
- Rejected complex capsule pipeline for MVP.
- Chose one END NOTE per important LLM session.
- Chose one daily LLM inbox file instead of many session files.

### Keep
LLM history is not memory. Only compact END NOTE entries should enter Consilium raw inbox.

### Action
Create END NOTE skill for Claude and ChatGPT.

### Route
Consilium → daily review; Rector → implementation task candidate.

### Suggested Save Target
`opus-consilium/raw/inbox/llm/2026-06-21.md`
```

---

## 11. Bad Example

Do not output this:

```text
Here is a 3,000-word summary of the whole conversation...
```

Do not store:

```text
- full transcript
- repeated reasoning
- unrelated chat
- every minor idea
- unsorted task dumps
```

END NOTE exists to reduce noise.

---

## 12. Final Rule

```text
Every important LLM session should leave one small END NOTE.
END NOTE is not memory itself.
It is raw input for Consilium Daily Curator.
```
