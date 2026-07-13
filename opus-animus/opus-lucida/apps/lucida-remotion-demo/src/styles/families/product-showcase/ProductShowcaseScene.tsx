import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  BoxFrame,
  MediaFrame,
  buildEntranceStyle,
  buildStaggeredEntrance,
  fitTypographyToBox,
  makeBox,
  resolveTonePalette,
  resolveVerticalLayout,
  withAlpha,
} from "../../core";
import { productShowcaseFixtures } from "../../../../pipeline/fixtures/styles/product-showcase";
import { productShowcaseTokens } from "./tokens";
import type {
  ProductShowcaseAsset,
  ProductShowcaseFixture,
  ProductShowcaseFixtureKey,
  ProductShowcaseFeature,
} from "./types";

const stageHeight = 940;
const headerHeight = 300;
const featureHeight = 314;

const drawText = (style: CSSProperties): CSSProperties => ({
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  ...style,
});

const clampPercent = (value: number) =>
  `${Math.max(0, Math.min(1, value)) * 100}%`;

const resolveBoundAsset = (asset: ProductShowcaseAsset | undefined) => {
  if (!asset) {
    return {
      src: undefined,
      label: "Missing asset binding",
      reason: "The fixture points to an asset id that is not present.",
      kind: "image" as const,
      alt: "",
      objectPosition: "50% 50%",
      cropLabel: "missing",
    };
  }

  const canRender = asset.usage === "embed_asset" && Boolean(asset.src);
  const reason =
    asset.usage !== "embed_asset"
      ? `${asset.usage} is metadata only; product-showcase renders embed_asset media only.`
      : asset.missingReason ?? "Attach an embed_asset with a source to render the product.";

  return {
    src: canRender ? asset.src : undefined,
    label: canRender ? asset.label : `${asset.label} held as placeholder`,
    reason,
    kind: asset.kind,
    alt: asset.alt,
    objectPosition: `${clampPercent(asset.focalPoint.x)} ${clampPercent(asset.focalPoint.y)}`,
    cropLabel: `${asset.orientation} crop ${Math.round(asset.focalPoint.x * 100)}/${Math.round(asset.focalPoint.y * 100)}`,
  };
};

const stageShell = (extra?: CSSProperties): CSSProperties => ({
  position: "relative",
  width: "100%",
  height: "100%",
  borderRadius: productShowcaseTokens.radius.xl,
  border: `1px solid ${withAlpha(productShowcaseTokens.color.textStrong, 0.12)}`,
  background: [
    `linear-gradient(180deg, ${productShowcaseTokens.color.canvasRaised}, ${productShowcaseTokens.color.surfaceElevated})`,
    `linear-gradient(135deg, ${withAlpha(productShowcaseTokens.color.accent, 0.10)}, transparent 46%)`,
  ].join(", "),
  boxShadow: productShowcaseTokens.surface.shadowRaised,
  overflow: "hidden",
  ...extra,
});

const LabelPill = ({ children }: { children: string }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "8px 11px",
      borderRadius: productShowcaseTokens.radius.pill,
      background: withAlpha(productShowcaseTokens.color.textStrong, 0.08),
      color: productShowcaseTokens.color.textMuted,
      fontFamily: productShowcaseTokens.typography.label.fontFamily,
      fontSize: productShowcaseTokens.typography.label.fontSize,
      lineHeight: productShowcaseTokens.typography.label.lineHeight,
      fontWeight: productShowcaseTokens.typography.label.fontWeight,
    }}
  >
    {children}
  </div>
);

const AssetPolicyBadge = ({
  asset,
  cropLabel,
}: {
  asset: ProductShowcaseAsset | undefined;
  cropLabel: string;
}) => {
  const ready = asset?.usage === "embed_asset" && Boolean(asset.src);
  return (
    <div
      style={{
        position: "absolute",
        left: 22,
        top: 22,
        display: "flex",
        gap: 10,
        alignItems: "center",
        zIndex: 3,
      }}
    >
      <LabelPill>{ready ? "embed_asset" : asset?.usage ?? "missing"}</LabelPill>
      <LabelPill>{cropLabel}</LabelPill>
    </div>
  );
};

