import type { MotionPolicy, TextDensity } from "../../core";

export const cinematicTypeVariantIds = [
  "kinetic-hook",
  "quote",
  "chapter-reset",
  "manifesto",
  "outro",
] as const;

export type CinematicTypeFixtureKey =
  (typeof cinematicTypeVariantIds)[number];

export type CinematicTypeSceneType = CinematicTypeFixtureKey;

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
