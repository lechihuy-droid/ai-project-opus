import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type {
  ContinuousEnvironment as ContinuousEnvironmentSpec,
  VideoScene,
} from "../data";
import { ContextChip, type ContextChipProps } from "./ContextChip";
import { DiffHighlight, type DiffHighlightProps } from "./DiffHighlight";
import { MechanismWindow, type MechanismWindowProps } from "./MechanismWindow";
import {
  TIMER_MORPH_DEFAULTS,
  TimerMorph,
  type TimerMorphProps,
} from "./TimerMorph";
import {
  applyElementTransition,
  getElementTransitionStartFrame,
  interpolateEnvironmentTransform,
  type MechanismElement,
  normalizeEnvironmentTransform,
} from "./continuousState";
import { mechanismTokens } from "./tokens";

const renderElement = (
  element: MechanismElement,
  activeWindowTarget: string,
) => {
  const props = element.props;
  switch (props.component) {
    case "ContextChip": {
      const { component: _component, ...chipProps } = props;
      void _component;
      return (
        <ContextChip
          key={element.target}
          {...(chipProps as ContextChipProps)}
          startFrame={element.startFrame}
        />
      );
    }
    case "TimerMorph": {
      const { component: _component, position, ...timerProps } = props;
      void _component;
      const timerPosition = position ?? TIMER_MORPH_DEFAULTS.position;
      return (
        <div
          key={element.target}
          style={{ position: "absolute", ...timerPosition }}
        >
          <TimerMorph
            {...(timerProps as TimerMorphProps)}
            startFrame={element.startFrame}
          />
        </div>
      );
    }
    case "DiffHighlight": {
      const { component: _component, ...diffProps } = props;
      void _component;
      return (
        <div
          key={element.target}
          style={{ position: "absolute", left: 80, top: 900 }}
        >
          <DiffHighlight
            {...(diffProps as DiffHighlightProps)}
            revealStartFrame={element.startFrame}
          />
        </div>
      );
    }
    case "MechanismWindow": {
      const {
        component: _component,
        position,
        scale = 1,
        showCursor = true,
        ...windowProps
      } = props;
      void _component;
      return (
        <div
          key={element.target}
          style={{
            position: "absolute",
            ...position,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <MechanismWindow
            {...(windowProps as MechanismWindowProps)}
            showCursor={showCursor && activeWindowTarget === element.target}
          />
        </div>
      );
    }
  }
};

export const ContinuousEnvironment: React.FC<{
  environment: ContinuousEnvironmentSpec;
  scenes: VideoScene[];
  sceneIndex: number;
}> = ({ environment, scenes, sceneIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const {
    position: initialPosition,
    scale: initialScale,
    ...initialWindowProps
  } = environment.props;
  const environmentProps: Omit<MechanismWindowProps, "variant"> = {
    ...initialWindowProps,
  };
  let environmentTransform = normalizeEnvironmentTransform({
    position: initialPosition,
    scale: initialScale,
  });
  const elements = new Map<string, MechanismElement>();
  const windowActivity = new Map<string, { frame: number; order: number }>([
    ["environment", { frame: Number.NEGATIVE_INFINITY, order: -1 }],
  ]);
  let activityOrder = 0;
  let sceneStartFrame = 0;

  for (let index = 0; index <= sceneIndex; index += 1) {
    const scene = scenes[index];
    const transformBeforeScene = environmentTransform;
    let transformAfterScene = environmentTransform;
    for (const transition of scene.transitions ?? []) {
      if (
        transition.target === "environment" &&
        transition.action === "update"
      ) {
        // Environment updates remain scene-bound and intentionally ignore offsetSec.
        const updateProps = transition.props as Partial<
          ContinuousEnvironmentSpec["props"]
        >;
        const { position, scale, ...windowProps } = updateProps;
        Object.assign(environmentProps, windowProps);
        transformAfterScene = {
          position: position ?? transformAfterScene.position,
          scale: scale ?? transformAfterScene.scale,
        };
        windowActivity.set("environment", {
          frame: sceneStartFrame,
          order: activityOrder,
        });
        activityOrder += 1;
      } else {
        applyElementTransition(
          elements,
          transition,
          sceneStartFrame,
          fps,
          frame,
        );
        const startFrame = getElementTransitionStartFrame(
          transition,
          sceneStartFrame,
          fps,
        );
        const element = elements.get(transition.target);
        if (
          startFrame <= frame &&
          transition.action !== "remove" &&
          element?.props.component === "MechanismWindow"
        ) {
          windowActivity.set(transition.target, {
            frame: startFrame,
            order: activityOrder,
          });
          activityOrder += 1;
        }
      }
    }
    environmentTransform =
      index === sceneIndex
        ? interpolateEnvironmentTransform(
            transformBeforeScene,
            transformAfterScene,
            frame,
            sceneStartFrame,
          )
        : transformAfterScene;
    sceneStartFrame += scene.durationFrames;
  }

  const activeWindowTarget = [...windowActivity.entries()]
    .filter(
      ([target]) =>
        target === "environment" ||
        elements.get(target)?.props.component === "MechanismWindow",
    )
    .sort(
      ([, left], [, right]) =>
        right.frame - left.frame || right.order - left.order,
    )[0]?.[0] ?? "environment";
  const environmentShowCursor = environmentProps.showCursor ?? true;

  return (
    <AbsoluteFill style={{ backgroundColor: mechanismTokens.color.graphite }}>
      <div
        style={{
          position: "absolute",
          ...environmentTransform.position,
          transform: `scale(${environmentTransform.scale})`,
          transformOrigin: "top left",
        }}
      >
        <MechanismWindow
          variant={environment.variant}
          {...environmentProps}
          showCursor={
            environmentShowCursor && activeWindowTarget === "environment"
          }
        />
      </div>
      {[...elements.values()].map((element) =>
        renderElement(element, activeWindowTarget),
      )}
    </AbsoluteFill>
  );
};