const ProductMedia = ({
  asset,
  frame,
  policy,
  delayFrames = 0,
  style,
}: {
  asset: ProductShowcaseAsset | undefined;
  frame: number;
  policy: ProductShowcaseFixture["motionPolicy"];
  delayFrames?: number;
  style?: CSSProperties;
}) => {
  const bound = resolveBoundAsset(asset);
  return (
    <div
      style={{
        ...buildEntranceStyle({
          frame,
          durationInFrames: productShowcaseTokens.motion.normalFrames,
          delayFrames,
          preset: "scale-up",
          distance: productShowcaseTokens.motion.distanceSm,
          policy,
        }),
        position: "relative",
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      <MediaFrame
        tokens={productShowcaseTokens}
        src={bound.src}
        alt={bound.alt}
        kind={bound.kind}
        fit="cover"
        status={bound.src ? "ready" : "missing"}
        label={bound.label}
        reason={bound.reason}
        tone={bound.src ? "neutral" : "warning"}
        mediaStyle={{ objectPosition: bound.objectPosition }}
        style={{
          borderRadius: productShowcaseTokens.radius.lg,
          boxShadow: "0 28px 70px rgba(20, 33, 28, 0.22)",
        }}
      />
      <AssetPolicyBadge asset={asset} cropLabel={bound.cropLabel} />
    </div>
  );
};

const DeviceChrome = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      position: "absolute",
      left: 86,
      right: 86,
      top: 72,
      bottom: 72,
      borderRadius: 30,
      background: "#151C1A",
      padding: 18,
      boxShadow: "0 32px 80px rgba(20, 33, 28, 0.26)",
    }}
  >
    <div
      style={{
        height: "100%",
        borderRadius: 20,
        overflow: "hidden",
        background: productShowcaseTokens.color.surface,
      }}
    >
      {children}
    </div>
  </div>
);

const FeatureMarker = ({
  feature,
  index,
  frame,
  compact = false,
}: {
  feature: ProductShowcaseFeature;
  index: number;
  frame: number;
  compact?: boolean;
}) => {
  const palette = resolveTonePalette(
    productShowcaseTokens,
    index === 0 ? "accent" : index === 1 ? "success" : "neutral",
  );

  return (
    <div
      style={{
        ...buildStaggeredEntrance(
          index,
          {
            frame,
            durationInFrames: productShowcaseTokens.motion.fastFrames + 8,
            preset: "fade-up",
            distance: productShowcaseTokens.motion.distanceSm,
            policy: "full",
          },
          3,
        ),
        display: "grid",
        gap: compact ? 5 : 8,
        padding: compact ? "13px 14px" : "17px 18px",
        borderRadius: productShowcaseTokens.radius.md,
        border: `1px solid ${withAlpha(palette.border, 0.9)}`,
        background: withAlpha(productShowcaseTokens.color.surfaceOverlay, 0.96),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            color: palette.accent,
            fontFamily: productShowcaseTokens.typography.label.fontFamily,
            fontSize: 13,
            lineHeight: 1.14,
            fontWeight: 780,
          }}
        >
          {feature.label}
        </div>
        {feature.metric ? (
          <div
            style={{
              color: productShowcaseTokens.color.textMuted,
              fontFamily: productShowcaseTokens.typography.mono.fontFamily,
              fontSize: 14,
              lineHeight: 1.12,
              fontWeight: 700,
            }}
          >
            {feature.metric}
          </div>
        ) : null}
      </div>
      <div
        style={drawText({
          color: productShowcaseTokens.color.textStrong,
          fontFamily: productShowcaseTokens.typography.title.fontFamily,
          fontSize: compact ? 20 : 22,
          lineHeight: 1.14,
          fontWeight: 760,
        })}
      >
        {feature.title}
      </div>
      <div
        style={drawText({
          color: productShowcaseTokens.color.textMuted,
          fontFamily: productShowcaseTokens.typography.caption.fontFamily,
          fontSize: compact ? 14 : 15,
          lineHeight: 1.25,
          fontWeight: productShowcaseTokens.typography.caption.fontWeight,
        })}
      >
        {feature.detail}
      </div>
    </div>
  );
};

