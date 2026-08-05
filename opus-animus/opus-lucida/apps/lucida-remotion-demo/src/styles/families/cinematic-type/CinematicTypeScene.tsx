import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  BoxFrame,
  Surface,
  buildEntranceStyle,
  fitTypographyToBox,
  makeBox,
  resolveColumns,
  resolveVerticalLayout,
  spanColumns,
  withAlpha,
} from "../../core";
import {
  cinematicTypeFixtures,
  type CinematicTypeFixtureKey,
} from "../../../../pipeline/fixtures/styles/cinematic-type";
import { cinematicTypeTokens } from "./tokens";
import type { CinematicTypeFixture } from "./types";

const drawText = (style: CSSProperties): CSSProperties => ({
  overflowWrap: "anywhere",
  ...style,
});

const BackgroundTexture = () => {
  const filmRule = withAlpha(cinematicTypeTokens.color.textStrong, 0.022);
  const verticalShade = withAlpha(cinematicTypeTokens.color.textStrong, 0.03);
  const copperShade = withAlpha(cinematicTypeTokens.color.accent, 0.08);

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${cinematicTypeTokens.color.canvas} 0%, ${cinematicTypeTokens.color.canvasRaised} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: [
            `repeating-linear-gradient(0deg, transparent 0 5px, ${filmRule} 5px 6px)`,
            `linear-gradient(90deg, transparent 0%, ${verticalShade} 34%, transparent 70%)`,
            `linear-gradient(160deg, transparent 0%, ${copperShade} 100%)`,
          ].join(", "),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 96px)",
        }}
      />
    </>
  );
};

