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

const palette = {
  background: "#0B0C0E",
  surface: "#141518",
  surfaceRaised: "#1A1B1F",
  textPrimary: "#F4F0E8",
  textSecondary: "#A7A39B",
  champagne: "#D2B47A",
  champagneDeep: "#8F6C3F",
  border: "rgba(255,255,255,0.08)",
  glow: "rgba(210,180,122,0.16)",
  font:
    '"Be Vietnam Pro", "Manrope", "Inter", "Segoe UI", Arial, sans-serif',
};

const normalizeText = (text?: string) => (text ?? "").normalize("NFC");

const splitWords = (text: string) => normalizeText(text).split(/\s+/).filter(Boolean);

const lightSubtitleWords = new Set([
  "và",
  "là",
  "của",
  "được",
  "bị",
  "cách",
  "các",
  "một",
  "này",
  "nó",
  "bạn",
  "để",
  "từ",
  "vào",
  "nếu",
]);

const normalizeForMatch = (word: string) =>
  normalizeText(word)
    .toLowerCase()
    .replace(/[.,:;!?()[\]'"“”]/g, "");

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
    fill: "rgba(210,180,122,0.13)",
    stroke: "rgba(210,180,122,0.56)",
    glow: "rgba(210,180,122,0.22)",
    text: palette.textPrimary,
  },
  cool: {
    fill: "rgba(120,150,180,0.11)",
    stroke: "rgba(160,185,210,0.34)",
    glow: "rgba(120,150,180,0.14)",
    text: "#edf8ff",
  },
  danger: {
    fill: "rgba(190,92,74,0.12)",
    stroke: "rgba(216,126,104,0.42)",
    glow: "rgba(216,126,104,0.16)",
    text: "#ffe8e3",
  },
  neutral: {
    fill: "rgba(255,255,255,0.055)",
    stroke: palette.border,
    glow: "rgba(255,255,255,0.06)",
    text: palette.textPrimary,
  },
};

