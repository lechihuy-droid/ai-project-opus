import { TechnicalEditorialScene } from "./TechnicalEditorialScene";
import type { TechnicalEditorialFixtureKey } from "./types";

export const TECHNICAL_EDITORIAL_COMPOSITION_ID =
  "TechnicalEditorialFamilyReview";

export type TechnicalEditorialPreviewProps = {
  sceneKey: TechnicalEditorialFixtureKey;
};

export const TechnicalEditorialPreview = ({
  sceneKey,
}: TechnicalEditorialPreviewProps) => {
  return <TechnicalEditorialScene sceneKey={sceneKey} />;
};
