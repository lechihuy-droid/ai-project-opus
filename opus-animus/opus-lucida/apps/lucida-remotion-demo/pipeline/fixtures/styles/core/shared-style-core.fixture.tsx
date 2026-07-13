import {
  BoxFrame,
  Grid,
  GridCell,
  MediaFrame,
  Surface,
  buildEntranceStyle,
  createStyleCoreTokens,
  fitTypographyToBox,
  resolveTextCapacity,
  resolveVerticalLayout,
  withAlpha,
} from "../../../../src/styles/core";

export const sharedStyleCoreFixtureTokens = createStyleCoreTokens({
  meta: {
    familyId: "fixture-shared-core",
    version: "0.1.0",
  },
  color: {
    accent: "#60a5fa",
  },
});

export const sharedStyleCoreFixtureLayout = resolveVerticalLayout({
  platform: "tiktok",
  reservedHeader: 120,
  reservedFooter: 140,
  contentInset: { left: 12, right: 12, top: 8, bottom: 8 },
  captionInset: { left: 24, right: 24, bottom: 24 },
});

export const sharedStyleCoreFixtureCapacity = resolveTextCapacity({
  text: "A deterministic shared core keeps every family aligned on layout, typography, motion, and missing-asset behavior.",
  width: 640,
  height: 180,
  fontSize: sharedStyleCoreFixtureTokens.typography.body.fontSize,
  lineHeight: sharedStyleCoreFixtureTokens.typography.body.lineHeight,
  maxLines: 4,
  density: "balanced",
});

export const sharedStyleCoreFixtureTitle = fitTypographyToBox({
  tokens: sharedStyleCoreFixtureTokens,
  role: "headline",
  text: "Family-neutral primitives for deterministic vertical video styles",
  width: 720,
  height: 180,
  maxLines: 3,
  density: "balanced",
});

export const SharedStyleCoreFixtureCard = ({
  frame = 18,
}: {
  frame?: number;
}) => (
  <div
    style={{
      position: "relative",
      width: 1080,
      height: 1920,
      background: `linear-gradient(180deg, ${sharedStyleCoreFixtureTokens.color.canvas}, ${sharedStyleCoreFixtureTokens.color.canvasRaised})`,
      color: sharedStyleCoreFixtureTokens.color.textStrong,
      fontFamily: sharedStyleCoreFixtureTokens.typography.body.fontFamily,
    }}
  >
    <BoxFrame box={sharedStyleCoreFixtureLayout.content}>
      <Surface
        tokens={sharedStyleCoreFixtureTokens}
        elevation="raised"
        style={{
          width: "100%",
          height: "100%",
          background: withAlpha(sharedStyleCoreFixtureTokens.color.surface, 0.92),
        }}
      >
        <div
          style={{
            ...buildEntranceStyle({
              frame,
              durationInFrames: 20,
              preset: "fade-up",
              distance: sharedStyleCoreFixtureTokens.motion.distanceMd,
            }),
            fontFamily: sharedStyleCoreFixtureTitle.style.fontFamily,
            fontSize: sharedStyleCoreFixtureTitle.style.fontSize,
            lineHeight: sharedStyleCoreFixtureTitle.style.lineHeight,
            fontWeight: sharedStyleCoreFixtureTitle.style.fontWeight,
            maxWidth: 720,
          }}
        >
          Family-neutral primitives for deterministic vertical video styles
        </div>
        <Grid
          columns={12}
          gap={sharedStyleCoreFixtureTokens.grid.gutter}
          rowGap={sharedStyleCoreFixtureTokens.grid.rowGap}
          style={{ marginTop: sharedStyleCoreFixtureTokens.spacing.xl }}
        >
          <GridCell columnSpan={7} minHeight={520}>
            <MediaFrame
              tokens={sharedStyleCoreFixtureTokens}
              status="missing"
              kind="image"
              label="Missing embeddable asset"
              reason="Wave 3 styles can render a deliberate placeholder until asset classification passes."
              overlay="linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.14) 100%)"
              style={{ height: 520 }}
            />
          </GridCell>
          <GridCell columnSpan={5}>
            <Surface
              tokens={sharedStyleCoreFixtureTokens}
              tone="accent"
              style={{ height: 520 }}
            >
              <div
                style={{
                  fontFamily: sharedStyleCoreFixtureTokens.typography.label.fontFamily,
                  fontSize: sharedStyleCoreFixtureTokens.typography.label.fontSize,
                  lineHeight: sharedStyleCoreFixtureTokens.typography.label.lineHeight,
                  fontWeight: sharedStyleCoreFixtureTokens.typography.label.fontWeight,
                  color: sharedStyleCoreFixtureTokens.color.accent,
                }}
              >
                Capacity
              </div>
              <div
                style={{
                  marginTop: sharedStyleCoreFixtureTokens.spacing.md,
                  fontSize: sharedStyleCoreFixtureTokens.typography.body.fontSize,
                  lineHeight: sharedStyleCoreFixtureTokens.typography.body.lineHeight,
                  color: sharedStyleCoreFixtureTokens.color.textMuted,
                }}
              >
                {sharedStyleCoreFixtureCapacity.charactersPerLine} chars/line,{" "}
                {sharedStyleCoreFixtureCapacity.estimatedLines} estimated lines,{" "}
                {sharedStyleCoreFixtureCapacity.fits ? "fits" : "overflows"}.
              </div>
            </Surface>
          </GridCell>
        </Grid>
      </Surface>
    </BoxFrame>
  </div>
);
