# Wiki Ops Workspace Plugin Pack

**Status:** test
**Owner:** Codex / Claude / ChatGPT
**Purpose:** Turn chat, research, and project decisions into durable wiki updates without turning the wiki into a transcript archive.

---

## Role

**Wiki Intake Agent**

The agent classifies incoming context, decides whether it is durable, selects the smallest target page, and prepares or applies a wiki update only when requested.

---

## Use When

Use this pack when the task is about:

- promoting chat insight into the wiki
- updating Consilium decision memory
- adding a method / skill / rule / open question
- checking whether a topic deserves a wiki update
- updating active project context or research filters

Do not use this pack for generic research or implementation tasks.

---

## Connectors / Sources

Primary sources:

- current chat summary
- `opus-consilium/personal-wiki/`
- `AGENTS.md`
- `ai/status.md`
- `ai/handoff-{owner}.md`

Optional sources:

- recent research reports
- prior handoff notes
- `tasks/lessons.md` if present

---

## Skills

| Skill | Purpose |
|---|---|
| Chat-to-wiki classification | Decide whether a chat insight is durable enough for the wiki |
| Smallest-page routing | Update the smallest existing page instead of creating unnecessary new pages |
| Decision extraction | Separate durable decision from temporary discussion |
| Open-question extraction | Convert uncertainty into a tracked question instead of a false conclusion |
| No-transcript rule | Store insight, not raw conversation |

---

## Commands

### `/review-chat-to-wiki`

Classify recent chat into:

- `ignore`
- `temporary_context`
- `hub_update`
- `open_question`
- `decision`
- `method`
- `new_page_candidate`

Return:

```text
Durable insight:
Classification:
Target page:
Update type:
Decision label:
Reason:
```

Do not update files unless the user explicitly says to apply/update.

### `/apply-wiki-update`

Apply only the smallest safe edit after classification.

Return:

```text
Changed files:
Commit hash:
Decision label:
```

---

## Gates

### Pass

- The update is durable.
- The target page is the smallest correct page.
- The update stores insight, not transcript.
- The update does not duplicate existing wiki content.
- The decision label is explicit.

### Revise

- The insight is useful but target page is unclear.
- The update is too long.
- The insight should be an open question, not a conclusion.

### Blocked

- The request would create unnecessary pages.
- The task tries to update raw sources.
- The update copies long chat transcript into the wiki.
- The agent is not sure what the user actually decided.

---

## Compact Trigger

Run compact when:

- a wiki discussion becomes long
- moving from discussion to actual wiki edit
- moving from research to synthesis
- before opening a new session

Compact output:

```text
Goal:
Current state:
Decisions made:
Active rules:
Relevant pages:
What to drop:
Next action:
```

---

## Handoff Trigger

Run handoff when:

- passing a wiki update task to Codex / Claude / ChatGPT
- switching from mobile chat to repo execution
- ending a session with pending wiki work

Handoff output:

```text
Task:
Read first:
Allowed edits:
Do not edit:
Expected output:
Quality gate:
Return format:
```

---

## Do Not Do

- Do not create a new page when an existing hub page is enough.
- Do not update `raw/` sources.
- Do not store full chat transcript.
- Do not turn casual explanation into a durable decision.
- Do not touch `AGENTS.md` for every new rule; prefer a targeted skill or pack file.

---

## Success Metrics

- Fewer duplicate pages.
- Less noisy wiki content.
- More durable decisions captured.
- Clearer target pages for future agents.
- Faster resume after session interruption.

---

## References

- ECC / Everything Claude Code: agent + skill + command + hook separation
- Consilium chat-to-wiki classification skill
- Consilium intel-to-wiki promotion rule