const RevealStage = ({
  fixture,
  frame,
}: {
  fixture: ProductShowcaseFixture;
  frame: number;
}) => {
  const asset = fixture.assets.find((item) => item.id === fixture.primaryAssetId);
  return (
    <div style={stageShell()}>
      <DeviceChrome>
        <ProductMedia
          asset={asset}
          frame={frame}
          policy={fixture.motionPolicy}
        />
      </DeviceChrome>
      <div
        style={{
          position: "absolute",
          left: 42,
          right: 42,
          bottom: 36,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {fixture.features.slice(0, 3).map((feature, index) => (
          <FeatureMarker
            key={`${feature.label}-${feature.title}`}
            feature={feature}
            index={index}
            frame={frame}
            compact
          />
        ))}
      </div>
    </div>
  );
};

const FeatureFocusStage = ({
  fixture,
  frame,
}: {
  fixture: ProductShowcaseFixture;
  frame: number;
}) => {
  const asset = fixture.assets.find((item) => item.id === fixture.primaryAssetId);
  return (
    <div style={stageShell()}>
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 54,
          height: 650,
          borderRadius: 24,
          overflow: "hidden",
        }}
      >
        <ProductMedia
          asset={asset}
          frame={frame}
          policy={fixture.motionPolicy}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          bottom: 44,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 14,
        }}
      >
        {fixture.features.slice(0, 4).map((feature, index) => (
          <FeatureMarker
            key={`${feature.label}-${feature.title}`}
            feature={feature}
            index={index}
            frame={frame}
            compact
          />
        ))}
      </div>
    </div>
  );
};

const BeforeAfterStage = ({
  fixture,
  frame,
}: {
  fixture: ProductShowcaseFixture;
  frame: number;
}) => {
  const comparison = fixture.comparison;
  const beforeAsset = fixture.assets.find(
    (item) => item.id === comparison?.beforeAssetId,
  );
  const afterAsset = fixture.assets.find(
    (item) => item.id === comparison?.afterAssetId,
  );

  return (
    <div style={stageShell()}>
      <div
        style={{
          position: "absolute",
          left: 44,
          right: 44,
          top: 56,
          bottom: 176,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 18,
        }}
      >
        <div style={{ position: "relative" }}>
          <ProductMedia
            asset={beforeAsset}
            frame={frame}
            policy={fixture.motionPolicy}
          />
          <div style={{ position: "absolute", left: 18, bottom: 18, zIndex: 4 }}>
            <LabelPill>{comparison?.beforeLabel ?? "Before"}</LabelPill>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <ProductMedia
            asset={afterAsset}
            frame={frame}
            policy={fixture.motionPolicy}
            delayFrames={4}
          />
          <div style={{ position: "absolute", left: 18, bottom: 18, zIndex: 4 }}>
            <LabelPill>{comparison?.afterLabel ?? "After"}</LabelPill>
          </div>
        </div>
      </div>
      <div
        style={drawText({
          position: "absolute",
          left: 54,
          right: 54,
          bottom: 44,
          padding: "20px 22px",
          borderRadius: productShowcaseTokens.radius.md,
          border: `1px solid ${productShowcaseTokens.color.rule}`,
          background: productShowcaseTokens.color.surfaceOverlay,
          color: productShowcaseTokens.color.textStrong,
          fontFamily: productShowcaseTokens.typography.body.fontFamily,
          fontSize: 22,
          lineHeight: 1.28,
          fontWeight: 650,
        })}
      >
        {comparison?.note ?? fixture.assetPolicyNote}
      </div>
    </div>
  );
};

const Stage = ({
  fixture,
  frame,
}: {
  fixture: ProductShowcaseFixture;
  frame: number;
}) => {
  if (fixture.sceneType === "before-after") {
    return <BeforeAfterStage fixture={fixture} frame={frame} />;
  }

  if (fixture.sceneType === "feature-focus") {
    return <FeatureFocusStage fixture={fixture} frame={frame} />;
  }

  return <RevealStage fixture={fixture} frame={frame} />;
};

