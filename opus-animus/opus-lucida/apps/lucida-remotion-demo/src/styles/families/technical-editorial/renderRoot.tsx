import { registerRoot } from "remotion";
import { Composition } from "remotion";
import {
  TECHNICAL_EDITORIAL_COMPOSITION_ID,
  TechnicalEditorialPreview,
} from "./TechnicalEditorialPreview";

const RemotionTechnicalEditorialRoot = () => {
  return (
    <Composition
      id={TECHNICAL_EDITORIAL_COMPOSITION_ID}
      component={TechnicalEditorialPreview}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={90}
      defaultProps={{ sceneKey: "normal" }}
    />
  );
};

registerRoot(RemotionTechnicalEditorialRoot);
