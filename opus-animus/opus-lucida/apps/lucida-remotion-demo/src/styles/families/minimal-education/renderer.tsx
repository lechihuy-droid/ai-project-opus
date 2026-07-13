import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  BoxFrame,
  Grid,
  GridCell,
  Surface,
  buildEntranceStyle,
  buildStaggeredEntrance,
  fitTypographyToBox,
  makeBox,
  resolveColumns,
  resolveTonePalette,
  resolveVerticalLayout,
  spanColumns,
  withAlpha,
} from "../../core";
import { createMinimalEducationTokens, resolveAccentPalette } from "./tokens";
import type {
  MinimalEducationComparisonScene,
  MinimalEducationCompositionProps,
  MinimalEducationDefinitionScene,
  MinimalEducationScene,
  MinimalEducationStepsScene,
} from "./types";

type TextBlockProps = {
  scene: MinimalEducationScene;
  role: "display" | "headline" | "title" | "body" | "label" | "caption" | "mono";
  text: string;
  width: number;
  height?: number;
  maxLines?: number;
  density?: MinimalEducationScene["density"];
  color: string;
  fontWeight?: number;
  style?: React.CSSProperties;
};

const SceneText = ({
  scene,
  role,
  text,
  width,
  height,
  maxLines,
  density,
  color,
  fontWeight,
  style,
}: TextBlockProps) => {
  const tokens = createMinimalEducationTokens(scene);
  const fit = fitTypographyToBox({
    tokens,
    role,
    text,
    width,
    height,
    maxLines,
    density: density ?? scene.density,
    minScale:
      role === "headline" ? 0.72 : role === "title" ? 0.64 : role === "caption" ? 0.68 : 0.72,
  });

  return (
    <div
      style={{
        color,
        fontFamily: fit.style.fontFamily,
        fontSize: fit.style.fontSize,
        lineHeight: fit.style.lineHeight,
        fontWeight: fontWeight ?? Number(fit.style.fontWeight),
        letterSpacing: fit.style.letterSpacing,
        textTransform: fit.style.textTransform,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflow: "hidden",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

const Eyebrow = ({ scene }: { scene: MinimalEducationScene }) => {
  const tokens = createMinimalEducationTokens(scene);
  const accent = resolveAccentPalette(scene.accentTone);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        color: accent.strong,
        fontFamily: tokens.typography.label.fontFamily,
        fontSize: tokens.typography.label.fontSize,
        lineHeight: tokens.typography.label.lineHeight,
        fontWeight: 800,
        textTransform: "uppercase",
      }}
    >
      <div
        style={{
          width: 44,
          height: 4,
          borderRadius: tokens.radius.pill,
          background: accent.primary,
        }}
      />
      {scene.eyebrow}
    </div>
  );
};

const IntroBlock = ({
  scene,
  box,
}: {
  scene: MinimalEducationScene;
  box: ReturnType<typeof makeBox>;
}) => {
  const frame = useCurrentFrame();
  const tokens = createMinimalEducationTokens(scene);

  return (
    <BoxFrame
      box={box}
      style={buildEntranceStyle({
        frame,
        durationInFrames: tokens.motion.normalFrames,
        distance: tokens.motion.distanceLg,
        preset: "fade-up",
        policy: scene.motionPolicy,
      })}
    >
      <Eyebrow scene={scene} />
      <div style={{ marginTop: 26 }}>
        <SceneText
          scene={scene}
          role="headline"
          text={scene.title}
          width={box.width}
          height={192}
          maxLines={4}
          color={tokens.color.textStrong}
          fontWeight={900}
        />
      </div>
      <div style={{ marginTop: 24, maxWidth: box.width - 32 }}>
        <SceneText
          scene={scene}
          role="body"
          text={scene.summary}
          width={box.width - 32}
          height={148}
          maxLines={5}
          color={tokens.color.textMuted}
        />
      </div>
    </BoxFrame>
  );
};

const CalloutPanel = ({
  scene,
  box,
}: {
  scene: MinimalEducationScene;
  box: ReturnType<typeof makeBox>;
}) => {
  if (!scene.callout) {
    return null;
  }

  const frame = useCurrentFrame();
  const tokens = createMinimalEducationTokens(scene);
  const accent = resolveAccentPalette(scene.accentTone);

  return (
    <BoxFrame
      box={box}
      style={buildEntranceStyle({
        frame,
        durationInFrames: tokens.motion.normalFrames,
        delayFrames: 4,
        distance: tokens.motion.distanceMd,
        preset: "fade-left",
        policy: scene.motionPolicy,
      })}
    >
      <Surface
        tokens={tokens}
        padding={28}
        style={{
          height: "100%",
          background: `linear-gradient(180deg, ${withAlpha(accent.soft, 0.78)}, rgba(255,255,255,0.96))`,
          borderColor: withAlpha(accent.primary, 0.22),
        }}
      >
        <div
          style={{
            color: accent.strong,
            fontFamily: tokens.typography.label.fontFamily,
            fontSize: tokens.typography.label.fontSize,
            lineHeight: tokens.typography.label.lineHeight,
            fontWeight: 800,
            textTransform: "uppercase",
          }}
        >
          {scene.callout.label}
        </div>
        <div style={{ marginTop: 16 }}>
          <SceneText
            scene={scene}
            role="title"
            text={scene.callout.value}
            width={box.width - 56}
            height={box.height - 72}
            maxLines={6}
            color={tokens.color.textStrong}
            fontWeight={800}
          />
        </div>
      </Surface>
    </BoxFrame>
  );
};

const FooterStrip = ({ scene }: { scene: MinimalEducationScene }) => {
  const frame = useCurrentFrame();
  const tokens = createMinimalEducationTokens(scene);
  const accent = resolveAccentPalette(scene.accentTone);
  const layout = resolveVerticalLayout({
    safeArea: tokens.safeArea,
    maxContentWidth: tokens.grid.maxContentWidth,
  });
  const footerBox = makeBox(
    layout.content.x,
    layout.safe.y + layout.safe.height - 94,
    layout.content.width,
    70,
  );

  return (
    <BoxFrame
      box={footerBox}
      style={buildEntranceStyle({
        frame,
        durationInFrames: tokens.motion.normalFrames,
        delayFrames: 10,
        distance: tokens.motion.distanceSm,
        preset: "fade-up",
        policy: scene.motionPolicy,
      })}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          width: "100%",
          height: "100%",
          borderTop: `1px solid ${tokens.color.rule}`,
          color: tokens.color.textSoft,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: accent.primary,
            marginTop: 2,
          }}
        />
        <SceneText
          scene={scene}
          role="caption"
          text={scene.footer}
          width={footerBox.width - 28}
          maxLines={2}
          color={tokens.color.textSoft}
          style={{ paddingTop: 16 }}
        />
      </div>
    </BoxFrame>
  );
};

