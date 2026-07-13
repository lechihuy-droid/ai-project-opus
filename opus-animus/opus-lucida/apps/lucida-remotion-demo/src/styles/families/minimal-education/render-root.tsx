import { Composition } from "remotion";
import definitionScene from "../../../../pipeline/fixtures/styles/minimal-education/definition-scene.json";
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
  const defaultScene = definitionScene as MinimalEducationScene;

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