const stageStyle = {
  position: "absolute",
  left: 68,
  right: 68,
  top: 430,
  height: 890,
  fontFamily: palette.font,
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
}> = ({ scene, localFrame }) => (
  <AbsoluteFill
    style={{
      fontFamily: palette.font,
      background:
        "radial-gradient(circle at 50% 20%, rgba(210,180,122,0.14), transparent 25%), radial-gradient(circle at 12% 12%, rgba(244,240,232,0.05), transparent 20%), linear-gradient(160deg, #0B0C0E 0%, #111216 52%, #171717 100%)",
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
          "linear-gradient(180deg, rgba(255,255,255,0.035), transparent 20%, transparent 76%, rgba(0,0,0,0.46))",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.035), inset 0 0 100px rgba(0,0,0,0.40)",
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
  const hideTitle = scene.intent === "hook" || scene.templateRole === "cta";
  const hideSubtitle = scene.intent === "hook" || scene.templateRole === "cta";

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
          color: "rgba(244,240,232,0.52)",
          fontWeight: 800,
          letterSpacing: 0.8,
        }}
      >
        {normalizeText(scene.kicker)}
      </div>
      {hideTitle ? null : (
        <div
          style={{
            position: "absolute",
            top: 132,
            left: 76,
            right: 76,
            maxWidth: 960,
            fontSize: scene.title.length > 48 ? 38 : 46,
            fontWeight: 850,
            lineHeight: 1.12,
            color: theme.foreground,
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [18, 0])}px)`,
          }}
        >
          {normalizeText(scene.title)}
        </div>
      )}
      {hideSubtitle ? null : (
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
          {normalizeText(scene.content.subtitle)}
        </div>
      )}
    </>
  );
};

const SubtitleBar: React.FC<{
  scene: VideoScene;
  localFrame: number;
}> = ({ scene, localFrame }) => {
  const { fps } = useVideoConfig();
  if (scene.subtitleMode === "none" || scene.captionGroups.length === 0) {
    return null;
  }

  const segmentLength = scene.durationFrames / scene.captionGroups.length;
  const index = Math.min(
    scene.captionGroups.length - 1,
    Math.floor(localFrame / segmentLength),
  );
  const segmentFrame = localFrame - index * segmentLength;
  const group = scene.captionGroups[index];
  const lines = group.lines.length > 0 ? group.lines : [splitWords(group.text)];
  const words = lines.flat();
  const activeIndex = Math.min(
    Math.max(0, words.length - 1),
    Math.floor((segmentFrame / Math.max(1, segmentLength)) * Math.max(1, words.length)),
  );
  const wordFrameLength = segmentLength / Math.max(1, words.length);
  const groupEnter = interpolate(segmentFrame, [0, 6], [0.72, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const groupExit = interpolate(segmentFrame, [segmentLength - 7, segmentLength - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  let runningIndex = 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        width: 880,
        bottom: 210,
        minHeight: 132,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        alignContent: "center",
        padding: "22px 24px",
        background:
          "linear-gradient(180deg, rgba(20,21,24,0.30), rgba(10,11,13,0.18))",
        borderRadius: 22,
        opacity: groupEnter * groupExit,
        transform: `translateY(${interpolate(groupEnter, [0, 1], [8, 0])}px)`,
      }}
    >
      <div
        style={{
          color: palette.textPrimary,
          fontSize: group.weight === "compact" ? 44 : 48,
          lineHeight: 1.18,
          fontWeight: 760,
          textAlign: "center",
          width: "100%",
          fontVariantLigatures: "none",
        }}
      >
        {lines.map((line, lineIndex) => (
          <div
            key={`${scene.id}-subtitle-${index}-line-${lineIndex}`}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "baseline",
              flexWrap: "nowrap",
              whiteSpace: "nowrap",
              minHeight: group.weight === "compact" ? 50 : 56,
            }}
          >
            {line.map((word) => {
              const wordIndex = runningIndex;
              runningIndex += 1;
              const isActive = wordIndex === activeIndex;
              const wordFrame = segmentFrame - wordIndex * wordFrameLength;
              const activeMotion = spring({
                frame: Math.max(0, wordFrame),
                fps,
                config: {
                  damping: 18,
                  stiffness: 190,
                  mass: 0.55,
                },
              });
              const lightWord = lightSubtitleWords.has(normalizeForMatch(word));
              const activeLift = isActive
                ? interpolate(activeMotion, [0, 1], [2, lightWord ? -2 : -5])
                : 0;
              const activeScale = isActive
                ? interpolate(activeMotion, [0, 1], [0.99, lightWord ? 1.025 : 1.07])
                : 1;

              return (
                <span
                  key={`${scene.id}-subtitle-${index}-${wordIndex}-${word}`}
                  style={{
                    display: "inline-block",
                    margin: "0 7px",
                    color: isActive ? palette.champagne : palette.textPrimary,
                    opacity: isActive ? 1 : 0.84,
                    transform: `translateY(${activeLift}px) scale(${activeScale})`,
                    transformOrigin: "center bottom",
                    textShadow: isActive
                      ? "0 0 18px rgba(210,180,122,0.26)"
                      : "0 2px 12px rgba(0,0,0,0.46)",
                    willChange: "transform, color",
                  }}
                >
                  {normalizeText(word)}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const TransitionOverlay: React.FC<{
  scene: VideoScene;
  localFrame: number;
}> = ({ scene, localFrame }) => {
  const transitionFrames = 8;
  const start = scene.durationFrames - transitionFrames;
  const progress = ease(localFrame, start, scene.durationFrames - 1);

  if (progress <= 0 || !scene.transitionOut) {
    return null;
  }

  if (scene.transitionOut === "slide-wipe") {
    return (
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(210,180,122,0.72) 49%, rgba(244,240,232,0.34) 50%, transparent 58%)",
          filter: "blur(5px)",
          transform: `translateX(${interpolate(progress, [0, 1], [-70, 70])}%)`,
        }}
      />
    );
  }

  if (scene.transitionOut === "whip-pan") {
    return (
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(210,180,122,0.20), transparent)",
          filter: "blur(10px)",
          opacity: progress * 0.75,
          transform: `translateX(${interpolate(progress, [0, 1], [0, 60])}px) scale(${1 + progress * 0.025})`,
        }}
      />
    );
  }

  if (scene.transitionOut === "zoom-through") {
    return (
      <AbsoluteFill
        style={{
          border: `${Math.round(progress * 180)}px solid rgba(210,180,122,0.14)`,
          opacity: progress * 0.8,
        }}
      />
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: palette.background,
        opacity: progress * 0.28,
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
  const payoffIn = ease(localFrame, 30, 48);
  const activeChip = Math.min(
    Math.max(0, chips.length - 1),
    Math.floor(interpolate(localFrame, [56, scene.durationFrames - 28], [0, chips.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })),
  );

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
            textShadow: "0 0 36px rgba(210,180,122,0.22)",
          }}
        >
          {normalizeText(scene.headline)}
        </div>
        {scene.intent === "hook" ? (
          <div
            style={{
              marginTop: 24,
              color: palette.champagne,
              fontSize: 34,
              fontWeight: 780,
              opacity: payoffIn,
              transform: `translateY(${interpolate(payoffIn, [0, 1], [12, 0])}px)`,
            }}
          >
            {normalizeText(scene.content.subtitle)}
          </div>
        ) : null}
        <div
          style={{
            width: 520 * underlineWidth,
            height: 6,
            margin: "34px auto 0",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${palette.champagneDeep}, ${palette.champagne})`,
            boxShadow: "0 0 24px rgba(210,180,122,0.28)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 118,
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(1, chips.length)}, 1fr)`,
          gap: 16,
        }}
      >
        {chips.map((item, index) => {
          const progress = ease(localFrame, 42 + index * 5, 64 + index * 5);
          const isActive = index === activeChip;

          return (
            <div
              key={`${scene.id}-chip-${index}`}
              style={{
                minHeight: 132,
                borderRadius: 18,
                border: isActive
                  ? `2px solid ${palette.champagne}`
                  : "1px solid rgba(255,255,255,0.12)",
                background: isActive
                  ? "linear-gradient(180deg, rgba(210,180,122,0.16), rgba(255,255,255,0.045))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.090), rgba(255,255,255,0.045))",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: isActive ? progress : progress * 0.78,
                transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px) scale(${isActive ? 1.04 : 1})`,
                boxShadow: isActive
                  ? "0 0 28px rgba(210,180,122,0.20)"
                  : "0 0 20px rgba(210,180,122,0.08)",
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
                {normalizeText(labelForItem(item))}
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
                  {normalizeText(item.note)}
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
  const lineHeight = lines.length > 6 ? 66 : 78;
  const activeLine = Math.min(
    Math.max(1, lines.length - 1),
    Math.floor(interpolate(localFrame, [18, scene.durationFrames - 34], [1, lines.length - 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })),
  );

  return (
    <div style={stageStyle}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: -8,
          height: 720,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.13)",
          background: "linear-gradient(180deg, rgba(25,26,30,0.98), rgba(14,15,17,0.94))",
          boxShadow: "0 28px 70px rgba(0,0,0,0.42), 0 0 34px rgba(210,180,122,0.10)",
          overflow: "hidden",
          transform: `scale(${interpolate(localFrame, [12, scene.durationFrames - 24], [1, 1.075], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
          transformOrigin: "50% 42%",
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
              color: "rgba(244,240,232,0.72)",
              fontSize: 19,
              fontFamily: "Consolas, monospace",
              fontWeight: 700,
            }}
          >
            {normalizeText(scene.content.codeTitle)}
          </div>
        </div>
        <div style={{ padding: "32px 34px" }}>
          {lines.map((line, index) => {
            const lineIn = ease(localFrame, 12 + index * 5, 26 + index * 5);
            const isHighlighted = highlighted.has(index) || highlighted.has(index + 1);
            const isActive = index === activeLine;

            return (
              <div
                key={`${scene.id}-line-${index}`}
                style={{
                  height: lineHeight,
                  display: "flex",
                  alignItems: "center",
                  opacity: isActive ? lineIn : lineIn * 0.45,
                  transform: `translateX(${interpolate(lineIn, [0, 1], [-24, isActive ? 8 : 0])}px)`,
                  fontFamily: "Consolas, monospace",
                  fontSize: 38,
                  color: isActive ? palette.textPrimary : "rgba(244,240,232,0.60)",
                  background: isActive || isHighlighted
                    ? "linear-gradient(90deg, rgba(210,180,122,0.18), transparent)"
                    : "transparent",
                  borderLeft: isActive ? `4px solid ${palette.champagne}` : "4px solid transparent",
                  paddingLeft: 18,
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.28)", width: 46 }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{normalizeText(line)}</span>
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
          .slice(0, 5)
          .map((item, index) => {
            const progress = ease(localFrame, 54 + index * 4, 70 + index * 4);
            const isActive = index + 1 === activeLine;

            return (
              <div
                key={`${scene.id}-vendor-${index}`}
                style={{
                  minHeight: 92,
                  borderRadius: 16,
                  border: isActive
                    ? `1px solid ${palette.champagne}`
                    : "1px solid rgba(255,255,255,0.08)",
                  background: isActive
                    ? "rgba(210,180,122,0.10)"
                    : "rgba(255,255,255,0.045)",
                  padding: 16,
                  opacity: isActive ? progress : progress * 0.45,
                  transform: `translateY(${interpolate(progress, [0, 1], [16, 0])}px) translateX(${isActive ? 8 : 0}px)`,
                }}
              >
                <div style={{ color: palette.textPrimary, fontSize: 19, fontWeight: 800 }}>
                  {normalizeText(labelForItem(item))}
                </div>
                <div
                  style={{
                    color: "rgba(244,240,232,0.58)",
                    fontSize: 13,
                    marginTop: 6,
                    lineHeight: 1.25,
                  }}
                >
                  {normalizeText(item.note)}
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
  const keywords = ["Role", "Limits", "Tools", "Memory", "Guardrail", "Workflow"];

  return (
    <div style={stageStyle}>
      <div
        style={{
          position: "absolute",
          inset: "34px 0 76px",
          display: "flex",
          borderRadius: 26,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
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
                transform: `translateX(${translateX}%) scale(${index === 1 ? interpolate(ease(localFrame, 28, 42), [0, 1], [1, 1.08]) : 1})`,
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
                  color: index === 1 ? palette.champagne : tone.stroke,
                  fontWeight: 900,
                  marginBottom: 22,
                }}
              >
                {index === 0 ? "SURFACE" : "CONTROL"}
              </div>
              <div
                style={{
                  color: theme.foreground,
                  fontSize: panel.title.length > 18 ? 38 : 46,
                  fontWeight: 880,
                  lineHeight: 1.08,
                }}
              >
                {normalizeText(panel.title)}
              </div>
              <div
                style={{
                  color: theme.muted,
                  fontSize: 22,
                  lineHeight: 1.35,
                  marginTop: 24,
                }}
              >
                {normalizeText(panel.body)}
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
      <div
        style={{
          position: "absolute",
          left: 30,
          right: 30,
          bottom: 8,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 12,
        }}
      >
        {keywords.map((keyword, index) => {
          const progress = ease(localFrame, 42 + index * 4, 54 + index * 4);

          return (
            <div
              key={`${scene.id}-keyword-${keyword}`}
              style={{
                padding: "9px 14px",
                borderRadius: 999,
                border: "1px solid rgba(210,180,122,0.22)",
                background: "rgba(210,180,122,0.08)",
                color: palette.champagne,
                fontSize: 18,
                fontWeight: 780,
                opacity: progress,
                transform: `translateY(${interpolate(progress, [0, 1], [12, 0])}px)`,
              }}
            >
              {keyword}
            </div>
          );
        })}
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
  const activeGroup = Math.min(
    2,
    Math.floor(interpolate(localFrame, [16, scene.durationFrames - 30], [0, 2.99], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })),
  );

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
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 944 890"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: ease(localFrame, 52, 72) * 0.55,
          }}
        >
          <path
            d="M244 250 C360 250 360 250 476 250 C594 250 594 250 712 250"
            fill="none"
            stroke="rgba(210,180,122,0.34)"
            strokeWidth="3"
          />
          <path
            d="M476 250 C476 365 476 475 476 590"
            fill="none"
            stroke="rgba(210,180,122,0.22)"
            strokeWidth="3"
          />
        </svg>
        {items.map((item, index) => {
          const tone = toneMap[item.tone ?? "neutral"];
          const group = Math.floor(index / 2);
          const isActive = group === activeGroup;
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
                border: isActive ? `2px solid ${palette.champagne}` : `1px solid rgba(255,255,255,0.12)`,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.095), rgba(255,255,255,0.045))",
                boxShadow: isActive
                  ? "0 18px 44px rgba(0,0,0,0.30), 0 0 28px rgba(210,180,122,0.22)"
                  : `0 18px 44px rgba(0,0,0,0.24), 0 0 18px ${tone.glow}`,
                padding: 24,
                opacity: isActive ? opacity : opacity * 0.62,
                transform: `translateX(${interpolate(opacity, [0, 1], [-42, 0])}px) scale(${interpolate(opacity, [0, 1], [0.92, isActive ? 1.04 : 1])})`,
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
                    background: `linear-gradient(135deg, ${palette.champagne}, rgba(255,255,255,0.18))`,
                    color: "#101113",
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
                  fontSize: 31,
                    fontWeight: 860,
                    lineHeight: 1.05,
                  }}
                >
                  {normalizeText(labelForItem(item))}
                </div>
              </div>
              <div
                style={{
                  color: "rgba(244,240,232,0.74)",
                  fontSize: 20,
                  lineHeight: 1.34,
                }}
              >
                  {normalizeText(bodyForItem(item))}
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
  const activeStep = Math.min(
    steps.length - 1,
    Math.max(0, Math.floor(localFrame / Math.max(1, framesPerStep))),
  );
  const cameraY = interpolate(activeStep, [0, Math.max(1, steps.length - 1)], [34, -34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
          transform: `translateY(${cameraY}px)`,
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
          const isActive = index === activeStep;
          const isPast = index < activeStep;
          const stateOpacity = isActive ? 1 : isPast ? 0.65 : 0.28;
          const activeScale = isActive ? 1 + pulse * 0.07 : 1;

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
                    border: `3px solid ${isActive ? palette.champagne : isPast ? "rgba(244,240,232,0.40)" : "rgba(255,255,255,0.18)"}`,
                    background:
                      isActive
                        ? `linear-gradient(135deg, ${palette.champagne}, rgba(255,255,255,0.18))`
                        : "rgba(255,255,255,0.04)",
                    color: isActive ? "#101113" : "rgba(255,255,255,0.52)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 900,
                    transform: `scale(${activeScale})`,
                    opacity: stateOpacity,
                    boxShadow: isActive ? "0 0 28px rgba(210,180,122,0.28)" : "none",
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
                        background: `linear-gradient(180deg, ${palette.champagne}, rgba(244,240,232,0.42))`,
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  borderRadius: 20,
                  border: isActive
                    ? `1px solid ${palette.champagne}`
                    : "1px solid rgba(255,255,255,0.08)",
                  background: isActive
                    ? "rgba(210,180,122,0.09)"
                    : "rgba(255,255,255,0.045)",
                  padding: "22px 26px",
                  opacity: Math.max(fillProgress, stateOpacity),
                  transform: `translateY(${interpolate(fillProgress, [0, 1], [14, 0])}px) translateX(${isActive ? 8 : 0}px)`,
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
                  {normalizeText(labelForItem(step))}
                </div>
                <div
                  style={{
                    color: theme.muted,
                    fontSize: 18,
                    lineHeight: 1.3,
                    marginTop: 8,
                  }}
                >
                  {normalizeText(bodyForItem(step))}
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
            border: `2px solid ${palette.champagne}`,
            boxShadow: "0 0 38px rgba(210,180,122,0.24)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: palette.champagne,
            fontSize: 62,
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
          {normalizeText(scene.headline)}
        </div>
        <div
          style={{
            color: theme.muted,
            fontSize: 26,
            lineHeight: 1.34,
            maxWidth: 760,
            marginTop: 22,
          }}
        >
          {normalizeText(scene.content.subtitle)}
        </div>
        <div
          style={{
            marginTop: 38,
            padding: "20px 46px",
            borderRadius: 16,
            background: `linear-gradient(90deg, ${palette.champagneDeep}, ${palette.champagne})`,
            boxShadow: "0 0 28px rgba(210,180,122,0.22)",
            opacity: buttonOpacity,
          }}
        >
          <span
            style={{
              color: "#101113",
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            {normalizeText(scene.content.cta?.label ?? "Follow for more")}
          </span>
        </div>
        <div
          style={{
            color: "rgba(244,240,232,0.70)",
            fontSize: 20,
            lineHeight: 1.3,
            maxWidth: 720,
            marginTop: 30,
            opacity: buttonOpacity,
          }}
        >
          {normalizeText(scene.content.cta?.detail ?? scene.footer)}
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