const DefinitionScene = ({ scene }: { scene: MinimalEducationDefinitionScene }) => {
  const frame = useCurrentFrame();
  const tokens = createMinimalEducationTokens(scene);
  const accent = resolveAccentPalette(scene.accentTone);
  const layout = resolveVerticalLayout({
    safeArea: tokens.safeArea,
    contentInset: { top: 24, right: 0, bottom: 120, left: 0 },
    maxContentWidth: tokens.grid.maxContentWidth,
  });
  const columns = resolveColumns(layout.content, 12, tokens.grid.gutter);
  const introBox = makeBox(spanColumns(columns, 0, 7).x, layout.content.y, spanColumns(columns, 0, 7).width, 404);
  const calloutBox = makeBox(spanColumns(columns, 8, 4).x, layout.content.y + 12, spanColumns(columns, 8, 4).width, 288);
  const bodyBox = makeBox(layout.content.x, layout.content.y + 500, layout.content.width, 658);

  return (
    <>
      <IntroBlock scene={scene} box={introBox} />
      <CalloutPanel scene={scene} box={calloutBox} />
      <BoxFrame
        box={bodyBox}
        style={buildEntranceStyle({
          frame,
          durationInFrames: tokens.motion.normalFrames,
          delayFrames: 7,
          distance: tokens.motion.distanceMd,
          preset: "fade-up",
          policy: scene.motionPolicy,
        })}
      >
        <Grid columns={12} gap={24} rowGap={28} style={{ height: "100%" }}>
          <GridCell columnSpan={5}>
            <div
              style={{
                paddingRight: 20,
              }}
            >
              <div
                style={{
                  color: accent.strong,
                  fontFamily: tokens.typography.label.fontFamily,
                  fontSize: tokens.typography.label.fontSize,
                  lineHeight: tokens.typography.label.lineHeight,
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                {scene.definition.term}
              </div>
              <div
                style={{
                  marginTop: 16,
                  color: tokens.color.textSoft,
                  fontFamily: tokens.typography.mono.fontFamily,
                  fontSize: tokens.typography.mono.fontSize,
                  lineHeight: tokens.typography.mono.lineHeight,
                  fontWeight: 700,
                }}
              >
                {scene.definition.phonetic}
              </div>
              <div style={{ marginTop: 24 }}>
                <SceneText
                  scene={scene}
                  role="title"
                  text={scene.definition.meaning}
                  width={bodyBox.width * 0.38}
                  height={300}
                  maxLines={7}
                  color={tokens.color.textStrong}
                />
              </div>
            </div>
          </GridCell>
          <GridCell columnSpan={7}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              {scene.definition.keyPoints.map((point, index) => (
                <div
                  key={point.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "136px 1fr",
                    gap: 22,
                    paddingBottom: 20,
                    borderBottom: `1px solid ${tokens.color.rule}`,
                    ...buildStaggeredEntrance(
                      index,
                      {
                        frame,
                        durationInFrames: tokens.motion.normalFrames,
                        delayFrames: 10,
                        distance: tokens.motion.distanceSm,
                        preset: "fade-up",
                        policy: scene.motionPolicy,
                      },
                      3,
                    ),
                  }}
                >
                  <div
                    style={{
                      color:
                        index === 0
                          ? accent.primary
                          : index === 1
                            ? accent.secondary
                            : accent.tertiary,
                      fontFamily: tokens.typography.label.fontFamily,
                      fontSize: tokens.typography.label.fontSize,
                      lineHeight: tokens.typography.label.lineHeight,
                      fontWeight: 800,
                      textTransform: "uppercase",
                    }}
                  >
                    {point.label}
                  </div>
                  <SceneText
                    scene={scene}
                    role="body"
                    text={point.detail}
                    width={bodyBox.width * 0.55}
                    height={88}
                    maxLines={3}
                    color={tokens.color.textMuted}
                  />
                </div>
              ))}
            </div>
          </GridCell>
        </Grid>
      </BoxFrame>
    </>
  );
};

const StepsScene = ({ scene }: { scene: MinimalEducationStepsScene }) => {
  const frame = useCurrentFrame();
  const tokens = createMinimalEducationTokens(scene);
  const accent = resolveAccentPalette(scene.accentTone);
  const layout = resolveVerticalLayout({
    safeArea: tokens.safeArea,
    contentInset: { top: 24, right: 0, bottom: 120, left: 0 },
    maxContentWidth: tokens.grid.maxContentWidth,
  });
  const columns = resolveColumns(layout.content, 12, tokens.grid.gutter);
  const introBox = makeBox(spanColumns(columns, 0, 8).x, layout.content.y, spanColumns(columns, 0, 8).width, 404);
  const calloutBox = makeBox(spanColumns(columns, 9, 3).x, layout.content.y + 20, spanColumns(columns, 9, 3).width, 278);
  const railBox = makeBox(layout.content.x, layout.content.y + 492, layout.content.width, 704);

  return (
    <>
      <IntroBlock scene={scene} box={introBox} />
      <CalloutPanel scene={scene} box={calloutBox} />
      <BoxFrame
        box={railBox}
        style={buildEntranceStyle({
          frame,
          durationInFrames: tokens.motion.normalFrames,
          delayFrames: 8,
          distance: tokens.motion.distanceMd,
          preset: "fade-up",
          policy: scene.motionPolicy,
        })}
      >
        <div
          style={{
            color: accent.strong,
            fontFamily: tokens.typography.label.fontFamily,
            fontSize: tokens.typography.label.fontSize,
            lineHeight: tokens.typography.label.lineHeight,
            fontWeight: 800,
            textTransform: "uppercase",
            marginBottom: 26,
          }}
        >
          {scene.steps.headline}
        </div>
        <div
          style={{
            position: "absolute",
            left: 46,
            top: 82,
            bottom: 30,
            width: 2,
            background: `linear-gradient(180deg, ${withAlpha(accent.primary, 0.36)}, ${withAlpha(accent.primary, 0.04)})`,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            marginTop: 56,
          }}
        >
          {scene.steps.items.map((step, index) => {
            const isActive = step.state === "active";
            const panelTone = isActive ? "accent" : "neutral";

            return (
              <div
                key={step.index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "92px 1fr",
                  gap: 24,
                  alignItems: "stretch",
                  ...buildStaggeredEntrance(
                    index,
                    {
                      frame,
                      durationInFrames: tokens.motion.normalFrames,
                      delayFrames: 10,
                      distance: tokens.motion.distanceSm,
                      preset: "fade-up",
                      policy: scene.motionPolicy,
                    },
                    3,
                  ),
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: 6,
                  }}
                >
                  <div
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: 999,
                      border: `1px solid ${isActive ? withAlpha(accent.primary, 0.34) : tokens.color.rule}`,
                      background: isActive
                        ? `linear-gradient(180deg, ${withAlpha(accent.soft, 0.9)}, rgba(255,255,255,0.98))`
                        : "rgba(255,255,255,0.68)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isActive ? accent.strong : tokens.color.textSoft,
                      fontFamily: tokens.typography.mono.fontFamily,
                      fontSize: 20,
                      fontWeight: 800,
                    }}
                  >
                    {step.index}
                  </div>
                </div>
                <Surface
                  tokens={tokens}
                  tone={panelTone}
                  padding={28}
                  style={{
                    background: isActive
                      ? `linear-gradient(180deg, ${withAlpha(accent.soft, 0.9)}, rgba(255,255,255,0.98))`
                      : "rgba(255,255,255,0.78)",
                    borderColor: isActive ? withAlpha(accent.primary, 0.26) : tokens.color.rule,
                  }}
                >
                  <SceneText
                    scene={scene}
                    role="title"
                    text={step.title}
                    width={railBox.width - 208}
                    height={52}
                    maxLines={2}
                    color={tokens.color.textStrong}
                    fontWeight={800}
                  />
                  <div style={{ marginTop: 10 }}>
                    <SceneText
                      scene={scene}
                      role="body"
                      text={step.detail}
                      width={railBox.width - 208}
                      height={92}
                      maxLines={4}
                      color={tokens.color.textMuted}
                    />
                  </div>
                </Surface>
              </div>
            );
          })}
        </div>
      </BoxFrame>
    </>
  );
};

