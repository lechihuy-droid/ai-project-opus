import "./index.css";
import { CalculateMetadataFunction, Composition } from "remotion";
import { MyComposition, type MyCompositionProps } from "./Composition";
import { createVideoInput, defaultVideoMap, videoMeta } from "./data";

const calculateMetadata: CalculateMetadataFunction<MyCompositionProps> = ({
  props,
}) => {
  const input = createVideoInput(props.videoMap ?? defaultVideoMap);
  return {
    durationInFrames: input.scenes.reduce(
      (sum, scene) => sum + scene.durationFrames,
      0,
    ),
    fps: props.videoMap?.video.fps ?? defaultVideoMap.video.fps,
    width: props.videoMap?.video.width ?? defaultVideoMap.video.width,
    height: props.videoMap?.video.height ?? defaultVideoMap.video.height,
  };
};

export const RemotionRoot: React.FC = () => {
  const input = createVideoInput(defaultVideoMap);
  const durationInFrames = input.scenes.reduce(
    (sum, scene) => sum + scene.durationFrames,
    0,
  );

  return (
    <Composition
      id="LucidaMotionDemo"
      component={MyComposition}
      durationInFrames={durationInFrames}
      fps={videoMeta.fps}
      width={videoMeta.width}
      height={videoMeta.height}
      defaultProps={{ videoMap: defaultVideoMap }}
      calculateMetadata={calculateMetadata}
    />
  );
};