const TextureField = ({
  fixture,
  frame,
  boxStyle,
}: {
  fixture: CinematicTypeFixture;
  frame: number;
  boxStyle: CSSProperties;
}) => (
  <Surface
    tokens={cinematicTypeTokens}
    elevation="raised"
    padding={0}
    style={{
      ...buildEntranceStyle({
        frame,
        durationInFrames: cinematicTypeTokens.motion.normalFrames,
        preset: "fade-left",
        distance: cinematicTypeTokens.motion.distanceMd,
        delayFrames: 5,
        policy: fixture.motionPolicy,
      }),
      clipPath: "none",
      width: "100%",
      height: "100%",
      position: "relative",
      overflow: "hidden",
      background: `linear-gradient(180deg, ${withAlpha(cinematicTypeTokens.color.surfaceElevated, 0.95)}, ${withAlpha(cinematicTypeTokens.color.surface, 0.98)})`,
      ...boxStyle,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: [
          `linear-gradient(145deg, ${withAlpha(cinematicTypeTokens.color.textStrong, 0.08)} 0%, transparent 42%, ${withAlpha(cinematicTypeTokens.color.canvas, 0.14)} 100%)`,
          `repeating-linear-gradient(0deg, ${withAlpha(cinematicTypeTokens.color.textStrong, 0.018)} 0 2px, transparent 2px 8px)`,
          `linear-gradient(90deg, ${withAlpha(cinematicTypeTokens.color.placeholder, 0.22)} 0%, ${withAlpha(cinematicTypeTokens.color.canvasRaised, 0.05)} 60%, ${withAlpha(cinematicTypeTokens.color.canvas, 0.3)} 100%)`,
        ].join(", "),
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 22,
        border: `1px solid ${withAlpha(cinematicTypeTokens.color.textStrong, 0.09)}`,
        borderRadius: 18,
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateRows: "1fr auto",
      }}
    >
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: "14%",
            top: "11%",
            width: "32%",
            height: "58%",
            borderRadius: 16,
            border: `1px solid ${withAlpha(cinematicTypeTokens.color.textStrong, 0.1)}`,
            background: `linear-gradient(180deg, ${withAlpha(cinematicTypeTokens.color.textStrong, 0.03)}, transparent)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "12%",
            top: "24%",
            width: "42%",
            height: "46%",
            borderRadius: 16,
            border: `1px solid ${withAlpha(cinematicTypeTokens.color.accent, 0.18)}`,
            background: `linear-gradient(180deg, ${withAlpha(cinematicTypeTokens.color.accent, 0.06)}, transparent)`,
          }}
        />
      </div>
      <div
        style={{
          padding: "0 28px 28px 28px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            color: cinematicTypeTokens.color.textStrong,
            fontFamily: cinematicTypeTokens.typography.label.fontFamily,
            fontSize: cinematicTypeTokens.typography.label.fontSize,
            lineHeight: cinematicTypeTokens.typography.label.lineHeight,
            fontWeight: cinematicTypeTokens.typography.label.fontWeight,
          }}
        >
          <span
            style={{
              width: 28,
              height: 2,
              background: cinematicTypeTokens.color.accent,
              flexShrink: 0,
            }}
          />
          {fixture.textureLabel}
        </div>
        <div
          style={drawText({
            marginTop: 12,
            color: cinematicTypeTokens.color.textMuted,
            fontFamily: cinematicTypeTokens.typography.body.fontFamily,
            fontSize: 22,
            lineHeight: 1.26,
            fontWeight: 520,
            maxWidth: "92%",
          })}
        >
          {fixture.textureNote}
        </div>
      </div>
    </div>
  </Surface>
);

const Eyebrow = ({
  fixture,
  frame,
}: {
  fixture: CinematicTypeFixture;
  frame: number;
}) => (
  <div
    style={{
      ...buildEntranceStyle({
        frame,
        durationInFrames: cinematicTypeTokens.motion.normalFrames,
        preset: "fade-up",
        distance: cinematicTypeTokens.motion.distanceSm,
        policy: fixture.motionPolicy,
      }),
      clipPath: "none",
      display: "flex",
      flexDirection: "column",
      gap: 14,
    }}
  >
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        color: cinematicTypeTokens.color.accent,
        fontFamily: cinematicTypeTokens.typography.label.fontFamily,
        fontSize: cinematicTypeTokens.typography.label.fontSize,
        lineHeight: cinematicTypeTokens.typography.label.lineHeight,
        fontWeight: cinematicTypeTokens.typography.label.fontWeight,
      }}
    >
      <span
        style={{
          width: 42,
          height: 2,
          background: cinematicTypeTokens.color.accent,
          flexShrink: 0,
        }}
      />
      {fixture.eyebrow}
    </div>
    <div
      style={{
        color: cinematicTypeTokens.color.textSoft,
        fontFamily: cinematicTypeTokens.typography.caption.fontFamily,
        fontSize: cinematicTypeTokens.typography.caption.fontSize,
        lineHeight: 1.24,
        fontWeight: cinematicTypeTokens.typography.caption.fontWeight,
      }}
    >
      {fixture.chapterLabel}
    </div>
  </div>
);

const Footer = ({ fixture }: { fixture: CinematicTypeFixture }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      color: cinematicTypeTokens.color.textSoft,
      fontFamily: cinematicTypeTokens.typography.caption.fontFamily,
      fontSize: cinematicTypeTokens.typography.caption.fontSize,
      lineHeight: cinematicTypeTokens.typography.caption.lineHeight,
      fontWeight: cinematicTypeTokens.typography.caption.fontWeight,
    }}
  >
    <span>{fixture.footer.left}</span>
    <span>{fixture.footer.right}</span>
  </div>
);

export const CinematicTypeScene = ({
  sceneKey,
}: {
  sceneKey: CinematicTypeFixtureKey;
}) => {
  const frame = useCurrentFrame();
  const fixture = cinematicTypeFixtures[sceneKey];
  const layout = resolveVerticalLayout({
    platform: "tiktok",
    maxContentWidth: cinematicTypeTokens.grid.maxContentWidth,
  });
  const columns = resolveColumns(
    layout.content,
    cinematicTypeTokens.grid.columns,
    cinematicTypeTokens.grid.gutter,
  );
  const leftWide = spanColumns(columns, 0, 7);
  const rightNarrow = spanColumns(columns, 7, 5);
  const isQuote = fixture.sceneType === "quote";
  const isChapterReset = fixture.sceneType === "chapter-reset";
  const isManifesto = fixture.sceneType === "manifesto";
  const isOutro = fixture.sceneType === "outro";
  const headlineBox =
    isChapterReset
      ? makeBox(
          layout.content.x,
          layout.content.y + 150,
          layout.content.width,
          620,
        )
      : isManifesto
        ? makeBox(
            layout.content.x,
            layout.content.y + 690,
            layout.content.width,
            410,
          )
        : isOutro
          ? makeBox(
              layout.content.x + 70,
              layout.content.y + 520,
              layout.content.width - 140,
              470,
            )
      : makeBox(leftWide.x, layout.content.y + 156, leftWide.width - 20, 760);
  const supportBox =
    isQuote
      ? makeBox(leftWide.x, layout.content.y + 1000, leftWide.width - 120, 180)
      : isChapterReset
        ? makeBox(layout.content.x, layout.content.y + 830, 560, 150)
        : isManifesto
          ? makeBox(layout.content.x, layout.content.y + 1140, 720, 130)
          : isOutro
            ? makeBox(
                layout.content.x + 120,
                layout.content.y + 1060,
                layout.content.width - 240,
                130,
              )
        : makeBox(
            leftWide.x,
            layout.content.y + 1080,
            leftWide.width - 150,
            180,
          );
  const textureBox =
    isChapterReset
      ? makeBox(
          layout.content.x,
          layout.content.y + 1040,
          layout.content.width,
          360,
        )
      : isManifesto
        ? makeBox(
            layout.content.x,
            layout.content.y + 174,
            layout.content.width,
            430,
          )
        : isOutro
          ? makeBox(
              layout.content.x + 70,
              layout.content.y + 1280,
              layout.content.width - 140,
              160,
            )
      : isQuote
        ? makeBox(
            rightNarrow.x,
            layout.content.y + 214,
            rightNarrow.width,
            1040,
          )
        : makeBox(
            rightNarrow.x,
            layout.content.y + 132,
            rightNarrow.width,
            1120,
          );
  const footerBox = makeBox(
    layout.content.x,
    layout.content.y + layout.content.height - 24,
    layout.content.width,
    40,
  );
  const headlineFit = fitTypographyToBox({
    tokens: cinematicTypeTokens,
    role: isQuote || isOutro ? "headline" : "display",
    text: fixture.headline,
    width:
      isChapterReset
        ? headlineBox.width - 110
        : headlineBox.width - 28,
    height: headlineBox.height,
    maxLines: isChapterReset ? 6 : isOutro ? 4 : 5,
    density: fixture.density,
    minScale: isChapterReset ? 0.56 : isOutro ? 0.72 : 0.66,
  });
  const supportFit = fitTypographyToBox({
    tokens: cinematicTypeTokens,
    role: "body",
    text:
      fixture.sceneType === "quote"
        ? (fixture.attribution ?? fixture.supportingText ?? "")
        : (fixture.supportingText ?? ""),
    width: supportBox.width - 12,
    height: supportBox.height,
    maxLines: 4,
    density: "balanced",
    minScale: 0.84,
  });
  const headlineWidth = isChapterReset ? "86%" : "100%";
  const headlineFontSize =
    isChapterReset
      ? Math.min(headlineFit.style.fontSize, 64)
      : headlineFit.style.fontSize;
  const headlineLineHeight =
    isChapterReset ? 0.96 : headlineFit.style.lineHeight;

  return (
    <AbsoluteFill
      style={{
        background: cinematicTypeTokens.color.canvas,
        color: cinematicTypeTokens.color.textStrong,
        fontFamily: cinematicTypeTokens.typography.body.fontFamily,
      }}
    >
      <BackgroundTexture />
      <div
        style={{
          position: "absolute",
          left: layout.content.x,
          top: layout.content.y + 86,
          width:
            isChapterReset || isManifesto || isOutro
              ? layout.content.width
              : 460,
          height: 60,
        }}
      >
        <Eyebrow fixture={fixture} frame={frame} />
      </div>
      <BoxFrame box={headlineBox}>
        <div
          style={{
            ...buildEntranceStyle({
              frame,
              durationInFrames: cinematicTypeTokens.motion.slowFrames,
              preset: isQuote ? "fade-right" : "fade-up",
              distance: cinematicTypeTokens.motion.distanceLg,
              delayFrames: 3,
              policy: fixture.motionPolicy,
            }),
            clipPath: "none",
            display: "flex",
            alignItems:
              isChapterReset || isManifesto || isOutro
                ? "flex-end"
                : "flex-start",
            minHeight: "100%",
            textAlign: isOutro ? "center" : "left",
          }}
        >
          <div
            style={{
              width: headlineWidth,
            }}
          >
            {fixture.sceneType === "quote" ? (
              <div
                style={{
                  color: cinematicTypeTokens.color.accent,
                  fontFamily: cinematicTypeTokens.typography.display.fontFamily,
                  fontSize: 92,
                  lineHeight: 0.84,
                  fontWeight: 900,
                  marginBottom: 18,
                }}
              >
                "
              </div>
            ) : null}
            <div
              style={drawText({
                color: cinematicTypeTokens.color.textStrong,
                fontFamily: headlineFit.style.fontFamily,
                fontSize: headlineFontSize,
                lineHeight: headlineLineHeight,
                fontWeight: headlineFit.style.fontWeight,
                maxWidth: headlineWidth,
              })}
            >
              {fixture.headline}
            </div>
          </div>
        </div>
      </BoxFrame>
      <BoxFrame box={supportBox}>
        <div
          style={{
            ...buildEntranceStyle({
              frame,
              durationInFrames: cinematicTypeTokens.motion.normalFrames,
              preset: "fade-up",
              distance: cinematicTypeTokens.motion.distanceSm,
              delayFrames: 10,
              policy: fixture.motionPolicy,
            }),
            clipPath: "none",
            paddingLeft: fixture.sceneType === "quote" ? 22 : 0,
            borderLeft:
              isQuote
                ? `2px solid ${withAlpha(cinematicTypeTokens.color.accent, 0.62)}`
                : "none",
            textAlign: isOutro ? "center" : "left",
          }}
        >
          <div
            style={drawText({
              color:
                isQuote
                  ? cinematicTypeTokens.color.textMuted
                  : cinematicTypeTokens.color.textStrong,
              fontFamily: supportFit.style.fontFamily,
              fontSize: supportFit.style.fontSize,
              lineHeight: supportFit.style.lineHeight,
              fontWeight: supportFit.style.fontWeight,
              maxWidth: isChapterReset ? 470 : "100%",
            })}
          >
            {isQuote
              ? fixture.attribution
              : fixture.supportingText}
          </div>
        </div>
      </BoxFrame>
      <BoxFrame box={textureBox}>
        <TextureField fixture={fixture} frame={frame} boxStyle={{}} />
      </BoxFrame>
      <BoxFrame box={footerBox}>
        <Footer fixture={fixture} />
      </BoxFrame>
    </AbsoluteFill>
  );
};
