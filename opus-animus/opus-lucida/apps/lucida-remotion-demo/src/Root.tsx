import "./index.css";
import { CalculateMetadataFunction, Composition } from "remotion";
import { MyComposition, type MyCompositionProps } from "./Composition";
import { createVideoInput, defaultVideoMap, videoMeta } from "./data";

const calculateMetadata: CalculateMetadataFunction<MyCompositionProps> = ({
  props,
}) => {
  const input = createVideoInput(props.videoMap ?? defaultVideoMap);
  const fps = props.videoMap?.video.fps ?? defaultVideoMap.video.fps;
  const sceneDurationMs =
    (input.scenes.reduce((sum, scene) => sum + scene.durationFrames, 0) /
      fps) *
    1000;
  if (props.audio && Math.abs(props.audio.durationMs - sceneDurationMs) > 1000) {
    console.warn(
      `Audio duration differs from the scene timeline by ${Math.round(props.audio.durationMs - sceneDurationMs)}ms.`,
    );
  }
  return {
    durationInFrames: props.audio
      ? Math.ceil((props.audio.durationMs / 1000) * fps)
      : input.scenes.reduce(
          (sum, scene) => sum + scene.durationFrames,
          0,
        ),
    fps,
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
