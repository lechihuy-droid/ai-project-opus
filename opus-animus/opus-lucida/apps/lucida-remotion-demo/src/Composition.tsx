import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  createVideoInput,
  defaultVideoMap,
  type VideoInput,
  type VideoMap,
} from "./data";
import { resolveSkin, SkinContext } from "./skins";
import { resolveTemplateAdapter, SceneShell } from "./templateRegistry";

export type MyCompositionProps = {
  videoMap?: VideoMap;
};

const getSceneAtFrame = (input: VideoInput, frame: number) => {
  const totalFrames = input.scenes.reduce(
    (sum, scene) => sum + scene.durationFrames,
    0,
  );
  let start = 0;

  for (const scene of input.scenes) {
    const end = start + scene.durationFrames;
    if (frame >= start && frame < end) {
      return { scene, localFrame: frame - start, totalFrames };
    }
    start = end;
  }

  const last = input.scenes[input.scenes.length - 1];
  return {
    scene: last,
    localFrame: Math.max(0, last.durationFrames - 1),
    totalFrames,
  };
};

export const MyComposition: React.FC<MyCompositionProps> = ({
  videoMap = defaultVideoMap,
}) => {
  const frame = useCurrentFrame();
  const input = createVideoInput(videoMap);
  const skin = resolveSkin(input.theme);
  const { scene, localFrame, totalFrames } = getSceneAtFrame(input, frame);
  const Adapter = resolveTemplateAdapter(scene.templateId);
  const zoom = interpolate(frame, [0, totalFrames], [1, 1.025], {
    extrapolateRight: "clamp",
  });

  return (
    <SkinContext.Provider value={skin}>
      <AbsoluteFill
        style={{
          overflow: "hidden",
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        <SceneShell scene={scene} localFrame={localFrame} theme={input.theme}>
          <Adapter
            scene={scene}
            localFrame={localFrame}
            durationFrames={scene.durationFrames}
            theme={input.theme}
            assets={input.assets}
          />
        </SceneShell>
      </AbsoluteFill>
    </SkinContext.Provider>
  );
};
