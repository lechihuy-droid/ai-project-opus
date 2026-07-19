import { Composition } from "remotion";
import singleConceptScene from "../../../../pipeline/fixtures/styles/minimal-education/single-concept.scene.json";
import { MinimalEducationFamilyComposition } from "./renderer";
import type {
  MinimalEducationCompositionProps,
  MinimalEducationScene,
} from "./types";

const calculateMetadata = ({
  props,
}: {
  props: MinimalEducationCompositionProps;
}) => ({
  durationInFrames: props.scene.durationInFrames,
  fps: 30,
  width: 1080,
  height: 1920,
});

export const MinimalEducationRemotionRoot = () => {
  const defaultScene = singleConceptScene as MinimalEducationScene;

  return (
    <Composition
      id="MinimalEducationFamily"
      component={MinimalEducationFamilyComposition}
      durationInFrames={defaultScene.durationInFrames}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        scene: defaultScene,
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
