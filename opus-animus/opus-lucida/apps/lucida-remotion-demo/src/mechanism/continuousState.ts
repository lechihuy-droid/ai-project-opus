import type {
  MechanismTransition,
  WindowPosition,
  WindowTransformProps,
} from "../data";

export const ENVIRONMENT_TRANSFORM_DEFAULTS = Object.freeze({
  position: { left: 80, top: 250 },
  scale: 1,
});

export type EnvironmentTransform = {
  position: WindowPosition;
  scale: number;
};

export const normalizeEnvironmentTransform = (
  transform: WindowTransformProps,
): EnvironmentTransform => ({
  position: transform.position ?? ENVIRONMENT_TRANSFORM_DEFAULTS.position,
  scale: transform.scale ?? ENVIRONMENT_TRANSFORM_DEFAULTS.scale,
});

export const interpolateEnvironmentTransform = (
  from: EnvironmentTransform,
  to: EnvironmentTransform,
  frame: number,
  startFrame: number,
  durationInFrames = 20,
): EnvironmentTransform => {
  const progress = Math.max(
    0,
    Math.min(1, (frame - startFrame) / Math.max(1, durationInFrames)),
  );
  const mix = (start: number, end: number) =>
    start + (end - start) * progress;

  return {
    position: {
      left: mix(from.position.left, to.position.left),
      top: mix(from.position.top, to.position.top),
    },
    scale: mix(from.scale, to.scale),
  };
};

export type MechanismElement = {
  target: string;
  props: Extract<MechanismTransition, { action: "add" }>["props"];
  startFrame: number;
};

export const getElementTransitionStartFrame = (
  transition: MechanismTransition,
  sceneStartFrame: number,
  fps: number,
) => sceneStartFrame + Math.round((transition.offsetSec ?? 0) * fps);

export const applyElementTransition = (
  elements: Map<string, MechanismElement>,
  transition: MechanismTransition,
  sceneStartFrame: number,
  fps = 30,
  currentFrame = Number.POSITIVE_INFINITY,
) => {
  if (transition.target === "environment") return;
  const startFrame = getElementTransitionStartFrame(
    transition,
    sceneStartFrame,
    fps,
  );
  if (currentFrame < startFrame) return;

  if (transition.action === "remove") {
    elements.delete(transition.target);
    return;
  }

  const previous = elements.get(transition.target);
  if (transition.action === "add") {
    elements.set(transition.target, {
      target: transition.target,
      props: transition.props,
      startFrame,
    });
    return;
  }

  if (previous) {
    elements.set(transition.target, {
      ...previous,
      props: {
        ...previous.props,
        ...transition.props,
      } as MechanismElement["props"],
      startFrame,
    });
  }
};
