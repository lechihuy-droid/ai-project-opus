import type { CinematicTypeFixture } from "../../../../src/styles/families/cinematic-type";

export const cinematicTypeQuoteFixture: CinematicTypeFixture = {
  key: "quote",
  sceneType: "quote",
  sceneLabel: "Quote",
  eyebrow: "Cinematic Type / Claim Beat",
  chapterLabel: "Wave 1 review frame 02",
  headline:
    "If the frame needs three panels, it probably is not cinematic type anymore.",
  attribution: "Design rule for quote-driven beats: one claim, one field, one pause.",
  textureLabel: "Photographic field placeholder",
  textureNote:
    "A vertical plate can sit beside the quote, but it should never out-shout the line itself or introduce copied product branding.",
  density: "balanced",
  motionPolicy: "static",
  footer: {
    left: "cinematic-type / quote / scene-02",
    right: "quote beat / static motion / side field",
  },
};
