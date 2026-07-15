import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  createVideoInput,
  defaultVideoMap,
  type AudioTrack,
  type TimedCaptionPhrase,
  type TimedCaptions,
  type VideoInput,
  type VideoMap,
} from "./data";
import { resolveSkin, SkinContext } from "./skins";
import { ContinuousEnvironment } from "./mechanism";
import {
  resolveStyleRuntimeChoice,
  RuntimeStyleRenderer,
} from "./styles/runtime";
import {
  resolveTemplateAdapter,
  SceneShell,
  SubtitleBar,
} from "./templateRegistry";

export type MyCompositionProps = {
  videoMap?: VideoMap;
  audio?: AudioTrack;
  timedCaptions?: TimedCaptions;
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
      return {
        scene,
        sceneIndex: input.scenes.indexOf(scene),
        localFrame: frame - start,
        totalFrames,
      };
    }
    start = end;
  }

  const last = input.scenes[input.scenes.length - 1];
  return {
    scene: last,
    sceneIndex: Math.max(0, input.scenes.length - 1),
    localFrame: Math.max(0, last.durationFrames - 1),
    totalFrames,
  };
};

const extendLastSceneToAudio = (
  input: VideoInput,
  audio: AudioTrack | undefined,
  fps: number,
): VideoInput => {
  if (!audio || input.scenes.length === 0) {
    return input;
  }

  const sceneFrames = input.scenes.reduce(
    (sum, scene) => sum + scene.durationFrames,
    0,
  );
  const audioFrames = Math.ceil((audio.durationMs / 1000) * fps);
  if (audioFrames <= sceneFrames) {
    return input;
  }

  const scenes = [...input.scenes];
  const last = scenes[scenes.length - 1];
  scenes[scenes.length - 1] = {
    ...last,
    durationFrames: last.durationFrames + audioFrames - sceneFrames,
  };
  return { ...input, scenes };
};

const getSceneRangeMs = (
  videoMap: VideoMap,
  sceneIndex: number,
  audio: AudioTrack | undefined,
) => {
  let cursorMs = 0;
  let range = { startMs: 0, endMs: 0 };

  videoMap.scenes.forEach((scene, index) => {
    const startMs = scene.startMs ?? cursorMs;
    let endMs = scene.endMs ?? startMs + scene.durationSec * 1000;
    if (
      audio &&
      index === videoMap.scenes.length - 1 &&
      audio.durationMs > endMs
    ) {
      endMs = audio.durationMs;
    }
    if (index === sceneIndex) {
      range = { startMs, endMs };
    }
    cursorMs = endMs;
  });

  return range;
};

const localizeTimedPhrases = (
  phrases: TimedCaptionPhrase[],
  startMs: number,
  endMs: number,
): TimedCaptionPhrase[] =>
  phrases
    .filter((phrase) => phrase.endMs > startMs && phrase.startMs < endMs)
    .map((phrase) => ({
      ...phrase,
      startMs: phrase.startMs - startMs,
      endMs: phrase.endMs - startMs,
      words: phrase.words.map((word) => ({
        ...word,
        startMs: word.startMs === null ? null : word.startMs - startMs,
        endMs: word.endMs === null ? null : word.endMs - startMs,
      })),
    }));

export const MyComposition: React.FC<MyCompositionProps> = ({
  videoMap = defaultVideoMap,
  audio,
  timedCaptions,
}) => {
  const frame = useCurrentFrame();
  const fps = videoMap.video.fps;
  const baseInput = createVideoInput(videoMap);
  const input = extendLastSceneToAudio(baseInput, audio, fps);
  const skin = resolveSkin(input.theme);
  const { scene, sceneIndex, localFrame, totalFrames } = getSceneAtFrame(
    input,
    frame,
  );
  const sceneRange = getSceneRangeMs(videoMap, sceneIndex, audio);
  const timedPhrases = timedCaptions
    ? localizeTimedPhrases(
        timedCaptions.phrases,
        sceneRange.startMs,
        sceneRange.endMs,
      )
    : undefined;
  const zoom = interpolate(frame, [0, totalFrames], [1, 1.025], {
    extrapolateRight: "clamp",
  });

  if (videoMap.mode === "continuous") {
    return (
      <SkinContext.Provider value={skin}>
        {audio ? <Audio src={staticFile(audio.src)} /> : null}
        <AbsoluteFill
          style={{
            overflow: "hidden",
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
          data-runtime-family="continuous-mechanism"
          data-runtime-renderer="continuous"
          data-runtime-template={videoMap.environment.component}
          data-runtime-scene-key={scene.id}
          data-runtime-rejections=""
        >
          <ContinuousEnvironment
            environment={videoMap.environment}
            scenes={input.scenes}
            sceneIndex={sceneIndex}
          />
          <SubtitleBar
            scene={scene}
            localFrame={localFrame}
            timedPhrases={timedPhrases}
          />
        </AbsoluteFill>
      </SkinContext.Provider>
    );
  }

  const runtimeChoice = resolveStyleRuntimeChoice({
    scene,
    assets: input.assets,
  });
  const Adapter = resolveTemplateAdapter(runtimeChoice.templateId);
  const sceneWithRuntime = { ...scene, runtimeChoice };
  const renderedScene = (
    <RuntimeStyleRenderer
      choice={runtimeChoice}
      scene={sceneWithRuntime}
      localFrame={localFrame}
      durationFrames={scene.durationFrames}
      theme={input.theme}
      assets={input.assets}
      fallback={
        <Adapter
          scene={sceneWithRuntime}
          localFrame={localFrame}
          durationFrames={scene.durationFrames}
          theme={input.theme}
          assets={input.assets}
        />
      }
    />
  );

  return (
    <SkinContext.Provider value={skin}>
      {audio ? <Audio src={staticFile(audio.src)} /> : null}
      <AbsoluteFill
        style={{
          overflow: "hidden",
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
        }}
        data-runtime-family={
          runtimeChoice.selectedFamily ?? "legacy-templateId"
        }
        data-runtime-renderer={runtimeChoice.rendererKind}
        data-runtime-template={runtimeChoice.templateId}
        data-runtime-scene-key={runtimeChoice.familySceneKey ?? ""}
        data-runtime-rejections={runtimeChoice.rejected
          .map(
            (rejection) => `${rejection.family}:${rejection.codes.join("+")}`,
          )
          .join("|")}
      >
        {runtimeChoice.rendererKind === "family-renderer" ? (
          renderedScene
        ) : (
          <SceneShell
            scene={sceneWithRuntime}
            localFrame={localFrame}
            theme={input.theme}
            timedPhrases={timedPhrases}
            showTechnicalLabels={videoMap.debug?.showTechnicalLabels ?? false}
          >
            {renderedScene}
          </SceneShell>
        )}
      </AbsoluteFill>
    </SkinContext.Provider>
  );
};
