# Lucida Flow Streamline

**Purpose:** Quick visual flow for review in VS Code  
**Source architect:** `10-project-architecture-map.md`  
**Detailed workflow:** `automation/workflows/20-lesson-production-sop.md`

---

## Recommended VS Code Preview

Good options:

- `Markdown Preview Mermaid Support`
- `Mermaid Markdown Syntax Highlighting`
- built-in Markdown preview, if your VS Code version already supports Mermaid blocks

If built-in preview works, open this file and use:

```text
Ctrl+Shift+V
```

or

```text
Open Preview to the Side
```

---

## Main Flow

```mermaid
flowchart TD
    A["01 Topic Lock<br/>Output: topic lock"] --> B["02 Teaching Skeleton<br/>Output: 01-master-teaching-skeleton.md"]
    B --> C["03 Skeleton Review<br/>QA Gate: skeleton criteria"]
    C --> D["04 Output Architecture<br/>Output: 05-topic-mvp-output-architecture.md"]
    D --> E["05 Slide Structure Layer<br/>Output: 03-slide-deck.md structure"]
    E --> F["06 Slide Structure QA<br/>Gate: source / teaching / reveal logic"]
    F --> G["07 Slide Design Layer<br/>Output: 03-slide-deck.md design"]
    G --> H["08 Slide Design QA<br/>Gate: layout / hierarchy / Lucida design direction"]
    H --> I["09 Script<br/>Output: 02-script.md"]
    I --> J["10 Script QA<br/>Gate: grammar / hook / CTA / audio"]
    J --> K["11 Slide-Script Sync QA<br/>Gate: role / reveal / narration sync"]
    K --> L["12 Active Topic Folder Update"]
    L --> M["13 Worksheet"]
    L --> N["14 Diagnostic Quiz"]
    L --> O["15 Shorts / Repurposing"]
    M --> P["16 Recording Brief"]
    N --> P
    O --> P
    P --> Q["17 Video Production"]
    Q --> R["18 Post-video Decision Log / Maintenance"]
```

---

## Rule And Reference Layer

```mermaid
flowchart LR
    S["Strategy / Standards"] --> W["Workflow"]
    S --> X["Skeleton"]
    X --> Y["Output Architecture"]
    Y --> Z["Slide Structure"]
    Z --> ZA["Slide Design"]
    ZA --> ZB["Script"]
    ZB --> ZC["Sync QA"]

    E1["Example Intelligence Bank<br/>reference only"] -. consult when needed .-> X
    E1 -. consult when needed .-> Z

    D1["Lucida Slide Design Direction<br/>reference rule"] -. governs .-> ZA
    D1 -. review against .-> H1["Slide Design QA"]
```

---

## QA Gates

```mermaid
flowchart TD
    G1["Gate 1<br/>Skeleton"] --> G2["Gate 2<br/>Output Architecture"]
    G2 --> G3["Gate 3<br/>Slide Structure"]
    G3 --> G4["Gate 4<br/>Slide Design"]
    G4 --> G5["Gate 5<br/>Script"]
    G5 --> G6["Gate 6<br/>Slide-Script Sync"]
    G6 --> G7["Future Gate 7<br/>Worksheet / Quiz"]
    G7 --> G8["Future Gate 8<br/>Video / Publish"]
    G8 --> G9["Future Gate 9<br/>Analytics / Maintenance"]
```

---

## Note

This file is only for quick visual review.

Do not edit process rules here first.

Canonical rule files remain:

- `10-project-architecture-map.md`
- `automation/workflows/20-lesson-production-sop.md`
- `production/03-qa/criteria/*.md`
