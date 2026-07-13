import type { CSSProperties } from "react";
import type { MotionPolicy } from "./types";

export type EntrancePreset =
  | "fade"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "scale-up"
  | "clip-up";

export type FrameProgressRequest = {
  frame: number;
  startFrame?: number;
  durationInFrames: number;
  delayFrames?: number;
  policy?: MotionPolicy;
};

export type EntranceStyleRequest = FrameProgressRequest & {
  preset?: EntrancePreset;
  distance?: number;
  scaleFrom?: number;
  opacityFrom?: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const easeOutCubic = (value: number) => 1 - (1 - value) ** 3;

const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

export const resolveMotionPolicy = (
  requested: MotionPolicy | undefined,
  fallback: MotionPolicy = "full",
) => requested ?? fallback;

export const resolveFrameProgress = ({
  frame,
  startFrame = 0,
  durationInFrames,
  delayFrames = 0,
  policy = "full",
}: FrameProgressRequest) => {
  const effectiveStart = startFrame + delayFrames;
  if (policy === "static") {
    return frame >= effectiveStart ? 1 : 0;
  }

  const effectiveDuration =
    policy === "reduce"
      ? Math.max(1, Math.round(durationInFrames * 0.72))
      : Math.max(1, durationInFrames);
  const rawProgress = (frame - effectiveStart) / effectiveDuration;
  return easeOutCubic(clamp01(rawProgress));
};

const resolveTravelDistance = (distance: number, policy: MotionPolicy) => {
  if (policy === "static") {
    return 0;
  }

  if (policy === "reduce") {
    return Math.min(8, distance * 0.35);
  }

  return distance;
};

const formatTransform = (
  translateX: number,
  translateY: number,
  scale: number,
) => {
  const segments = [
    `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0)`,
  ];

  if (scale !== 1) {
    segments.push(`scale(${scale.toFixed(4)})`);
  }

  return segments.join(" ");
};

export const buildEntranceStyle = ({
  frame,
  startFrame = 0,
  durationInFrames,
  delayFrames = 0,
  preset = "fade-up",
  distance = 24,
  scaleFrom = 0.96,
  opacityFrom = 0,
  policy = "full",
}: EntranceStyleRequest): CSSProperties => {
  const progress = resolveFrameProgress({
    frame,
    startFrame,
    durationInFrames,
    delayFrames,
    policy,
  });
  const travel = resolveTravelDistance(distance, policy);
  const opacity = lerp(opacityFrom, 1, progress);
  let translateX = 0;
  let translateY = 0;
  let scale = 1;
  let clipPath = "inset(0 0 0 0 round 0)";

  if (preset === "fade-up") {
    translateY = lerp(travel, 0, progress);
  } else if (preset === "fade-down") {
    translateY = lerp(-travel, 0, progress);
  } else if (preset === "fade-left") {
    translateX = lerp(travel, 0, progress);
  } else if (preset === "fade-right") {
    translateX = lerp(-travel, 0, progress);
  } else if (preset === "scale-up") {
    scale = lerp(policy === "static" ? 1 : scaleFrom, 1, progress);
  } else if (preset === "clip-up") {
    clipPath = `inset(${lerp(100, 0, progress).toFixed(2)}% 0 0 0 round 0)`;
  }

  return {
    opacity,
    transform: formatTransform(translateX, translateY, scale),
    transformOrigin: "center center",
    clipPath,
    willChange: policy === "static" ? undefined : "transform, opacity, clip-path",
  };
};

export const buildStaggeredEntrance = (
  index: number,
  options: EntranceStyleRequest,
  stepFrames = 4,
) =>
  buildEntranceStyle({
    ...options,
    delayFrames: (options.delayFrames ?? 0) + index * stepFrames,
  });
