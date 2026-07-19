import type { PaperNotebookFixture } from "../../../../src/styles/families/paper-notebook";

export const paperNotebookAnnotatedPaperFixture: PaperNotebookFixture = {
  key: "annotated-paper", sceneType: "annotated-paper", sceneLabel: "Annotated paper", durationInFrames: 180, density: "balanced", motionPolicy: "reduce",
  eyebrow: "Annotated paper / bounded claims", title: "Keep the correction beside the claim so the paper remains auditable", subtitle: "An annotated paper should make the changed assumption, its replacement language, and the remaining boundary readable at a glance.", dateLabel: "18 JUL 2026", pageLabel: "PAPER 05", sectionTitle: "Three annotation checks",
  notes: [
    { lead: "Mark the unsupported shortcut.", detail: "The first row identifies the original overreach without repeating it as the final conclusion.", emphasis: "replace, do not hide" },
    { lead: "Write the narrower replacement.", detail: "The revised statement names the evidence boundary and preserves the part that remains useful." },
    { lead: "Leave the next review question open.", detail: "A visible limitation avoids converting a local correction into an invented approval." },
  ], equations: [], checklist: [],
  annotations: [
    { label: "Correction", detail: "Red ink signals a real change in claim scope.", tone: "red" },
    { label: "Replacement", detail: "Keep the revised language in the main column.", tone: "blue" },
    { label: "Limit", detail: "Human review remains a separate decision.", tone: "graphite" },
  ], footer: "Annotated-paper case: original scope, replacement wording, and a remaining review boundary."
};
