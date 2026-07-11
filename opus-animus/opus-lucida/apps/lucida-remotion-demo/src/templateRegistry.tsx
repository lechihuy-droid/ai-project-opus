import type { ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import type {
  DiagramLink,
  DiagramNode,
  SceneContentItem,
  ScenePanel,
  Tone,
  VideoInput,
  VideoScene,
  VisualAsset,
} from "./data";

type Theme = VideoInput["theme"];

export type TemplateAdapterProps = {
  scene: VideoScene;
  localFrame: number;
  durationFrames: number;
  theme: Theme;
  assets: VisualAsset[];
};

type TemplateAdapter = React.FC<TemplateAdapterProps>;

const toneMap: Record<
  Tone,
  {
    fill: string;
    stroke: string;
    glow: string;
    text: string;
  }
> = {
  warm: {
    fill: "rgba(255,154,67,0.17)",
    stroke: "rgba(255,154,67,0.64)",
    glow: "rgba(255,154,67,0.36)",
    text: "#fff0df",
  },
  cool: {
    fill: "rgba(122,192,255,0.12)",
    stroke: "rgba(154,211,255,0.42)",
    glow: "rgba(122,192,255,0.18)",
    text: "#edf8ff",
  },
  danger: {
    fill: "rgba(255,92,92,0.13)",
    stroke: "rgba(255,108,108,0.62)",
    glow: "rgba(255,108,108,0.25)",
    text: "#ffe8e3",
  },
  neutral: {
    fill: "rgba(255,255,255,0.09)",
    stroke: "rgba(255,255,255,0.16)",
    glow: "rgba(255,255,255,0.08)",
    text: "#f8f3ee",
  },
};

const stageStyle = {
  position: "absolute",
  left: 68,
  right: 68,
  top: 480,
  height: 800,
} as const;

const clampProgress = (value: number) => Math.max(0, Math.min(1, value));

const ease = (localFrame: number, start: number, end: number) =>
  interpolate(localFrame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const getItems = (scene: VideoScene): SceneContentItem[] => {
  if (scene.content.items && scene.content.items.length > 0) {
    return scene.content.items;
  }

  if (scene.content.steps && scene.content.steps.length > 0) {
    return scene.content.steps;
  }

  return scene.bullets.map((label) => ({ label }));
};

const getSteps = (scene: VideoScene): SceneContentItem[] => {
  if (scene.content.steps && scene.content.steps.length > 0) {
    return scene.content.steps;
  }

  return getItems(scene).slice(0, 5);
};

const getPanels = (scene: VideoScene): ScenePanel[] => {
  if (scene.content.panels && scene.content.panels.length >= 2) {
    return scene.content.panels.slice(0, 2);
  }

  const items = getItems(scene);
  return [
    {
      title: items[0]?.title ?? items[0]?.label ?? scene.title,
      body: items[0]?.body ?? items[0]?.note,
      tone: items[0]?.tone ?? "neutral",
    },
    {
      title: items[1]?.title ?? items[1]?.label ?? scene.subtitle.text,
      body: items[1]?.body ?? items[1]?.note,
      tone: items[1]?.tone ?? "warm",
    },
  ];
};

const labelForItem = (item: SceneContentItem) =>
  item.title ?? item.label ?? item.body ?? "";

const bodyForItem = (item: SceneContentItem) => item.body ?? item.note ?? "";

const MatrixEffect: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { width, height } = useVideoConfig();
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/{}";
  const columns = 44;

  return (
    <AbsoluteFill style={{ opacity: 0.18 }}>
      {Array.from({ length: columns }, (_, index) => {
        const x = (index / columns) * width;
        const speed = 3 + (index % 7);
        const y = ((index * 47 + localFrame * speed) % (height + 120)) - 80;
        const charIndex = Math.floor((localFrame / 4 + index * 3) % characters.length);

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: x,
              top: y,
              color: "rgba(255,190,116,0.84)",
              fontSize: 24,
              fontFamily: "Consolas, monospace",
              fontWeight: 700,
              textShadow: "0 0 10px rgba(255,138,61,0.68)",
            }}
          >
            {characters[charIndex]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const StarfieldEffect: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { width, height, fps } = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2;
  const cycleLength = fps * 5;

  return (
    <AbsoluteFill style={{ opacity: 0.34 }}>
      {Array.from({ length: 90 }, (_, index) => {
        const angle = ((index * 137.508) % 360) * (Math.PI / 180);
        const seedRadius = ((index * 31 + 17) % 50) / 50;
        const speed = 0.5 + ((index * 7 + 3) % 10) / 10;
        const progress = ((localFrame * speed + index * 15) % cycleLength) / cycleLength;
        const radius = seedRadius * 20 + progress * Math.max(cx, cy) * 1.18;
        const size = (1 + ((index * 13 + 5) % 3)) * (1 + progress * 2);
        const opacity = Math.min(progress * 4, 1) * Math.max(1 - progress * 0.8, 0.2);

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: cx + Math.cos(angle) * radius,
              top: cy + Math.sin(angle) * radius,
              width: size,
              height: size,
              borderRadius: "50%",
              background: "rgba(255,244,230,0.95)",
              opacity,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 10px rgba(255,154,67,0.44)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const BokehEffect: React.FC<{ localFrame: number; accent: string }> = ({
  localFrame,
  accent,
}) => (
  <AbsoluteFill style={{ opacity: 0.24 }}>
    {Array.from({ length: 18 }, (_, index) => {
      const x = 70 + ((index * 173) % 940);
      const y = 150 + ((index * 281 + localFrame * (index % 3 + 1)) % 1500);
      const size = 80 + ((index * 37) % 170);
      const wobble = Math.sin((localFrame + index * 22) / 34) * 14;

      return (
        <div
          key={index}
          style={{
            position: "absolute",
            left: x + wobble,
            top: y,
            width: size,
            height: size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}45, transparent 68%)`,
            filter: "blur(8px)",
          }}
        />
      );
    })}
  </AbsoluteFill>
);

const GridPulseEffect: React.FC<{ localFrame: number; accent: string }> = ({
  localFrame,
  accent,
}) => {
  const pulse = interpolate(localFrame % 90, [0, 45, 90], [0.08, 0.2, 0.08]);

  return (
    <AbsoluteFill
      style={{
        opacity: 0.36,
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
        boxShadow: `inset 0 0 ${120 + pulse * 160}px ${accent}33`,
      }}
    />
  );
};

const NoiseGrainEffect: React.FC<{ localFrame: number }> = ({ localFrame }) => (
  <AbsoluteFill
    style={{
      opacity: 0.14,
      backgroundImage:
        "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), radial-gradient(rgba(255,154,67,0.16) 1px, transparent 1px)",
      backgroundPosition: `${localFrame % 17}px ${localFrame % 11}px, ${localFrame % 13}px ${localFrame % 19}px`,
      backgroundSize: "7px 7px, 11px 11px",
      mixBlendMode: "screen",
    }}
  />
);

const GradientShiftEffect: React.FC<{ localFrame: number; accent: string }> = ({
  localFrame,
  accent,
}) => {
  const x = 50 + Math.sin(localFrame / 45) * 22;
  const y = 34 + Math.cos(localFrame / 58) * 18;

  return (
    <AbsoluteFill
      style={{
        opacity: 0.4,
        background: `radial-gradient(circle at ${x}% ${y}%, ${accent}4f, transparent 30%), radial-gradient(circle at ${100 - x}% 72%, rgba(255,224,184,0.20), transparent 26%)`,
      }}
    />
  );
};

const BackgroundEffect: React.FC<{
  effectId?: string;
  localFrame: number;
  accent: string;
}> = ({ effectId, localFrame, accent }) => {
  if (effectId === "matrix-rain") {
    return <MatrixEffect localFrame={localFrame} />;
  }

  if (effectId === "starfield") {
    return <StarfieldEffect localFrame={localFrame} />;
  }

  if (effectId === "bokeh-circles") {
    return <BokehEffect localFrame={localFrame} accent={accent} />;
  }

  if (effectId === "noise-grain") {
    return <NoiseGrainEffect localFrame={localFrame} />;
  }

  if (effectId === "grid-pulse") {
    return <GridPulseEffect localFrame={localFrame} accent={accent} />;
  }

  if (effectId === "gradient-shift") {
    return <GradientShiftEffect localFrame={localFrame} accent={accent} />;
  }

  return null;
};

const GlowBackground: React.FC<{
  scene: VideoScene;
  localFrame: number;
  theme: Theme;
}> = ({ scene, localFrame, theme }) => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(circle at 50% 18%, rgba(255,154,67,0.23), transparent 27%), radial-gradient(circle at 12% 12%, rgba(255,226,185,0.07), transparent 20%), linear-gradient(160deg, #090807 0%, #11100d 48%, #1b120d 100%)",
    }}
  >
    <BackgroundEffect
      effectId={scene.backgroundEffect}
      localFrame={localFrame}
      accent={scene.accent}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), transparent 20%, transparent 78%, rgba(255,154,67,0.08))",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 120px ${theme.accent}18`,
      }}
    />
  </AbsoluteFill>
);

const Header: React.FC<{
  scene: VideoScene;
  localFrame: number;
  theme: Theme;
}> = ({ scene, localFrame, theme }) => {
  const titleIn = ease(localFrame, 4, 22);
  const subtitleIn = ease(localFrame, 14, 34);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 86,
          left: 76,
          right: 76,
          fontSize: 22,
          textTransform: "uppercase",
          color: "rgba(248,243,238,0.48)",
          fontWeight: 800,
        }}
      >
        {scene.kicker}
      </div>
      <div
        style={{
          position: "absolute",
          top: 132,
          left: 76,
          right: 76,
          maxWidth: 960,
          fontSize: scene.title.length > 48 ? 38 : 44,
          fontWeight: 850,
          lineHeight: 1.12,
          color: theme.foreground,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [18, 0])}px)`,
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          position: "absolute",
          top: 292,
          left: 76,
          right: 76,
          maxWidth: 960,
          fontSize: 22,
          lineHeight: 1.42,
          color: theme.muted,
          opacity: subtitleIn,
          transform: `translateY(${interpolate(subtitleIn, [0, 1], [14, 0])}px)`,
        }}
      >
        {scene.content.subtitle}
      </div>
    </>
  );
};

const SubtitleBar: React.FC<{
  scene: VideoScene;
  localFrame: number;
}> = ({ scene, localFrame }) => {
  if (scene.subtitleMode === "none" || scene.narration.length === 0) {
    return null;
  }

  const segmentLength = scene.durationFrames / scene.narration.length;
  const index = Math.min(
    scene.narration.length - 1,
    Math.floor(localFrame / segmentLength),
  );
  const segmentFrame = localFrame - index * segmentLength;
  const text = scene.narration[index] ?? "";
  const segmentIn = interpolate(ease(segmentFrame, 0, 10), [0, 1], [0.88, 1]);
  const progress = (localFrame + 1) / scene.durationFrames;

  return (
    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        bottom: 88,
        minHeight: 190,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 40px 34px",
        borderRadius: 24,
        background: "linear-gradient(180deg, rgba(9,8,7,0.80), rgba(9,8,7,0.60))",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow:
          "0 18px 48px rgba(0,0,0,0.36), 0 0 30px rgba(255,138,61,0.12)",
      }}
    >
      <div
        style={{
          color: "#fff6ed",
          fontSize: text.length > 92 ? 28 : 32,
          lineHeight: 1.25,
          fontWeight: 750,
          textAlign: "center",
          maxWidth: 900,
          opacity: segmentIn,
          transform: `translateY(${interpolate(segmentIn, [0, 1], [10, 0])}px)`,
        }}
      >
        {text}
      </div>
      <div
        style={{
          position: "absolute",
          left: 28,
          right: 28,
          bottom: 18,
          height: 5,
          borderRadius: 999,
          background: "rgba(255,255,255,0.10)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: "linear-gradient(90deg, #ff8a3d, #ffe1b8)",
            boxShadow: "0 0 18px rgba(255,154,67,0.75)",
          }}
        />
      </div>
    </div>
  );
};

const TransitionOverlay: React.FC<{
  scene: VideoScene;
  localFrame: number;
}> = ({ scene, localFrame }) => {
  const transitionFrames = 14;
  const start = scene.durationFrames - transitionFrames;
  const progress = ease(localFrame, start, scene.durationFrames - 1);

  if (progress <= 0 || !scene.transitionOut) {
    return null;
  }

  if (scene.transitionOut === "slide-wipe") {
    return (
      <AbsoluteFill
        style={{
          background: "linear-gradient(90deg, rgba(255,138,61,0.96), rgba(255,224,184,0.72))",
          transform: `translateX(${interpolate(progress, [0, 1], [-105, 105])}%)`,
        }}
      />
    );
  }

  if (scene.transitionOut === "whip-pan") {
    return (
      <AbsoluteFill
        style={{
          background: "rgba(255,154,67,0.22)",
          filter: "blur(18px)",
          opacity: progress,
          transform: `translateX(${interpolate(progress, [0, 1], [0, 80])}px) scale(${1 + progress * 0.05})`,
        }}
      />
    );
  }

  if (scene.transitionOut === "zoom-through") {
    return (
      <AbsoluteFill
        style={{
          border: `${Math.round(progress * 520)}px solid rgba(255,154,67,0.22)`,
          opacity: progress,
        }}
      />
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: "#090807",
        opacity: progress * 0.7,
      }}
    />
  );
};

export const SceneShell: React.FC<{
  scene: VideoScene;
  localFrame: number;
  theme: Theme;
  children: ReactNode;
}> = ({ scene, localFrame, theme, children }) => {
  const sceneFade =
    ease(localFrame, 0, 8) *
    interpolate(localFrame, [scene.durationFrames - 12, scene.durationFrames - 1], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <GlowBackground scene={scene} localFrame={localFrame} theme={theme} />
      <div style={{ opacity: sceneFade }}>
        <Header scene={scene} localFrame={localFrame} theme={theme} />
        {children}
        <SubtitleBar scene={scene} localFrame={localFrame} />
        <div
          style={{
            position: "absolute",
            left: 76,
            bottom: 52,
            right: 76,
            height: 2,
            background: "rgba(255,255,255,0.08)",
          }}
        />
      </div>
      <TransitionOverlay scene={scene} localFrame={localFrame} />
    </AbsoluteFill>
  );
};

const HeroTitleAdapter: React.FC<TemplateAdapterProps> = ({
  scene,
  localFrame,
  theme,
}) => {
  const { fps } = useVideoConfig();
  const titleY = spring({
    frame: localFrame,
    fps,
    from: 52,
    to: 0,
    durationInFrames: 40,
    config: { damping: 14, mass: 0.8 },
  });
  const titleOpacity = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 30,
  });
  const underlineWidth = interpolate(localFrame, [18, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chips = getItems(scene).slice(0, 4);

  return (
    <div style={stageStyle}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 70,
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontSize: scene.headline.length > 34 ? 58 : 68,
            lineHeight: 1.05,
            color: theme.foreground,
            fontWeight: 900,
            textShadow: `0 0 42px ${scene.accent}55`,
          }}
        >
          {scene.headline}
        </div>
        <div
          style={{
            width: 520 * underlineWidth,
            height: 6,
            margin: "34px auto 0",
            borderRadius: 999,
            background: "linear-gradient(90deg, #ff8a3d, #ffe1b8)",
            boxShadow: `0 0 28px ${scene.accent}99`,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 120,
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(1, chips.length)}, 1fr)`,
          gap: 16,
        }}
      >
        {chips.map((item, index) => {
          const progress = ease(localFrame, 42 + index * 5, 64 + index * 5);

          return (
            <div
              key={`${scene.id}-chip-${index}`}
              style={{
                minHeight: 118,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.12)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: progress,
                transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
                boxShadow: `0 0 28px ${scene.accent}1f`,
              }}
            >
              <div
                style={{
                  color: theme.foreground,
                  fontSize: 25,
                  fontWeight: 820,
                  textAlign: "center",
                }}
              >
                {labelForItem(item)}
              </div>
              {item.note ? (
                <div
                  style={{
                    color: theme.muted,
                    fontSize: 15,
                    marginTop: 6,
                    textAlign: "center",
                  }}
                >
                  {item.note}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CodePanelAdapter: React.FC<TemplateAdapterProps> = ({ scene, localFrame }) => {
  const lines = scene.content.lines ?? [];
  const highlighted = new Set(scene.content.highlights ?? []);
  const lineHeight = lines.length > 6 ? 58 : 68;

  return (
    <div style={stageStyle}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 42,
          height: 620,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "linear-gradient(180deg, rgba(12,11,10,0.92), rgba(26,18,12,0.86))",
          boxShadow: "0 28px 70px rgba(0,0,0,0.42), 0 0 38px rgba(255,138,61,0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 72,
            display: "flex",
            alignItems: "center",
            padding: "0 28px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ display: "flex", gap: 10, marginRight: 18 }}>
            {["#ff6b5f", "#ffbd4a", "#44d07b"].map((color) => (
              <div
                key={color}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: color,
                }}
              />
            ))}
          </div>
          <div
            style={{
              color: "rgba(248,243,238,0.70)",
              fontSize: 19,
              fontFamily: "Consolas, monospace",
              fontWeight: 700,
            }}
          >
            {scene.content.codeTitle}
          </div>
        </div>
        <div style={{ padding: "32px 34px" }}>
          {lines.map((line, index) => {
            const lineIn = ease(localFrame, 12 + index * 5, 26 + index * 5);
            const isHighlighted = highlighted.has(index) || highlighted.has(index + 1);

            return (
              <div
                key={`${scene.id}-line-${index}`}
                style={{
                  height: lineHeight,
                  display: "flex",
                  alignItems: "center",
                  opacity: lineIn,
                  transform: `translateX(${interpolate(lineIn, [0, 1], [-24, 0])}px)`,
                  fontFamily: "Consolas, monospace",
                  fontSize: 30,
                  color: isHighlighted ? "#fff0dc" : "rgba(248,243,238,0.68)",
                  background: isHighlighted
                    ? "linear-gradient(90deg, rgba(255,138,61,0.22), transparent)"
                    : "transparent",
                  borderLeft: isHighlighted ? `4px solid ${scene.accent}` : "4px solid transparent",
                  paddingLeft: 18,
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.28)", width: 46 }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{line}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 36,
          right: 36,
          bottom: 22,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        {getItems(scene)
          .slice(0, 4)
          .map((item, index) => {
            const progress = ease(localFrame, 54 + index * 4, 70 + index * 4);

            return (
              <div
                key={`${scene.id}-vendor-${index}`}
                style={{
                  minHeight: 92,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.055)",
                  padding: 16,
                  opacity: progress,
                  transform: `translateY(${interpolate(progress, [0, 1], [16, 0])}px)`,
                }}
              >
                <div style={{ color: "#fff3e7", fontSize: 19, fontWeight: 800 }}>
                  {labelForItem(item)}
                </div>
                <div
                  style={{
                    color: "rgba(248,243,238,0.58)",
                    fontSize: 13,
                    marginTop: 6,
                    lineHeight: 1.25,
                  }}
                >
                  {item.note}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

const SplitScreenAdapter: React.FC<TemplateAdapterProps> = ({
  scene,
  localFrame,
  theme,
}) => {
  const { fps } = useVideoConfig();
  const panels = getPanels(scene);
  const leftSlide = spring({
    frame: localFrame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const rightSlide = spring({
    frame: localFrame - 5,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const dividerOpacity = ease(localFrame, 18, 30);

  return (
    <div style={stageStyle}>
      <div
        style={{
          position: "absolute",
          inset: "34px 0 76px",
          display: "flex",
          borderRadius: 26,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 28px 62px rgba(0,0,0,0.35)",
        }}
      >
        {panels.map((panel, index) => {
          const tone = toneMap[panel.tone ?? (index === 0 ? "neutral" : "warm")];
          const translateX =
            index === 0
              ? interpolate(leftSlide, [0, 1], [-100, 0])
              : interpolate(rightSlide, [0, 1], [100, 0]);

          return (
            <div
              key={`${scene.id}-panel-${index}`}
              style={{
                width: "50%",
                height: "100%",
                transform: `translateX(${translateX}%)`,
                background: `linear-gradient(155deg, ${tone.fill}, rgba(255,255,255,0.035))`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: 48,
                borderRight: index === 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 23,
                  color: tone.stroke,
                  fontWeight: 900,
                  marginBottom: 22,
                }}
              >
                {index === 0 ? "BEFORE" : "AFTER"}
              </div>
              <div
                style={{
                  color: theme.foreground,
                  fontSize: panel.title.length > 18 ? 36 : 42,
                  fontWeight: 880,
                  lineHeight: 1.08,
                }}
              >
                {panel.title}
              </div>
              <div
                style={{
                  color: theme.muted,
                  fontSize: 21,
                  lineHeight: 1.35,
                  marginTop: 24,
                }}
              >
                {panel.body}
              </div>
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            top: "10%",
            bottom: "10%",
            left: "50%",
            width: 2,
            background:
              "linear-gradient(180deg, transparent, rgba(255,244,230,0.86), transparent)",
            opacity: dividerOpacity,
          }}
        />
      </div>
    </div>
  );
};

const AnimatedListAdapter: React.FC<TemplateAdapterProps> = ({
  scene,
  localFrame,
  theme,
}) => {
  const { fps } = useVideoConfig();
  const items = getItems(scene).slice(0, 6);

  return (
    <div style={stageStyle}>
      <div
        style={{
          position: "absolute",
          inset: "0 0 40px",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 18,
          alignContent: "center",
        }}
      >
        {items.map((item, index) => {
          const tone = toneMap[item.tone ?? "neutral"];
          const progress = spring({
            frame: localFrame - index * 5,
            fps,
            from: 0,
            to: 1,
            config: { damping: 12, mass: 0.5 },
          });
          const opacity = clampProgress(progress);

          return (
            <div
              key={`${scene.id}-item-${index}`}
              style={{
                minHeight: 178,
                borderRadius: 20,
                border: `1px solid ${tone.stroke}`,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
                boxShadow: `0 18px 44px rgba(0,0,0,0.28), 0 0 28px ${tone.glow}`,
                padding: 24,
                opacity,
                transform: `translateX(${interpolate(opacity, [0, 1], [-42, 0])}px) scale(${interpolate(opacity, [0, 1], [0.92, 1])})`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${scene.accent}, rgba(255,255,255,0.18))`,
                    color: "#140d08",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  {item.number ?? String(index + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    color: theme.foreground,
                    fontSize: 28,
                    fontWeight: 860,
                    lineHeight: 1.05,
                  }}
                >
                  {labelForItem(item)}
                </div>
              </div>
              <div
                style={{
                  color: theme.muted,
                  fontSize: 18,
                  lineHeight: 1.34,
                }}
              >
                {bodyForItem(item)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProgressStepsAdapter: React.FC<TemplateAdapterProps> = ({
  scene,
  localFrame,
  theme,
}) => {
  const { fps } = useVideoConfig();
  const steps = getSteps(scene).slice(0, 5);
  const framesPerStep = Math.max(16, Math.floor(scene.durationFrames / Math.max(1, steps.length)));

  return (
    <div style={stageStyle}>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 24,
          bottom: 76,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 26,
        }}
      >
        {steps.map((step, index) => {
          const stepStart = index * framesPerStep;
          const fillProgress = ease(localFrame, stepStart, stepStart + framesPerStep * 0.65);
          const lineProgress = ease(
            localFrame,
            stepStart + framesPerStep * 0.45,
            stepStart + framesPerStep,
          );
          const pulse = spring({
            frame: localFrame - stepStart,
            fps,
            config: { damping: 8, stiffness: 150, mass: 0.4 },
          });
          const activeScale = fillProgress > 0 && fillProgress < 1 ? 0.9 + pulse * 0.18 : 1;

          return (
            <div
              key={`${scene.id}-step-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "86px 1fr",
                columnGap: 24,
                minHeight: 118,
                position: "relative",
              }}
            >
              <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                <div
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: "50%",
                    border: `3px solid ${fillProgress > 0 ? scene.accent : "rgba(255,255,255,0.18)"}`,
                    background:
                      fillProgress > 0
                        ? "linear-gradient(135deg, #ff8a3d, #ffe1b8)"
                        : "rgba(255,255,255,0.04)",
                    color: fillProgress > 0 ? "#130d08" : "rgba(255,255,255,0.52)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 900,
                    transform: `scale(${activeScale})`,
                    boxShadow: fillProgress > 0 ? `0 0 28px ${scene.accent}66` : "none",
                  }}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 ? (
                  <div
                    style={{
                      position: "absolute",
                      top: 66,
                      bottom: -32,
                      width: 4,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.10)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: `${lineProgress * 100}%`,
                        width: "100%",
                        borderRadius: 999,
                        background: "linear-gradient(180deg, #ff8a3d, #ffe1b8)",
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.055)",
                  padding: "22px 26px",
                  opacity: fillProgress,
                  transform: `translateY(${interpolate(fillProgress, [0, 1], [14, 0])}px)`,
                }}
              >
                <div
                  style={{
                    color: theme.foreground,
                    fontSize: 30,
                    fontWeight: 850,
                    lineHeight: 1.1,
                  }}
                >
                  {labelForItem(step)}
                </div>
                <div
                  style={{
                    color: theme.muted,
                    fontSize: 18,
                    lineHeight: 1.3,
                    marginTop: 8,
                  }}
                >
                  {bodyForItem(step)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const QuoteCardAdapter: React.FC<TemplateAdapterProps> = ({
  scene,
  localFrame,
  theme,
}) => {
  const quoteOpacity = ease(localFrame, 0, 18);
  const textOpacity = ease(localFrame, 10, 34);
  const attributionOpacity = ease(localFrame, 34, 52);
  const quote = scene.content.quote ?? scene.headline;

  return (
    <div style={stageStyle}>
      <div
        style={{
          position: "absolute",
          inset: "50px 24px 120px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: scene.accent,
            fontSize: 138,
            lineHeight: 0.8,
            fontFamily: "Georgia, serif",
            opacity: quoteOpacity,
          }}
        >
          "
        </div>
        <div
          style={{
            color: theme.foreground,
            fontSize: quote.length > 80 ? 36 : 44,
            fontWeight: 700,
            lineHeight: 1.28,
            maxWidth: 820,
            opacity: textOpacity,
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
          }}
        >
          {quote}
        </div>
        <div
          style={{
            color: theme.muted,
            fontSize: 22,
            fontWeight: 700,
            marginTop: 34,
            opacity: attributionOpacity,
            transform: `translateX(${interpolate(attributionOpacity, [0, 1], [40, 0])}px)`,
          }}
        >
          {scene.content.attribution ?? scene.footer}
        </div>
      </div>
    </div>
  );
};

const ImageCarouselAdapter: React.FC<TemplateAdapterProps> = ({ scene, localFrame }) => {
  const { fps } = useVideoConfig();
  const items = getItems(scene).slice(0, 5);
  const cycleLength = fps * 1.7;
  const progress = (localFrame % Math.max(1, cycleLength * items.length)) / cycleLength;

  return (
    <div style={stageStyle}>
      <div
        style={{
          position: "absolute",
          inset: "42px 0 90px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {items.map((item, index) => {
          const offset = index - progress;
          const normalizedOffset =
            offset < -2 ? offset + items.length : offset > 2 ? offset - items.length : offset;
          const scale = interpolate(Math.abs(normalizedOffset), [0, 1, 2], [1, 0.76, 0.56], {
            extrapolateRight: "clamp",
          });
          const opacity = interpolate(Math.abs(normalizedOffset), [0, 1, 2], [1, 0.55, 0.18], {
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={`${scene.id}-carousel-${index}`}
              style={{
                position: "absolute",
                width: 300,
                height: 440,
                borderRadius: 22,
                border: "1px solid rgba(255,255,255,0.12)",
                background: `linear-gradient(150deg, ${scene.accent}45, rgba(255,255,255,0.06))`,
                boxShadow: "0 26px 60px rgba(0,0,0,0.35), 0 0 28px rgba(255,138,61,0.18)",
                transform: `translateX(${normalizedOffset * 280}px) scale(${scale})`,
                opacity,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 22,
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
              <div
                style={{
                  color: "#fff4e8",
                  fontSize: 31,
                  fontWeight: 850,
                  lineHeight: 1.08,
                  position: "relative",
                }}
              >
                {labelForItem(item)}
              </div>
              <div
                style={{
                  color: "rgba(248,243,238,0.66)",
                  fontSize: 18,
                  lineHeight: 1.3,
                  marginTop: 12,
                  position: "relative",
                }}
              >
                {bodyForItem(item)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatCounterAdapter: React.FC<TemplateAdapterProps> = ({
  scene,
  localFrame,
  theme,
}) => {
  const { fps } = useVideoConfig();
  const metric = scene.content.metrics?.[0] ?? {
    label: scene.headline,
    value: getItems(scene).length,
    unit: "",
  };
  const scale = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const count = Math.round(
    interpolate(localFrame, [10, 62], [0, metric.value], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const detailOpacity = ease(localFrame, 38, 56);

  return (
    <div style={stageStyle}>
      <div
        style={{
          position: "absolute",
          inset: "92px 110px 130px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 26,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.035))",
          boxShadow: "0 30px 72px rgba(0,0,0,0.38), 0 0 46px rgba(255,138,61,0.18)",
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            color: theme.foreground,
            fontSize: 116,
            fontWeight: 920,
            lineHeight: 1,
            textShadow: `0 0 32px ${scene.accent}66`,
          }}
        >
          {count.toLocaleString()}
          {metric.unit}
        </div>
        <div
          style={{
            color: theme.muted,
            fontSize: 28,
            fontWeight: 760,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          {metric.label}
        </div>
        <div
          style={{
            color: scene.accent,
            fontSize: 22,
            fontWeight: 800,
            marginTop: 30,
            opacity: detailOpacity,
          }}
        >
          {metric.delta ?? scene.footer}
        </div>
      </div>
    </div>
  );
};

const EndCardAdapter: React.FC<TemplateAdapterProps> = ({
  scene,
  localFrame,
  theme,
}) => {
  const { fps } = useVideoConfig();
  const scale = spring({
    frame: localFrame,
    fps,
    from: 0.82,
    to: 1,
    durationInFrames: 35,
    config: { damping: 12, mass: 0.6 },
  });
  const contentOpacity = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 30,
  });
  const buttonOpacity = spring({
    frame: Math.max(0, localFrame - 20),
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });
  const chips = getItems(scene).slice(0, 3);

  return (
    <div style={stageStyle}>
      <div
        style={{
          position: "absolute",
          inset: "28px 24px 78px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: contentOpacity,
          transform: `scale(${scale})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 136,
            height: 136,
            borderRadius: "50%",
            border: `2px solid ${scene.accent}`,
            boxShadow: `0 0 44px ${scene.accent}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: scene.accent,
            fontSize: 56,
            fontWeight: 920,
            marginBottom: 34,
          }}
        >
          L
        </div>
        <div
          style={{
            color: theme.foreground,
            fontSize: 56,
            fontWeight: 900,
            lineHeight: 1.06,
            maxWidth: 840,
          }}
        >
          {scene.headline}
        </div>
        <div
          style={{
            color: theme.muted,
            fontSize: 24,
            lineHeight: 1.34,
            maxWidth: 760,
            marginTop: 22,
          }}
        >
          {scene.content.subtitle}
        </div>
        <div
          style={{
            marginTop: 38,
            padding: "18px 42px",
            borderRadius: 16,
            background: "linear-gradient(90deg, #ff8a3d, #ffe1b8)",
            boxShadow: `0 0 32px ${scene.accent}66`,
            opacity: buttonOpacity,
          }}
        >
          <span
            style={{
              color: "#160e08",
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            {scene.content.cta?.label ?? "Follow for more"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 34,
            opacity: buttonOpacity,
          }}
        >
          {chips.map((item, index) => (
            <div
              key={`${scene.id}-cta-chip-${index}`}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,246,237,0.86)",
                padding: "12px 18px",
                fontSize: 16,
                fontWeight: 760,
              }}
            >
              {labelForItem(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

type PositionedNode = DiagramNode & {
  x: number;
  y: number;
  w: number;
  h: number;
};

const getCenter = (node: PositionedNode) => ({
  x: node.x + node.w / 2,
  y: node.y + node.h / 2,
});

const getEdgePoint = (node: PositionedNode, target: PositionedNode) => {
  const source = getCenter(node);
  const destination = getCenter(target);
  const dx = destination.x - source.x;
  const dy = destination.y - source.y;
  const scale = Math.max(Math.abs(dx) / (node.w / 2), Math.abs(dy) / (node.h / 2), 0.001);

  return {
    x: source.x + dx / scale,
    y: source.y + dy / scale,
  };
};

const layoutDiagramNodes = (scene: VideoScene): PositionedNode[] => {
  const fallbackNodes: DiagramNode[] = getItems(scene).map((item, index) => ({
    label: labelForItem(item),
    note: bodyForItem(item),
    tone: item.tone ?? (index === 0 ? "warm" : "neutral"),
  }));
  const sourceNodes: DiagramNode[] =
    scene.nodes.length > 0
      ? scene.nodes
      : fallbackNodes;

  return sourceNodes.slice(0, 6).map((node, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);

    return {
      ...node,
      x: node.x ?? 86 + column * 304,
      y: node.y ?? 80 + row * 255,
      w: node.w ?? 252,
      h: node.h ?? 150,
    };
  });
};

const NodeView: React.FC<{
  node: PositionedNode;
  index: number;
  localFrame: number;
  fps: number;
}> = ({ node, index, localFrame, fps }) => {
  const tone = toneMap[node.tone ?? "neutral"];
  const progress = spring({
    frame: Math.max(0, localFrame - index * 5),
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });
  const opacity = clampProgress(progress);

  return (
    <div
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.w,
        height: node.h,
        borderRadius: 22,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
        border: `1px solid ${tone.stroke}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.03) inset, 0 18px 42px rgba(0,0,0,0.34), 0 0 26px ${tone.glow}`,
        opacity,
        transform: `translateY(${interpolate(opacity, [0, 1], [18, 0])}px) scale(${interpolate(opacity, [0, 1], [0.86, 1])})`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${tone.fill}, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 20,
          right: 20,
          fontSize: 25,
          fontWeight: 850,
          lineHeight: 1.12,
          color: tone.text,
        }}
      >
        {node.label}
      </div>
      {node.note ? (
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            top: 76,
            fontSize: 15,
            lineHeight: 1.32,
            color: "rgba(248,243,238,0.66)",
          }}
        >
          {node.note}
        </div>
      ) : null}
    </div>
  );
};

const Links: React.FC<{
  nodes: PositionedNode[];
  links: DiagramLink[];
  localFrame: number;
}> = ({ nodes, links, localFrame }) => (
  <svg
    width="944"
    height="720"
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      pointerEvents: "none",
    }}
  >
    <defs>
      <linearGradient id="connector" x1="0%" x2="100%" y1="0%" y2="0%">
        <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.18" />
        <stop offset="55%" stopColor="#ffb347" stopOpacity="1" />
        <stop offset="100%" stopColor="#fff1dd" stopOpacity="0.8" />
      </linearGradient>
      <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
        <path d="M0,0 L12,6 L0,12 z" fill="#ffcf96" />
      </marker>
    </defs>
    {links.map((link, index) => {
      const from = nodes[link.from];
      const to = nodes[link.to];
      if (!from || !to) {
        return null;
      }

      const start = getEdgePoint(from, to);
      const finish = getEdgePoint(to, from);
      const p = ease(localFrame, index * 6, 24 + index * 6);

      return (
        <g key={`${link.from}-${link.to}-${index}`}>
          <line
            x1={start.x}
            y1={start.y}
            x2={finish.x}
            y2={finish.y}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={5}
            strokeLinecap="round"
          />
          <line
            x1={start.x}
            y1={start.y}
            x2={start.x + (finish.x - start.x) * p}
            y2={start.y + (finish.y - start.y) * p}
            stroke="url(#connector)"
            strokeWidth={5}
            strokeLinecap="round"
            markerEnd="url(#arrow)"
          />
        </g>
      );
    })}
  </svg>
);

const DiagramAdapter: React.FC<TemplateAdapterProps> = ({ scene, localFrame }) => {
  const { fps } = useVideoConfig();
  const nodes = layoutDiagramNodes(scene);
  const links =
    scene.links.length > 0
      ? scene.links
      : nodes.slice(1).map((_, index) => ({ from: index, to: index + 1 }));

  return (
    <div style={stageStyle}>
      <div
        style={{
          position: "absolute",
          inset: "20px 0 58px",
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))",
          boxShadow: `0 0 42px ${scene.accent}2f`,
          overflow: "hidden",
        }}
      >
        <Links nodes={nodes} links={links} localFrame={localFrame} />
        {nodes.map((node, index) => (
          <NodeView
            key={`${scene.id}-${node.label}-${index}`}
            node={node}
            index={index}
            localFrame={localFrame}
            fps={fps}
          />
        ))}
      </div>
    </div>
  );
};

const UnsupportedTemplateAdapter: React.FC<TemplateAdapterProps> = ({
  scene,
}) => (
  <div style={stageStyle}>
    <div
      style={{
        position: "absolute",
        inset: "120px 60px 180px",
        borderRadius: 24,
        border: "1px solid rgba(255,108,108,0.52)",
        background: "rgba(80,18,18,0.40)",
        color: "#ffe8e3",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: 40,
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 860 }}>Unsupported template</div>
      <div style={{ fontSize: 24, marginTop: 14 }}>{scene.templateId}</div>
      <div style={{ fontSize: 18, marginTop: 22, color: "rgba(255,232,227,0.70)" }}>
        Add an adapter or change video-map.json. No diagram fallback was used.
      </div>
    </div>
  </div>
);

export const templateRegistry = {
  "animated-list": AnimatedListAdapter,
  "animated-text": HeroTitleAdapter,
  "bounce-text": HeroTitleAdapter,
  "bubble-pop-text": HeroTitleAdapter,
  "card-flip": AnimatedListAdapter,
  "chapter-title": HeroTitleAdapter,
  "cinematic-title-intro": HeroTitleAdapter,
  "code-panel": CodePanelAdapter,
  "comparison-chart": SplitScreenAdapter,
  "diagram": DiagramAdapter,
  "end-card": EndCardAdapter,
  "gallery-grid": ImageCarouselAdapter,
  "glitch-text": HeroTitleAdapter,
  "image-carousel": ImageCarouselAdapter,
  "image-comparison-slider": SplitScreenAdapter,
  "masonry-gallery": ImageCarouselAdapter,
  "notification-pop": AnimatedListAdapter,
  "photo-stack": ImageCarouselAdapter,
  "progress-bars": ProgressStepsAdapter,
  "progress-steps": ProgressStepsAdapter,
  "quote-card": QuoteCardAdapter,
  "rotating-carousel": ImageCarouselAdapter,
  "split-screen": SplitScreenAdapter,
  "stat-counter": StatCounterAdapter,
  "subscribe-reminder": EndCardAdapter,
  "text-highlight": AnimatedListAdapter,
  "title-split": HeroTitleAdapter,
  "typewriter-subtitle": CodePanelAdapter,
} satisfies Record<string, TemplateAdapter>;

export const supportedTemplateIds = Object.keys(templateRegistry);

export const resolveTemplateAdapter = (templateId: string): TemplateAdapter =>
  templateRegistry[templateId as keyof typeof templateRegistry] ?? UnsupportedTemplateAdapter;
