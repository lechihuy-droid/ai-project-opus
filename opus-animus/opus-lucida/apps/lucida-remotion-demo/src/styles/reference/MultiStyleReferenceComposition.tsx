import type { CSSProperties } from "react";
import { AbsoluteFill, Composition, Sequence, useCurrentFrame } from "remotion";
import sourceFixture from "../../../pipeline/fixtures/styles/all-style-reference/reference-composition.fixture.json";
import {
  TechnicalEditorialScene,
  type TechnicalEditorialFixtureKey,
} from "../families/technical-editorial";
import {
  CinematicTypeScene,
  type CinematicTypeFixtureKey,
} from "../families/cinematic-type";
import {
  DashboardDataScene,
  type DashboardDataFixtureKey,
} from "../families/dashboard-data";
import {
  ProductShowcaseScene,
  type ProductShowcaseFixtureKey,
} from "../families/product-showcase";
import type { AllStyleReferenceFixture, ReferenceSequence } from "./types";

export const allStyleReferenceFixture =
  sourceFixture as AllStyleReferenceFixture;

export const ALL_STYLE_REFERENCE_COMPOSITION_ID =
  allStyleReferenceFixture.compositionId;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const activeSequenceForFrame = (frame: number) =>
  allStyleReferenceFixture.sequencePlan.find(
    (sequence) =>
      frame >= sequence.startFrame &&
      frame < sequence.startFrame + sequence.durationInFrames,
  ) ?? allStyleReferenceFixture.sequencePlan[0];

const familyLabel = (family: string) =>
  family
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

const renderFamilyScene = (sequence: ReferenceSequence) => {
  switch (sequence.family) {
    case "technical-editorial":
      return (
        <TechnicalEditorialScene
          sceneKey={sequence.sceneKey as TechnicalEditorialFixtureKey}
        />
      );
    case "cinematic-type":
      return (
        <CinematicTypeScene sceneKey={sequence.sceneKey as CinematicTypeFixtureKey} />
      );
    case "dashboard-data":
      return (
        <DashboardDataScene sceneKey={sequence.sceneKey as DashboardDataFixtureKey} />
      );
    case "product-showcase":
      return (
        <ProductShowcaseScene
          sceneKey={sequence.sceneKey as ProductShowcaseFixtureKey}
        />
      );
  }
};

const overlayText: CSSProperties = {
  fontFamily: "Inter, Segoe UI, Arial, sans-serif",
  letterSpacing: 0,
  whiteSpace: "nowrap",
};

const ReferenceContinuityOverlay = () => {
  const frame = useCurrentFrame();
  const activeSequence = activeSequenceForFrame(frame);
  const progress = clamp(
    frame / Math.max(1, allStyleReferenceFixture.durationInFrames - 1),
    0,
    1,
  );
  const localFrame = frame - activeSequence.startFrame;
  const localProgress = clamp(
    localFrame / Math.max(1, activeSequence.durationInFrames - 1),
    0,
    1,
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          bottom: 48,
          display: "grid",
          gap: 10,
          color: "rgba(249, 248, 242, 0.86)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
            padding: "10px 14px",
            border: "1px solid rgba(249, 248, 242, 0.18)",
            borderRadius: 6,
            background: "rgba(10, 12, 14, 0.54)",
            boxShadow: "0 18px 42px rgba(0, 0, 0, 0.18)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              ...overlayText,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: 18,
              lineHeight: 1.1,
              fontWeight: 700,
            }}
          >
            {String(activeSequence.order).padStart(2, "0")} /{" "}
            {familyLabel(activeSequence.family)} / {activeSequence.role}
          </div>
          <div
            style={{
              ...overlayText,
              flexShrink: 0,
              color: "rgba(249, 248, 242, 0.64)",
              fontSize: 14,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {allStyleReferenceFixture.durationSeconds}s reference
          </div>
        </div>
        <div
          style={{
            position: "relative",
            height: 5,
            borderRadius: 999,
            background: "rgba(249, 248, 242, 0.18)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg, #7DD3C7, #D9B66F)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${clamp(
                ((activeSequence.startFrame +
                  activeSequence.durationInFrames * localProgress) /
                  allStyleReferenceFixture.durationInFrames) *
                  100,
                0,
                100,
              )}%`,
              width: 2,
              background: "rgba(255, 255, 255, 0.86)",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const AllStyleReferenceComposition = () => {
  return (
    <AbsoluteFill style={{ background: "#080A0C" }}>
      {allStyleReferenceFixture.sequencePlan.map((sequence) => (
        <Sequence
          key={sequence.id}
          from={sequence.startFrame}
          durationInFrames={sequence.durationInFrames}
        >
          {renderFamilyScene(sequence)}
        </Sequence>
      ))}
      <ReferenceContinuityOverlay />
    </AbsoluteFill>
  );
};

export const AllStyleReferenceRemotionRoot = () => (
  <Composition
    id={ALL_STYLE_REFERENCE_COMPOSITION_ID}
    component={AllStyleReferenceComposition}
    durationInFrames={allStyleReferenceFixture.durationInFrames}
    fps={allStyleReferenceFixture.fps}
    width={allStyleReferenceFixture.width}
    height={allStyleReferenceFixture.height}
  />
);
