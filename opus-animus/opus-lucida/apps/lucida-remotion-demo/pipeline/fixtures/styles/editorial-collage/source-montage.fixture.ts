import type { EditorialCollageFixture } from "../../../../src/styles/families/editorial-collage";

const plazaSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1600'%3E%3Crect width='1200' height='1600' fill='%2326241E'/%3E%3Cpath d='M0 1040 C260 930 430 980 680 890 C900 812 1030 760 1200 820 V1600 H0 Z' fill='%23D8C08A'/%3E%3Crect x='110' y='220' width='270' height='420' fill='%23E84A3C'/%3E%3Crect x='430' y='150' width='190' height='560' fill='%23F1E7D0'/%3E%3Crect x='670' y='270' width='330' height='390' fill='%235B7C84'/%3E%3Ccircle cx='890' cy='980' r='165' fill='%23F0B341'/%3E%3Cg fill='%2311100D' opacity='0.36'%3E%3Ccircle cx='220' cy='1190' r='34'/%3E%3Ccircle cx='306' cy='1144' r='26'/%3E%3Ccircle cx='742' cy='1195' r='31'/%3E%3C/g%3E%3C/svg%3E";

const archiveSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'%3E%3Crect width='1200' height='900' fill='%23F1E7D0'/%3E%3Crect x='70' y='80' width='1060' height='700' fill='%23FFF7E5' stroke='%2311100D' stroke-width='20'/%3E%3Cpath d='M140 190 H1010 M140 285 H910 M140 380 H1030 M140 475 H860 M140 570 H970' stroke='%2311100D' stroke-width='22' opacity='0.68'/%3E%3Crect x='750' y='120' width='270' height='210' fill='%23E84A3C' opacity='0.88'/%3E%3Cpath d='M760 695 C842 600 930 620 1040 514' stroke='%234FA86B' stroke-width='28' fill='none'/%3E%3C/svg%3E";

const transitSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1300'%3E%3Crect width='1000' height='1300' fill='%235B7C84'/%3E%3Cg stroke='%23FFF7E5' stroke-width='22' opacity='0.72'%3E%3Cpath d='M120 1150 L860 120'/%3E%3Cpath d='M250 1220 L920 360'/%3E%3Cpath d='M60 820 L780 300'/%3E%3C/g%3E%3Cg fill='%23F0B341'%3E%3Ccircle cx='220' cy='970' r='58'/%3E%3Ccircle cx='480' cy='670' r='72'/%3E%3Ccircle cx='760' cy='330' r='48'/%3E%3C/g%3E%3Crect x='70' y='80' width='340' height='180' fill='%2311100D' opacity='0.76'/%3E%3C/svg%3E";

export const editorialCollageSourceMontageFixture: EditorialCollageFixture = {
  key: "source-montage",
  sceneType: "source-montage",
  sceneLabel: "Source montage",
  durationInFrames: 180,
  density: "balanced",
  motionPolicy: "full",
  eyebrow: "Culture brief / montage",
  title: "Three local signals tell the same story from different distances",
  subtitle:
    "A modular collage can compare place, document, and movement without pretending any one source is the whole story.",
  deck: "Read the frame as a sequence: street texture, primary note, then route evidence.",
  assets: [
    {
      id: "plaza",
      label: "Original plaza abstraction",
      kind: "image",
      classification: "embed_asset",
      src: plazaSvg,
      alt: "Abstract city plaza shapes generated locally for review.",
      crop: { xPercent: 48, yPercent: 46, zoom: 1.08 },
      sourceNote: "Original SVG fixture, no proprietary imagery.",
      tone: "accent",
    },
    {
      id: "archive-note",
      label: "Original archive note",
      kind: "image",
      classification: "embed_asset",
      src: archiveSvg,
      alt: "Abstract archive page generated locally for review.",
      crop: { xPercent: 55, yPercent: 42, zoom: 1.16 },
      sourceNote: "Original SVG fixture, no copied document.",
      tone: "warning",
    },
    {
      id: "transit",
      label: "Original transit abstraction",
      kind: "image",
      classification: "embed_asset",
      src: transitSvg,
      alt: "Abstract transit lines generated locally for review.",
      crop: { xPercent: 52, yPercent: 52, zoom: 1.04 },
      sourceNote: "Original SVG fixture, no map brand.",
      tone: "success",
    },
  ],
  layers: [
    {
      id: "layer-plaza",
      assetId: "plaza",
      x: 3,
      y: 7,
      width: 58,
      height: 52,
      rotate: -2.4,
      zIndex: 2,
      tone: "accent",
      caption: {
        kicker: "Place",
        text: "The biggest crop anchors the social setting before the narration names the pattern.",
        sourceLabel: "embed_asset / original vector",
      },
    },
    {
      id: "layer-archive",
      assetId: "archive-note",
      x: 45,
      y: 2,
      width: 48,
      height: 36,
      rotate: 2.2,
      zIndex: 4,
      tone: "warning",
      caption: {
        kicker: "Evidence",
        text: "A document crop gets a tighter zoom so the source feels specific but not branded.",
        sourceLabel: "embed_asset / original vector",
      },
    },
    {
      id: "layer-transit",
      assetId: "transit",
      x: 30,
      y: 46,
      width: 64,
      height: 47,
      rotate: 1.2,
      zIndex: 3,
      tone: "success",
      caption: {
        kicker: "Movement",
        text: "Route lines explain how the same behavior moves through the city.",
        sourceLabel: "embed_asset / original vector",
      },
    },
  ],
  callouts: [
    { label: "Crop rule", detail: "Every asset declares x/y focus and zoom; renderer clamps those values deterministically.", tone: "accent" },
    { label: "Caption rule", detail: "Captions name source role and evidence value, never ornamental mood text.", tone: "warning" },
    { label: "Layer rule", detail: "Overlap is allowed only while keeping labels and recap outside the media collision zone.", tone: "success" },
  ],
  recap: [
    "Use largest crop for cultural context.",
    "Use smaller evidence crop for the trace.",
    "Use route crop to connect behavior across locations.",
  ],
  footer: {
    left: "No proprietary imagery, logos, screenshots, or copied brand identity.",
    right: "9:16 review fixture",
  },
};
