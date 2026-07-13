import { CinematicTypeScene } from "./CinematicTypeScene";
import type { CinematicTypeFixtureKey } from "./types";

export const CINEMATIC_TYPE_COMPOSITION_ID = "CinematicTypeFamilyReview";

export type CinematicTypePreviewProps = {
  sceneKey: CinematicTypeFixtureKey;
};

export const CinematicTypePreview = ({
  sceneKey,
}: CinematicTypePreviewProps) => {
  return <CinematicTypeScene sceneKey={sceneKey} />;
};
