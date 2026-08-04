import type { PaperNotebookFixture } from "../../../../src/styles/families/paper-notebook";

export const paperNotebookLabLogFixture: PaperNotebookFixture = {
  key: "lab-log", sceneType: "lab-log", sceneLabel: "Lab log", durationInFrames: 180, density: "sparse", motionPolicy: "full",
  eyebrow: "Lab log / notebook grammar", title: "Record the observation before asking the reader to accept the conclusion", subtitle: "A short lab log keeps the observed state, method cue, and correction boundary legible before the denser analysis arrives.", dateLabel: "18 JUL 2026", pageLabel: "LOG 04", sectionTitle: "Three recorded observations",
  notes: [
    { lead: "Record the observed state first.", detail: "The title establishes the run while the first ruled block limits the record to one observable result.", emphasis: "observation before conclusion" },
    { lead: "Place the method cue in the margin.", detail: "Annotations preserve the setup without interrupting the main log sequence." },
    { lead: "Reserve red ink for the correction.", detail: "A single visible boundary marks a changed reading without overstating the result." },
  ], equations: [], checklist: [],
  annotations: [
    { label: "Order", detail: "Observation, method, cue, correction.", tone: "blue" },
    { label: "Boundary", detail: "Do not convert a local record into a result claim.", tone: "red" },
    { label: "Use", detail: "Run log before a denser analysis.", tone: "graphite" },
  ], footer: "Sparse case: ordered observations, visible method, and one correction cue."
};
