import type { PaperNotebookFixture } from "../../../../src/styles/families/paper-notebook";

export const paperNotebookNotesFixture: PaperNotebookFixture = {
  key: "notes", sceneType: "notes", sceneLabel: "Normal notes", durationInFrames: 180, density: "balanced", motionPolicy: "full",
  eyebrow: "Study notes / visual systems", title: "A notebook frame should expose the reasoning, not decorate the conclusion", subtitle: "A quiet paper field lets the ink hierarchy carry definitions, evidence, and the small corrections that make thinking visible.", dateLabel: "13 JUL 2026", pageLabel: "NOTE 01", sectionTitle: "Three working principles",
  notes: [
    { lead: "Start with one claim per ruled block.", detail: "The reader can scan the blue-ink lead first, then use the smaller graphite note for context.", emphasis: "one claim / one block" },
    { lead: "Use red ink only for a correction.", detail: "Scarcity gives circles, underlines, and margin warnings a real editorial meaning." },
    { lead: "Keep the paper structure visible.", detail: "Rules and the margin rail align content without turning the page into a dashboard." },
  ], equations: [], checklist: [],
  annotations: [
    { label: "Margin note", detail: "Paper is the field; ink remains the subject.", tone: "blue" },
    { label: "Correction", detail: "Avoid decorative stickers and fake tape.", tone: "red" },
    { label: "Read order", detail: "Claim, context, annotation, recap.", tone: "graphite" },
  ], footer: "Fixture copy is authored locally; no raster texture or third-party media is used."
};
