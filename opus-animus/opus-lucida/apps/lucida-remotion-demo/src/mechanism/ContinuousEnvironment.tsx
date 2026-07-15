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
  type MechanismElement,
} from "./continuousState";
import { mechanismTokens } from "./tokens";

const renderElement = (element: MechanismElement) => {
  const props = element.props;
  switch (props.component) {
    case "ContextChip": {
      const { component: _component, ...chipProps } = props;
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
  }
};

export const ContinuousEnvironment: React.FC<{
  environment: ContinuousEnvironmentSpec;
  scenes: VideoScene[];
  sceneIndex: number;
}> = ({ environment, scenes, sceneIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const environmentProps: Omit<MechanismWindowProps, "variant"> = {
    ...environment.props,
  };
  const elements = new Map<string, MechanismElement>();
  let sceneStartFrame = 0;

  for (let index = 0; index <= sceneIndex; index += 1) {
    const scene = scenes[index];
    for (const transition of scene.transitions ?? []) {
      if (
        transition.target === "environment" &&
        transition.action === "update"
      ) {
        // Environment updates remain scene-bound and intentionally ignore offsetSec.
        Object.assign(environmentProps, transition.props);
      } else {
        applyElementTransition(
          elements,
          transition,
          sceneStartFrame,
          fps,
          frame,
        );
      }
    }
    sceneStartFrame += scene.durationFrames;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: mechanismTokens.color.graphite }}>
      <div style={{ position: "absolute", left: 80, top: 250 }}>
        <MechanismWindow variant={environment.variant} {...environmentProps} />
      </div>
      {[...elements.values()].map(renderElement)}
    </AbsoluteFill>
  );
};
