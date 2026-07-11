import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { videoInput } from "./data";

export const RemotionRoot: React.FC = () => {
  const durationInFrames = videoInput.scenes.reduce(
    (sum, scene) => sum + scene.durationFrames,
    0,
  );

  return (
    <>
      <Composition
        id="LucidaMotionDemo"
        component={MyComposition}
        durationInFrames={durationInFrames}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
