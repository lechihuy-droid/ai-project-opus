import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { videoInput } from "./data";
import { resolveTemplateAdapter, SceneShell } from "./templateRegistry";

const totalFrames = videoInput.scenes.reduce(
  (sum, scene) => sum + scene.durationFrames,
  0,
);

const getSceneAtFrame = (frame: number) => {
  let start = 0;

  for (const scene of videoInput.scenes) {
    const end = start + scene.durationFrames;
    if (frame >= start && frame < end) {
      return { scene, localFrame: frame - start, start, end };
    }
    start = end;
  }

  const last = videoInput.scenes[videoInput.scenes.length - 1];
  return {
    scene: last,
    localFrame: last.durationFrames - 1,
    start: totalFrames - last.durationFrames,
    end: totalFrames,
  };
};

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { scene, localFrame } = getSceneAtFrame(frame);
  const Adapter = resolveTemplateAdapter(scene.templateId);
  const zoom = interpolate(frame, [0, totalFrames], [1, 1.025], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        transform: `scale(${zoom})`,
        transformOrigin: "center center",
      }}
    >
      <SceneShell scene={scene} localFrame={localFrame} theme={videoInput.theme}>
        <Adapter
          scene={scene}
          localFrame={localFrame}
          durationFrames={scene.durationFrames}
          theme={videoInput.theme}
          assets={videoInput.assets}
        />
      </SceneShell>
    </AbsoluteFill>
  );
};
