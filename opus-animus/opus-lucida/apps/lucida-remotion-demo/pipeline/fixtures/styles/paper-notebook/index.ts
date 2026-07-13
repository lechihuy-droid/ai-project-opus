import { paperNotebookChecklistFixture } from "./checklist.fixture";
import { paperNotebookDerivationFixture } from "./derivation.fixture";
import { paperNotebookNotesFixture } from "./notes.fixture";

export const paperNotebookFixtures = { notes: paperNotebookNotesFixture, derivation: paperNotebookDerivationFixture, checklist: paperNotebookChecklistFixture };

export type { PaperNotebookFixture, PaperNotebookFixtureKey } from "../../../../src/styles/families/paper-notebook";
