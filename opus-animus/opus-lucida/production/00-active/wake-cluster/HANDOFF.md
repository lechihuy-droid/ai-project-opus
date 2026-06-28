# Wake Cluster Handoff
**Status:** Active
**Date:** 2026-05-07
**Scope:** Active wake lane
**Role:** Resume file for the next session working on the Wake lane
**Owner layer:** lane handoff
**Parent:** `07-automation-status.md`
**Supersedes:** `..\..\..\..\00-CONTEXT-wake-cluster-resume-next-session.md` for lane-level resume
**Superseded by:** 

## 1. Read First

```text
07-automation-status.md
03-slide-deck.md
02-script.md
08-production-frame-map.md
18-language-runner-smoke-test.md
```

## 2. Current Lane State

```text
Wake is still the active public sample lane.
The runtime direction is:
HTML runtime -> timed video render

Sprint 1 runtime block exists:
wake-cluster-deck-01-05.html

Whole-deck runtime exists:
wake-cluster-deck.html
```

## 3. What Was Just Locked

```text
1. Learner-facing language now has an upstream contract.
2. Slide 05 was used as the language-runner smoke test.
3. Smoke test result = PASS.
4. Public 3-view labels are now:
   - Ý nghĩa
   - Dạng
   - Cách dùng
5. Default speaker-intent prompt:
   - Ở câu này, người nói đang muốn nói gì?
```

## 4. Wake HTML Notes

```text
Slides 03-05 are no longer plain text:
- Slide 03 = promise split-card board
- Slide 04 = story board
- Slide 05 = method board

Current HTML artifacts:
- wake-cluster-deck-01-05.html
- wake-cluster-deck.html
- wake-cluster-runtime-prototype-01-02.html
```

## 5. Exact Next Actions

```text
1. Apply the language-generation runner pack to:
   - one grammar card block
   - one CTA block

2. Check whether the output stays natural
   without line-by-line manual rewriting

3. Only after that:
   continue polishing HTML slide language and visual hierarchy
```

## 6. Key Files

```text
01-master-teaching-skeleton.md
02-script.md
03-slide-deck.md
07-automation-status.md
08-production-frame-map.md
14-wake-slide-process-review.md
16-wake-html-runtime-pilot-review-01-05.md
18-language-runner-smoke-test.md
wake-cluster-deck-01-05.html
wake-cluster-deck.html
```

## 7. Do Not Re-open

```text
Do not re-open whether NotebookLM should be the main production path.
Current decision:
NotebookLM = optional support layer only

Do not switch back to:
late manual wording cleanup as the main language method.
```

## 8. Lane Resume Rule

```text
For Wake work, resume from this file first.
Use project-level ai/status.md only when you need
cross-project context or system-level decisions.
```
