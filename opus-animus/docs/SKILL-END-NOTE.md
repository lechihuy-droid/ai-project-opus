# Skill — END NOTE Write-Through for Claude / ChatGPT / Codex

**Date:** 2026-06-21  
**Status:** Draft / Usable  
**Scope:** Session-closing skill for LLM windows connected to Opus Animus  
**Primary command:** `End note.`  
**Default behavior:** Generate and append the note to the daily raw LLM inbox when file/repo write access is available.

---

## 1. Purpose

The END NOTE skill creates one small structured trace at the end of an important LLM session and saves it into the daily raw inbox.

It prevents useful decisions, tasks, insights, and health/life notes from being trapped inside chat history.

This is intentionally smaller than a full capsule.

```text
No full transcript.
No long summary.
No complex folder routing.
One useful session = one short END NOTE.
One day = one raw LLM inbox file.
```

---

## 2. Canonical Save Target

Daily raw LLM inbox:

```text
opus-animus/opus-consilium/raw/inbox/llm/YYYY-MM-DD.md
```

Example:

```text
opus-animus/opus-consilium/raw/inbox/llm/2026-06-21.md
```

This file is raw input for Consilium Daily Curator.

It is not final memory.
It is not TODO.
It is not decision log.
It is not Wiki.

---

## 3. Write-Through Rule

When the user says:

```text
End note.
```

The LLM must follow this order:

```text
1. Generate a compact END NOTE for the current session.
2. If file/repo write access is available, append it to today's daily raw LLM inbox.
3. If the daily file does not exist, create it with a date header.
4. Reply with the saved path and a brief confirmation.
5. Do not paste the full END NOTE back unless the user asks.
```

Fallback rule:

```text
If the LLM has no write access, output the END NOTE and clearly say it was not saved.
```

Never claim the END NOTE was saved unless the tool actually wrote the file.

---

## 4. Trigger Commands

Supported user commands:

```text
End note.
End note for Opus Animus.
Tạo end note.
Tóm tắt cuối session theo END NOTE.
/handoff + end note.     # for Codex / implementation sessions
```

When the user says one of these, do not ask follow-up questions unless the session is too ambiguous to summarize.

---

## 5. Standard END NOTE Format

Append this block:

```md
---

## {Source} — HH:MM — {Session Title}

### Source
ChatGPT / Claude / Codex / Other

### Session
Short session title or topic.

### What changed
- 1–5 bullets describing what was discussed, decided, created, or modified.

### Keep
Important insight, decision, principle, or memory worth preserving.

### Action
Concrete next action, if any. If none, write `None`.

### Route
Consilium / Logos / Rector / Nexus / Lucida / Wiki / Infra / Discard
```

Keep the END NOTE compact. Usually under 200 words.

---

## 6. Daily File Header

If the daily file does not exist, create it with:

```md
# LLM Inbox — YYYY-MM-DD

Purpose: raw END NOTE entries from ChatGPT / Claude / Codex sessions.  
Owner: Opus Consilium Daily Curator.  
Rule: this is raw input, not final memory.
```

Then append the END NOTE block.

---

## 7. Routing Rules

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

## 8. ChatGPT Behavior

### ChatGPT with GitHub/repo write access

When the user says `End note.`:

```text
Generate END NOTE → append to daily raw LLM inbox → confirm saved path.
```

### ChatGPT without write access

When the user says `End note.`:

```text
Generate END NOTE → output it → say it was not saved because write access is unavailable.
```

Do not pretend to save.

---

## 9. Claude Behavior

### Claude web/app without repo write access

Generate the END NOTE only and say it was not saved.

### Claude Code / CLI with repo access

Append directly to:

```text
opus-animus/opus-consilium/raw/inbox/llm/YYYY-MM-DD.md
```

If the session involved implementation work, also respect existing handoff rules.

---

## 10. Codex Behavior

Codex should combine END NOTE with handoff.

User command:

```text
/handoff + end note
```

Codex should:

```text
1. Update the normal handoff if applicable.
2. Append a compact END NOTE to the daily raw LLM inbox.
3. Confirm path and files touched.
```

---

## 11. Minimal Confirmation Message

After saving, reply only:

```text
Saved END NOTE to:
`opus-animus/opus-consilium/raw/inbox/llm/YYYY-MM-DD.md`
```

Optionally include one-line route summary:

```text
Route: Consilium → daily review; Rector → task candidate.
```

Do not print the full note unless asked.

---

## 12. Good Example

Daily file:

```md
# LLM Inbox — 2026-06-21

Purpose: raw END NOTE entries from ChatGPT / Claude / Codex sessions.  
Owner: Opus Consilium Daily Curator.  
Rule: this is raw input, not final memory.

---

## ChatGPT — 13:20 — Simplify LLM capture flow

### Source
ChatGPT

### Session
Simplify LLM capture flow for Opus Animus.

### What changed
- Rejected complex capsule pipeline for MVP.
- Chose one END NOTE per important LLM session.
- Chose one daily LLM inbox file.

### Keep
LLM history is not memory. Only compact END NOTE entries should enter Consilium raw inbox.

### Action
Create write-through END NOTE skill.

### Route
Consilium → daily review; Rector → implementation task candidate.
```

---

## 13. Bad Example

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

## 14. Final Rule

```text
When user says “End note”, save a compact END NOTE to the daily raw LLM inbox if write access exists.
If write access does not exist, generate the note but clearly say it was not saved.
```
