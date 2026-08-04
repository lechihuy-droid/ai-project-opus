import { paperNotebookChecklistFixture } from "./checklist.fixture";
import { paperNotebookDerivationFixture } from "./derivation.fixture";
import { paperNotebookAnnotatedPaperFixture } from "./annotated-paper.fixture";
import { paperNotebookLabLogFixture } from "./lab-log.fixture";
import { paperNotebookResearchNotesFixture } from "./research-notes.fixture";

export const paperNotebookFixtures = {
  "research-notes": paperNotebookResearchNotesFixture,
  "derivation": paperNotebookDerivationFixture,
  "annotated-paper": paperNotebookAnnotatedPaperFixture,
  "checklist": paperNotebookChecklistFixture,
  "lab-log": paperNotebookLabLogFixture,
};

export type { PaperNotebookFixture, PaperNotebookFixtureKey } from "../../../../src/styles/families/paper-notebook";
