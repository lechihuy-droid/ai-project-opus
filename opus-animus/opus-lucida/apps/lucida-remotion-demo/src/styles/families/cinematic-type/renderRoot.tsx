import { Composition, registerRoot } from "remotion";
import {
  CINEMATIC_TYPE_COMPOSITION_ID,
  CinematicTypePreview,
} from "./CinematicTypePreview";

const RemotionCinematicTypeRoot = () => {
  return (
    <Composition
      id={CINEMATIC_TYPE_COMPOSITION_ID}
      component={CinematicTypePreview}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={90}
      defaultProps={{ sceneKey: "kinetic-hook" }}
    />
  );
};

registerRoot(RemotionCinematicTypeRoot);
