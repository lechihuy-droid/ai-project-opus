import type { MotionPolicy, TextDensity } from "../../core";

export type CinematicTypeFixtureKey = "hook" | "quote" | "transition";

export type CinematicTypeSceneType = "hook" | "quote" | "transition";

export type CinematicTypeFixture = {
  key: CinematicTypeFixtureKey;
  sceneType: CinematicTypeSceneType;
  sceneLabel: string;
  eyebrow: string;
  chapterLabel: string;
  headline: string;
  supportingText?: string;
  attribution?: string;
  textureLabel: string;
  textureNote: string;
  density: TextDensity;
  motionPolicy?: MotionPolicy;
  footer: {
    left: string;
    right: string;
  };
};
