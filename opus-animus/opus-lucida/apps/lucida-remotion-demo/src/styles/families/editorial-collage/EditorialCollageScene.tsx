import type { CSSProperties } from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import {
  BoxFrame,
  MissingAssetPlaceholder,
  Surface,
  buildEntranceStyle,
  buildStaggeredEntrance,
  fitTypographyToBox,
  makeBox,
  resolveTonePalette,
  resolveVerticalLayout,
  withAlpha,
} from "../../core";
import { editorialCollageFixtures } from "../../../../pipeline/fixtures/styles/editorial-collage";
import { editorialCollageTokens } from "./tokens";
import type {
  EditorialCollageAsset,
  EditorialCollageCallout,
  EditorialCollageFixtureKey,
  EditorialCollageLayer,
} from "./types";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const readableText = (style: CSSProperties): CSSProperties => ({
  overflowWrap: "anywhere",
  textWrap: "balance",
  ...style,
});

const EditorialTexture = () => (
  <>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: [
          `radial-gradient(circle at 18% 12%, ${withAlpha(editorialCollageTokens.color.accent, 0.15)} 0 16%, transparent 36%)`,
          `linear-gradient(145deg, ${editorialCollageTokens.color.canvas} 0%, ${editorialCollageTokens.color.canvasRaised} 58%, #0A0A08 100%)`,
        ].join(", "),
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.28,
        backgroundImage: [
          `linear-gradient(to right, ${withAlpha(editorialCollageTokens.color.textStrong, 0.05)} 1px, transparent 1px)`,
          `linear-gradient(to bottom, ${withAlpha(editorialCollageTokens.color.textStrong, 0.035)} 1px, transparent 1px)`,
        ].join(", "),
        backgroundSize: "54px 54px",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "repeating-linear-gradient(90deg, rgba(255,247,229,0.035) 0 1px, transparent 1px 11px)",
        mixBlendMode: "screen",
        opacity: 0.32,
      }}
    />
  </>
);

const SourceTag = ({ children, tone = "accent" }: { children: string; tone?: EditorialCollageLayer["tone"] }) => {
  const palette = resolveTonePalette(editorialCollageTokens, tone ?? "accent");

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 9px",
        borderRadius: editorialCollageTokens.radius.sm,
        background: withAlpha(palette.accent, 0.16),
        color: palette.accent,
        fontFamily: editorialCollageTokens.typography.label.fontFamily,
        fontSize: 13,
        lineHeight: 1.1,
        fontWeight: 820,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: palette.accent,
          flexShrink: 0,
        }}
      />
      {children}
    </div>
  );
};

