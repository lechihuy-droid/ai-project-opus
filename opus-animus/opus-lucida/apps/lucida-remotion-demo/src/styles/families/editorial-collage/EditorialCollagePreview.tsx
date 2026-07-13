import { EditorialCollageScene } from "./EditorialCollageScene";
import type { EditorialCollageFixtureKey } from "./types";

export const EDITORIAL_COLLAGE_COMPOSITION_ID = "EditorialCollageFamilyReview";

export type EditorialCollagePreviewProps = {
  sceneKey: EditorialCollageFixtureKey;
};

export const EditorialCollagePreview = ({ sceneKey }: EditorialCollagePreviewProps) => (
  <EditorialCollageScene sceneKey={sceneKey} />
);
