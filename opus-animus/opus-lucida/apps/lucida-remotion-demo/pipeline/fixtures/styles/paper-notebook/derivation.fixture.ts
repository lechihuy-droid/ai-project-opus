import type { PaperNotebookFixture } from "../../../../src/styles/families/paper-notebook";

export const paperNotebookDerivationFixture: PaperNotebookFixture = {
  key: "derivation", sceneType: "derivation", sceneLabel: "Dense derivation", durationInFrames: 210, density: "dense", motionPolicy: "reduce",
  eyebrow: "Derivation / deterministic layout", title: "Derive the usable writing area before placing a single line of reasoning", subtitle: "This dense fixture keeps every term explicit so the result can be audited from canvas dimensions to final annotation rail.", dateLabel: "13 JUL 2026", pageLabel: "PROOF 02", sectionTitle: "Portrait page calculation",
  notes: [],
  equations: [
    { label: "01", expression: "H_safe = 1920 - 132 - 188 = 1600 px", note: "Remove platform overlays before making any content-density decision." },
    { label: "02", expression: "W_paper = 1080 - (2 x 64) = 952 px", note: "The page width matches the shared portrait content contract." },
    { label: "03", expression: "W_notes = 952 - 116 - 54 - 28 - 208 = 546 px", note: "Reserve the binding margin and annotation rail before fitting prose." },
    { label: "04", expression: "rows = floor((1600 - 235 - 42) / 45) = 29", note: "The ruled baseline is fixed; animation never changes row geometry." },
    { label: "05", expression: "frame(t, fixture) -> same pixels + same checksum", note: "All motion is a pure function of Remotion frame and typed fixture input." },
  ], checklist: [],
  annotations: [
    { label: "Given", detail: "1080 x 1920 at 30 fps.", tone: "graphite" },
    { label: "Constraint", detail: "No raster paper dependency.", tone: "red" },
    { label: "Therefore", detail: "Geometry is reviewable and repeatable.", tone: "blue" },
  ], footer: "Dense case: reduced travel, fixed baselines, explicit arithmetic, no hidden measurements."
};
