import type { PaperNotebookFixture } from "../../../../src/styles/families/paper-notebook";

export const paperNotebookChecklistFixture: PaperNotebookFixture = {
  key: "checklist", sceneType: "checklist", sceneLabel: "Edge checklist", durationInFrames: 180, density: "balanced", motionPolicy: "static",
  eyebrow: "Review checklist / promotion gate", title: "The unfinished item must remain visible when the package is reviewed", subtitle: "A truthful checklist shows what passed, what still needs human judgment, and why experimental is the correct promotion state.", dateLabel: "13 JUL 2026", pageLabel: "QA 03", sectionTitle: "Experimental package gate",
  notes: [], equations: [],
  checklist: [
    { label: "Typed fixtures cover notes, derivation, and checklist", detail: "The three required scene types use one deterministic family renderer.", checked: true },
    { label: "Paper field renders without image assets", detail: "Grain, rules, holes, margin rail, marks, and checks are CSS/DOM primitives.", checked: true },
    { label: "Three portrait PNGs are nonblank", detail: "Each review still must report 1080 x 1920 dimensions and a content checksum.", checked: true },
    { label: "Strict package validation and TypeScript pass", detail: "Validation results are recorded only after the real commands complete.", checked: true },
    { label: "Human visual approval for stable promotion", detail: "This remains open; automated checks can promote only to experimental.", checked: false },
  ],
  annotations: [
    { label: "Truth rule", detail: "Never backfill an unchecked gate.", tone: "red" },
    { label: "Motion", detail: "Static mode preserves all information.", tone: "blue" },
    { label: "Next", detail: "Review typography and safe areas by eye.", tone: "graphite" },
  ], footer: "Edge case: one intentionally open gate remains prominent and legible."
};