export const ProductShowcaseScene = ({
  sceneKey,
}: {
  sceneKey: ProductShowcaseFixtureKey;
}) => {
  const frame = useCurrentFrame();
  const fixture = productShowcaseFixtures[sceneKey];
  const layout = resolveVerticalLayout({
    platform: "tiktok",
    safeArea: productShowcaseTokens.safeArea,
    maxContentWidth: productShowcaseTokens.grid.maxContentWidth,
  });
  const stageBox = makeBox(
    layout.content.x,
    layout.content.y,
    layout.content.width,
    stageHeight,
  );
  const headerBox = makeBox(
    layout.content.x,
    stageBox.y + stageBox.height + 32,
    layout.content.width,
    headerHeight,
  );
  const featureBox = makeBox(
    layout.content.x,
    headerBox.y + headerBox.height + 24,
    layout.content.width,
    featureHeight,
  );
  const titleFit = fitTypographyToBox({
    tokens: productShowcaseTokens,
    role: "headline",
    text: fixture.title,
    width: headerBox.width,
    height: 118,
    maxLines: fixture.density === "dense" ? 3 : 2,
    density: fixture.density,
    minScale: 0.74,
  });
  const subtitleFit = fitTypographyToBox({
    tokens: productShowcaseTokens,
    role: "body",
    text: fixture.subtitle,
    width: headerBox.width,
    height: 96,
    maxLines: 4,
    density: fixture.density,
    minScale: 0.84,
  });

  return (
    <AbsoluteFill
      style={{
        background: [
          `linear-gradient(180deg, ${productShowcaseTokens.color.canvas} 0%, ${productShowcaseTokens.color.canvasRaised} 100%)`,
          `linear-gradient(135deg, ${withAlpha(productShowcaseTokens.color.accent, 0.10)} 0%, transparent 45%)`,
        ].join(", "),
        color: productShowcaseTokens.color.textStrong,
        fontFamily: productShowcaseTokens.typography.body.fontFamily,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: [
            `linear-gradient(to right, ${withAlpha(productShowcaseTokens.color.textStrong, 0.035)} 1px, transparent 1px)`,
            `linear-gradient(to bottom, ${withAlpha(productShowcaseTokens.color.textStrong, 0.035)} 1px, transparent 1px)`,
          ].join(", "),
          backgroundSize: "72px 72px",
        }}
      />
      <BoxFrame
        box={stageBox}
        style={buildEntranceStyle({
          frame,
          durationInFrames: productShowcaseTokens.motion.normalFrames,
          preset: "fade-up",
          distance: productShowcaseTokens.motion.distanceMd,
          policy: fixture.motionPolicy,
        })}
      >
        <Stage fixture={fixture} frame={frame} />
      </BoxFrame>
      <BoxFrame box={headerBox}>
        <div
          style={{
            ...buildEntranceStyle({
              frame,
              durationInFrames: productShowcaseTokens.motion.normalFrames,
              preset: "fade-up",
              distance: productShowcaseTokens.motion.distanceSm,
              delayFrames: 3,
              policy: fixture.motionPolicy,
            }),
            display: "grid",
            gap: 16,
            alignContent: "start",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LabelPill>{fixture.eyebrow}</LabelPill>
            <LabelPill>{fixture.sceneLabel}</LabelPill>
          </div>
          <div
            style={drawText({
              color: productShowcaseTokens.color.textSoft,
              fontFamily: productShowcaseTokens.typography.label.fontFamily,
              fontSize: productShowcaseTokens.typography.label.fontSize,
              lineHeight: productShowcaseTokens.typography.label.lineHeight,
              fontWeight: productShowcaseTokens.typography.label.fontWeight,
            })}
          >
            {fixture.productName}
          </div>
          <div
            style={drawText({
              color: productShowcaseTokens.color.textStrong,
              fontFamily: titleFit.style.fontFamily,
              fontSize: titleFit.style.fontSize,
              lineHeight: titleFit.style.lineHeight,
              fontWeight: titleFit.style.fontWeight,
            })}
          >
            {fixture.title}
          </div>
          <div
            style={drawText({
              color: productShowcaseTokens.color.textMuted,
              fontFamily: subtitleFit.style.fontFamily,
              fontSize: subtitleFit.style.fontSize,
              lineHeight: subtitleFit.style.lineHeight,
              fontWeight: subtitleFit.style.fontWeight,
            })}
          >
            {fixture.subtitle}
          </div>
        </div>
      </BoxFrame>
      <BoxFrame box={featureBox}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          {fixture.features.slice(0, 3).map((feature, index) => (
            <FeatureMarker
              key={`${feature.label}-${feature.title}-lower`}
              feature={feature}
              index={index}
              frame={frame}
            />
          ))}
        </div>
        <div
          style={drawText({
            marginTop: 18,
            color: productShowcaseTokens.color.textSoft,
            fontFamily: productShowcaseTokens.typography.caption.fontFamily,
            fontSize: productShowcaseTokens.typography.caption.fontSize,
            lineHeight: 1.28,
            fontWeight: productShowcaseTokens.typography.caption.fontWeight,
          })}
        >
          {fixture.caption} {fixture.assetPolicyNote}
        </div>
      </BoxFrame>
    </AbsoluteFill>
  );
};
