import type { CinematicTypeFixtureKey } from "../families/cinematic-type/types";
import type { EditorialCollageFixtureKey } from "../families/editorial-collage/types";
import type { PaperNotebookFixtureKey } from "../families/paper-notebook/types";
import type { TimelineDocumentaryFixtureKey } from "../families/timeline-documentary/types";

const cinematicTypeKeys: Record<string, CinematicTypeFixtureKey> = {
  hook: "kinetic-hook",
  quote: "quote",
  transition: "chapter-reset",
};

const paperNotebookKeys: Record<string, PaperNotebookFixtureKey> = {
  notes: "research-notes",
  derivation: "derivation",
  checklist: "checklist",
};

const editorialCollageKeys: Record<string, EditorialCollageFixtureKey> = {
  normal: "source-montage",
  dense: "multi-source-evidence",
  edge: "visual-essay",
};

const timelineDocumentaryKeys: Record<string, TimelineDocumentaryFixtureKey> = {
  milestone: "milestones",
  "era-change": "evolution",
  conclusion: "roadmap",
};

export const cinematicTypeSceneKey = (
  legacyKey?: string,
): CinematicTypeFixtureKey =>
  cinematicTypeKeys[legacyKey ?? ""] ?? "chapter-reset";

export const paperNotebookSceneKey = (
  legacyKey?: string,
): PaperNotebookFixtureKey =>
  paperNotebookKeys[legacyKey ?? ""] ?? "research-notes";

export const editorialCollageSceneKey = (
  legacyKey?: string,
): EditorialCollageFixtureKey =>
  editorialCollageKeys[legacyKey ?? ""] ?? "source-montage";

export const timelineDocumentarySceneKey = (
  legacyKey?: string,
): TimelineDocumentaryFixtureKey =>
  timelineDocumentaryKeys[legacyKey ?? ""] ?? "chronology";
