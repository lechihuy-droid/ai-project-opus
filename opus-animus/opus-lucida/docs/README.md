# Lucida Docs Map
**Status:** Canonical index  
**Date:** 2026-05-06  
**Role:** Explain how to read the `docs/` folder without confusing active governance, reference architecture, and historical planning

---

## 1. Purpose

Use this file to answer:

```text
Trong docs/ nen doc file nao truoc?
File nao la active governance?
File nao la reference?
File nao chi la lich su planning?
```

This folder is not one flat pile of documents.

It has three roles:

```text
active governance
reference architecture
historical planning
```

---

## 2. Read Order

If you want the current Lucida system, read in this order:

```text
../10-project-architecture-map.md
../11-current-operating-flow.md
../12-repo-folder-status-map.md
../13-docs-workflows-mapping.md
```

Then use `docs/` selectively.

---

## 3. Docs Folder Structure

```text
docs/
├─ README.md
├─ RD-beta-launch.md
├─ SD-beta-architecture.md
├─ research-video-automation.md
├─ BD-sample-product-bundle.md
├─ BD-sample-video-validation.md
├─ reference/
└─ history/
```

---

## 4. Active Governance In `docs/`

These files still matter as project context,
but they are not the main day-to-day execution owners:

```text
RD-beta-launch.md
SD-beta-architecture.md
```

Use them when you need:

```text
- beta scope
- architecture rationale
- source traceability
- higher-level boundary decisions
```

Their active operational counterparts live outside `docs/`:

```text
../10-project-architecture-map.md
../11-current-operating-flow.md
../automation/workflows/20-38.md
```

---

## 5. Reference Docs

These files are useful references, not active process owners:

```text
research-video-automation.md
BD-sample-product-bundle.md
BD-sample-video-validation.md
reference/**
```

Use them when you need:

```text
- research context
- source material
- validation thinking
- old design/reference examples
```

---

## 6. Historical Docs

Historical planning and review files live here:

```text
history/PLAN-opus-lucida-foundation.md
history/BD-phase-1-foundation.md
history/REVIEW-mvp-output-audit-2026-04-29.md
```

Use them for:

```text
- project history
- decision lineage
- early planning context
```

Do not use them as active process owners.

---

## 7. Rule

If a new document in `docs/` is being proposed, check first:

```text
1. Is this active governance?
2. Is this only reference?
3. Is this history?
4. Should it actually live in automation/workflows/ instead?
```

If the answer is "execution SOP",
it probably does not belong in `docs/`.