const ComparisonScene = ({
  scene,
}: {
  scene: MinimalEducationComparisonScene;
}) => {
  const frame = useCurrentFrame();
  const tokens = createMinimalEducationTokens(scene);
  const accent = resolveAccentPalette(scene.accentTone);
  const layout = resolveVerticalLayout({
    safeArea: tokens.safeArea,
    contentInset: { top: 24, right: 0, bottom: 120, left: 0 },
    maxContentWidth: tokens.grid.maxContentWidth,
  });
  const columns = resolveColumns(layout.content, 12, tokens.grid.gutter);
  const introBox = makeBox(spanColumns(columns, 0, 7).x, layout.content.y, spanColumns(columns, 0, 7).width, 404);
  const calloutBox = makeBox(spanColumns(columns, 8, 4).x, layout.content.y + 18, spanColumns(columns, 8, 4).width, 250);
  const tableBox = makeBox(layout.content.x, layout.content.y + 500, layout.content.width, 680);
  const headerTextColor = tokens.color.textSoft;
  const rowLabelWidth = 272;
  const gap = 24;
  const valueWidth = Math.floor((tableBox.width - rowLabelWidth - gap * 2) / 2);
  const palette = resolveTonePalette(tokens, "accent");

  return (
    <>
      <IntroBlock scene={scene} box={introBox} />
      <CalloutPanel scene={scene} box={calloutBox} />
      <BoxFrame
        box={tableBox}
        style={buildEntranceStyle({
          frame,
          durationInFrames: tokens.motion.normalFrames,
          delayFrames: 8,
          distance: tokens.motion.distanceMd,
          preset: "fade-up",
          policy: scene.motionPolicy,
        })}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${rowLabelWidth}px ${valueWidth}px ${valueWidth}px`,
            columnGap: gap,
            alignItems: "end",
            paddingBottom: 18,
            borderBottom: `1px solid ${tokens.color.rule}`,
          }}
        >
          <div
            style={{
              color: headerTextColor,
              fontFamily: tokens.typography.label.fontFamily,
              fontSize: tokens.typography.label.fontSize,
              lineHeight: tokens.typography.label.lineHeight,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Decision point
          </div>
          <div
            style={{
              color: accent.secondary,
              fontFamily: tokens.typography.label.fontFamily,
              fontSize: tokens.typography.label.fontSize,
              lineHeight: tokens.typography.label.lineHeight,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            {scene.comparison.leftTitle}
          </div>
          <div
            style={{
              color: accent.primary,
              fontFamily: tokens.typography.label.fontFamily,
              fontSize: tokens.typography.label.fontSize,
              lineHeight: tokens.typography.label.lineHeight,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            {scene.comparison.rightTitle}
          </div>
        </div>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {scene.comparison.criteria.map((criterion, index) => {
            const leftEmphasis =
              criterion.emphasis === "left" || criterion.emphasis === "both";
            const rightEmphasis =
              criterion.emphasis === "right" || criterion.emphasis === "both";

            return (
              <div
                key={criterion.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: `${rowLabelWidth}px ${valueWidth}px ${valueWidth}px`,
                  columnGap: gap,
                  padding: "16px 0 18px",
                  borderBottom: `1px solid ${withAlpha(tokens.color.rule, index === scene.comparison.criteria.length - 1 ? 0 : 1)}`,
                  ...buildStaggeredEntrance(
                    index,
                    {
                      frame,
                      durationInFrames: tokens.motion.normalFrames,
                      delayFrames: 10,
                      distance: tokens.motion.distanceSm,
                      preset: "fade-up",
                      policy: scene.motionPolicy,
                    },
                    2,
                  ),
                }}
              >
                <SceneText
                  scene={scene}
                  role="caption"
                  text={criterion.label}
                  width={rowLabelWidth}
                  height={80}
                  maxLines={4}
                  color={tokens.color.textSoft}
                  density="dense"
                  fontWeight={700}
                />
                <div
                  style={{
                    background: leftEmphasis
                      ? withAlpha(accent.secondary, 0.08)
                      : "transparent",
                    borderRadius: tokens.radius.md,
                    padding: leftEmphasis ? "10px 12px" : "0",
                  }}
                >
                  <SceneText
                    scene={scene}
                    role="caption"
                    text={criterion.leftValue}
                    width={valueWidth - (leftEmphasis ? 24 : 0)}
                    height={92}
                    maxLines={4}
                    density="dense"
                    color={leftEmphasis ? accent.secondary : tokens.color.textMuted}
                    fontWeight={leftEmphasis ? 700 : 600}
                  />
                </div>
                <div
                  style={{
                    background: rightEmphasis
                      ? palette.background
                      : "transparent",
                    borderRadius: tokens.radius.md,
                    padding: rightEmphasis ? "10px 12px" : "0",
                  }}
                >
                  <SceneText
                    scene={scene}
                    role="caption"
                    text={criterion.rightValue}
                    width={valueWidth - (rightEmphasis ? 24 : 0)}
                    height={92}
                    maxLines={4}
                    density="dense"
                    color={rightEmphasis ? accent.strong : tokens.color.textMuted}
                    fontWeight={rightEmphasis ? 700 : 600}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </BoxFrame>
    </>
  );
};

export const MinimalEducationFamilyComposition = ({
  scene,
}: MinimalEducationCompositionProps) => {
  const tokens = createMinimalEducationTokens(scene);
  const accent = resolveAccentPalette(scene.accentTone);

  return (
    <AbsoluteFill
      style={{
        background: [
          `radial-gradient(circle at 14% 16%, ${withAlpha(accent.soft, 0.92)} 0%, transparent 22%)`,
          `radial-gradient(circle at 88% 12%, ${withAlpha(accent.primary, 0.08)} 0%, transparent 18%)`,
          `linear-gradient(180deg, ${tokens.color.canvas} 0%, ${tokens.color.surface} 100%)`,
        ].join(", "),
        color: tokens.color.textStrong,
        fontFamily: tokens.typography.body.fontFamily,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(20,24,31,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,24,31,0.03) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          opacity: 0.35,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.35), transparent 14%, transparent 84%, rgba(20,24,31,0.03))",
        }}
      />
      {scene.sceneType === "definition" ? <DefinitionScene scene={scene} /> : null}
      {scene.sceneType === "steps" ? <StepsScene scene={scene} /> : null}
      {scene.sceneType === "comparison" ? <ComparisonScene scene={scene} /> : null}
      <FooterStrip scene={scene} />
    </AbsoluteFill>
  );
};
