import type { MechanismTransition } from "../data";

export type MechanismElement = {
  target: string;
  props: Exclude<MechanismTransition, { target: "environment" }>["props"];
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