const AssetFrame = ({
  asset,
  layer,
  frame,
  index,
  motionPolicy,
}: {
  asset?: EditorialCollageAsset;
  layer: EditorialCollageLayer;
  frame: number;
  index: number;
  motionPolicy: "full" | "reduce" | "static";
}) => {
  const tone = layer.tone ?? asset?.tone ?? "neutral";
  const palette = resolveTonePalette(editorialCollageTokens, tone);
  const canRender = asset?.classification === "embed_asset" && Boolean(asset.src);
  const crop = asset?.crop ?? { xPercent: 50, yPercent: 50, zoom: 1 };
  const zoom = clamp(crop.zoom, 1, 1.42);
  const objectPosition = `${clamp(crop.xPercent, 0, 100)}% ${clamp(crop.yPercent, 0, 100)}%`;
  const reason =
    asset?.classification && asset.classification !== "embed_asset"
      ? `Rejected ${asset.classification}; renderer accepts embed_asset only.`
      : "Embed asset missing; placeholder preserves the collage slot.";

  return (
    <div
      style={{
        ...buildStaggeredEntrance(
          index,
          {
            frame,
            durationInFrames: editorialCollageTokens.motion.normalFrames,
            preset: "fade-up",
            distance: editorialCollageTokens.motion.distanceMd,
            policy: motionPolicy,
          },
          4,
        ),
        position: "absolute",
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        width: `${layer.width}%`,
        height: `${layer.height}%`,
        zIndex: layer.zIndex,
        transform: `rotate(${layer.rotate}deg)`,
        transformOrigin: "center center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          padding: editorialCollageTokens.media.frameInset,
          borderRadius: editorialCollageTokens.radius.lg,
          background: editorialCollageTokens.color.surfaceElevated,
          boxShadow: editorialCollageTokens.surface.shadowRaised,
          border: `1px solid ${withAlpha(palette.accent, 0.28)}`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius: editorialCollageTokens.radius.md,
            background: editorialCollageTokens.color.placeholder,
          }}
        >
          {canRender ? (
            <Img
              src={asset?.src ?? ""}
              alt={asset?.alt ?? ""}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition,
                transform: `scale(${zoom})`,
                transformOrigin: objectPosition,
                display: "block",
                filter: "saturate(0.94) contrast(1.06)",
              }}
            />
          ) : (
            <MissingAssetPlaceholder
              tokens={editorialCollageTokens}
              kind={asset?.kind ?? "image"}
              label={asset?.label ?? "Missing asset"}
              reason={reason}
              tone={tone}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, transparent 44%, rgba(0,0,0,0.42) 100%)",
            }}
          />
        </div>
        {canRender ? (
          <div
            style={{
              position: "absolute",
              left: 22,
              right: 22,
              bottom: 20,
            }}
          >
            <SourceTag tone={tone}>{layer.caption.kicker}</SourceTag>
            <div
              style={readableText({
                marginTop: 9,
                color: editorialCollageTokens.color.textStrong,
                fontFamily: editorialCollageTokens.typography.caption.fontFamily,
                fontSize: 17,
                lineHeight: 1.24,
                fontWeight: 720,
                textShadow: "0 2px 10px rgba(0,0,0,0.46)",
              })}
            >
              {layer.caption.text}
            </div>
            <div
              style={{
                marginTop: 6,
                color: withAlpha(editorialCollageTokens.color.textMuted, 0.88),
                fontFamily: editorialCollageTokens.typography.mono.fontFamily,
                fontSize: 12,
                lineHeight: 1.2,
                fontWeight: 650,
              }}
            >
              {layer.caption.sourceLabel}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const CalloutRail = ({
  callouts,
  frame,
  motionPolicy,
}: {
  callouts: EditorialCollageCallout[];
  frame: number;
  motionPolicy: "full" | "reduce" | "static";
}) => (
  <div style={{ display: "grid", gap: 14 }}>
    {callouts.map((callout, index) => {
      const palette = resolveTonePalette(editorialCollageTokens, callout.tone);
      return (
        <Surface
          key={`${callout.label}-${callout.detail}`}
          tokens={editorialCollageTokens}
          tone={callout.tone}
          style={{
            ...buildStaggeredEntrance(
              index,
              {
                frame,
                durationInFrames: editorialCollageTokens.motion.fastFrames + 8,
                preset: "fade-left",
                distance: editorialCollageTokens.motion.distanceSm,
                policy: motionPolicy,
              },
              3,
            ),
            borderRadius: editorialCollageTokens.radius.md,
            padding: 18,
            background: withAlpha(editorialCollageTokens.color.canvasRaised, 0.72),
          }}
        >
          <div
            style={{
              color: palette.accent,
              fontFamily: editorialCollageTokens.typography.label.fontFamily,
              fontSize: editorialCollageTokens.typography.label.fontSize,
              lineHeight: editorialCollageTokens.typography.label.lineHeight,
              fontWeight: editorialCollageTokens.typography.label.fontWeight,
            }}
          >
            {callout.label}
          </div>
          <div
            style={readableText({
              marginTop: 8,
              color: editorialCollageTokens.color.textStrong,
              fontFamily: editorialCollageTokens.typography.caption.fontFamily,
              fontSize: editorialCollageTokens.typography.caption.fontSize,
              lineHeight: editorialCollageTokens.typography.caption.lineHeight,
              fontWeight: editorialCollageTokens.typography.caption.fontWeight,
            })}
          >
            {callout.detail}
          </div>
        </Surface>
      );
    })}
  </div>
);

export const EditorialCollageScene = ({ sceneKey }: { sceneKey: EditorialCollageFixtureKey }) => {
  const frame = useCurrentFrame();
  const fixture = editorialCollageFixtures[sceneKey];
  const layout = resolveVerticalLayout({
    platform: "tiktok",
    contentInset: { top: 0, right: 0, bottom: 0, left: 0 },
    maxContentWidth: editorialCollageTokens.grid.maxContentWidth,
  });
  const headerBox = makeBox(layout.content.x, layout.content.y, layout.content.width, 294);
  const collageBox = makeBox(layout.content.x, headerBox.y + headerBox.height + 20, layout.content.width, 800);
  const railBox = makeBox(layout.content.x, collageBox.y + collageBox.height + 22, layout.content.width, 326);
  const titleFit = fitTypographyToBox({
    tokens: editorialCollageTokens,
    role: "headline",
    text: fixture.title,
    width: headerBox.width,
    height: 138,
    maxLines: fixture.density === "dense" ? 4 : 3,
    density: fixture.density,
    minScale: 0.72,
  });
  const assetById = new Map(fixture.assets.map((asset) => [asset.id, asset]));

  return (
    <AbsoluteFill
      style={{
        background: editorialCollageTokens.color.canvas,
        color: editorialCollageTokens.color.textStrong,
        fontFamily: editorialCollageTokens.typography.body.fontFamily,
      }}
    >
      <EditorialTexture />
      <BoxFrame box={headerBox}>
        <div
          style={{
            ...buildEntranceStyle({
              frame,
              durationInFrames: editorialCollageTokens.motion.normalFrames,
              preset: "fade-up",
              distance: editorialCollageTokens.motion.distanceMd,
              policy: fixture.motionPolicy,
            }),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${editorialCollageTokens.color.rule}`,
              paddingBottom: 14,
            }}
          >
            <SourceTag>{fixture.eyebrow}</SourceTag>
            <div
              style={{
                color: editorialCollageTokens.color.textSoft,
                fontFamily: editorialCollageTokens.typography.mono.fontFamily,
                fontSize: 16,
                lineHeight: 1.2,
                fontWeight: 650,
              }}
            >
              {fixture.sceneLabel}
            </div>
          </div>
          <div
            style={readableText({
              marginTop: 22,
              color: editorialCollageTokens.color.textStrong,
              fontFamily: titleFit.style.fontFamily,
              fontSize: titleFit.style.fontSize,
              lineHeight: titleFit.style.lineHeight,
              fontWeight: titleFit.style.fontWeight,
            })}
          >
            {fixture.title}
          </div>
          <div
            style={readableText({
              marginTop: 12,
              color: editorialCollageTokens.color.textMuted,
              fontFamily: editorialCollageTokens.typography.body.fontFamily,
              fontSize: 24,
              lineHeight: 1.3,
              fontWeight: 560,
              maxWidth: 820,
            })}
          >
            {fixture.subtitle}
          </div>
        </div>
      </BoxFrame>
      <BoxFrame box={collageBox}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "34px 26px 38px 26px",
              border: `1px solid ${withAlpha(editorialCollageTokens.color.textStrong, 0.18)}`,
              borderRadius: editorialCollageTokens.radius.lg,
              background: withAlpha(editorialCollageTokens.color.surface, 0.08),
            }}
          />
          {fixture.layers.map((layer, index) => (
            <AssetFrame
              key={layer.id}
              asset={assetById.get(layer.assetId)}
              layer={layer}
              frame={frame}
              index={index}
              motionPolicy={fixture.motionPolicy}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: 34,
              top: 34,
              width: 344,
              zIndex: 20,
              padding: 20,
              borderRadius: editorialCollageTokens.radius.lg,
              background: withAlpha(editorialCollageTokens.color.canvas, 0.84),
              border: `1px solid ${editorialCollageTokens.color.rule}`,
              boxShadow: editorialCollageTokens.surface.shadowOverlay,
            }}
          >
            <SourceTag tone="warning">Editorial Deck</SourceTag>
            <div
              style={readableText({
                marginTop: 10,
                color: editorialCollageTokens.color.textStrong,
                fontFamily: editorialCollageTokens.typography.title.fontFamily,
                fontSize: 23,
                lineHeight: 1.18,
                fontWeight: 820,
              })}
            >
              {fixture.deck}
            </div>
          </div>
        </div>
      </BoxFrame>
      <BoxFrame box={railBox}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            height: "100%",
          }}
        >
          <CalloutRail
            callouts={fixture.callouts}
            frame={frame}
            motionPolicy={fixture.motionPolicy}
          />
          <Surface
            tokens={editorialCollageTokens}
            elevation="overlay"
            style={{
              ...buildEntranceStyle({
                frame,
                durationInFrames: editorialCollageTokens.motion.normalFrames,
                preset: "fade-up",
                distance: editorialCollageTokens.motion.distanceSm,
                delayFrames: 5,
                policy: fixture.motionPolicy,
              }),
              padding: 20,
              borderRadius: editorialCollageTokens.radius.lg,
              background: withAlpha(editorialCollageTokens.color.surfaceElevated, 0.12),
            }}
          >
            <SourceTag tone="success">Recap Thread</SourceTag>
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {fixture.recap.map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "30px minmax(0, 1fr)",
                    gap: 10,
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      color: editorialCollageTokens.color.success,
                      fontFamily: editorialCollageTokens.typography.mono.fontFamily,
                      fontSize: 15,
                      lineHeight: 1.2,
                      fontWeight: 750,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div
                    style={readableText({
                      color: editorialCollageTokens.color.textMuted,
                      fontFamily: editorialCollageTokens.typography.caption.fontFamily,
                      fontSize: 17,
                      lineHeight: 1.24,
                      fontWeight: 650,
                    })}
                  >
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </BoxFrame>
      <div
        style={{
          position: "absolute",
          left: layout.safe.x,
          right: layout.safe.x,
          bottom: layout.safe.y + 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: editorialCollageTokens.color.textSoft,
          fontFamily: editorialCollageTokens.typography.caption.fontFamily,
          fontSize: 15,
          lineHeight: 1.2,
          fontWeight: 620,
        }}
      >
        <span>{fixture.footer.left}</span>
        <span>{fixture.footer.right}</span>
      </div>
    </AbsoluteFill>
  );
};
