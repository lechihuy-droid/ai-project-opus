import type { EditorialCollageFixture } from "../../../../src/styles/families/editorial-collage";

const wallSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1300 1200'%3E%3Crect width='1300' height='1200' fill='%231C1A15'/%3E%3Cg fill='%23FFF7E5' opacity='0.86'%3E%3Crect x='120' y='130' width='330' height='270'/%3E%3Crect x='500' y='80' width='260' height='330'/%3E%3Crect x='820' y='160' width='340' height='240'/%3E%3Crect x='190' y='510' width='420' height='310'/%3E%3Crect x='700' y='500' width='390' height='350'/%3E%3C/g%3E%3Cg fill='%23E84A3C' opacity='0.78'%3E%3Crect x='178' y='166' width='92' height='82'/%3E%3Crect x='760' y='540' width='160' height='76'/%3E%3C/g%3E%3C/svg%3E";

const surveySvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1400'%3E%3Crect width='1000' height='1400' fill='%23FFF7E5'/%3E%3Cg fill='none' stroke='%2311100D' stroke-width='18'%3E%3Crect x='100' y='100' width='800' height='1110'/%3E%3Cpath d='M170 250 H820 M170 355 H760 M170 460 H845 M170 565 H780 M170 670 H840'/%3E%3C/g%3E%3Cg fill='%234FA86B'%3E%3Crect x='170' y='820' width='210' height='250'/%3E%3Crect x='430' y='720' width='170' height='350'/%3E%3Crect x='650' y='610' width='160' height='460'/%3E%3C/g%3E%3C/svg%3E";

const nightSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1600'%3E%3Crect width='1200' height='1600' fill='%230A0A08'/%3E%3Cg fill='%23F0B341'%3E%3Ccircle cx='220' cy='320' r='70'/%3E%3Ccircle cx='880' cy='410' r='48'/%3E%3Ccircle cx='620' cy='820' r='82'/%3E%3C/g%3E%3Cg stroke='%235B7C84' stroke-width='36' opacity='0.82'%3E%3Cpath d='M-40 1110 C250 900 550 1190 1240 860'/%3E%3Cpath d='M80 1370 C360 1160 690 1320 1160 1110'/%3E%3C/g%3E%3Crect x='120' y='120' width='320' height='190' fill='%23E84A3C' opacity='0.74'/%3E%3C/svg%3E";

export const editorialCollageMultiSourceEvidenceFixture: EditorialCollageFixture = {
  key: "multi-source-evidence",
  sceneType: "multi-source-evidence",
  sceneLabel: "Multi-source evidence",
  durationInFrames: 180,
  density: "dense",
  motionPolicy: "reduce",
  eyebrow: "Culture brief / evidence",
  title: "Dense evidence needs hierarchy before it needs more texture",
  subtitle:
    "The scene carries longer captions, three visible sources, and a source audit rail while keeping every crop and caption inside the safe area.",
  deck: "Evidence density rises by tightening caption size, not by hiding the provenance trail.",
  assets: [
    {
      id: "wall",
      label: "Original image wall",
      kind: "image",
      classification: "embed_asset",
      src: wallSvg,
      alt: "Abstract wall of community images generated locally.",
      crop: { xPercent: 50, yPercent: 50, zoom: 1.12 },
      sourceNote: "Original SVG fixture, no third-party wall photograph.",
      tone: "accent",
    },
    {
      id: "survey",
      label: "Original survey card",
      kind: "image",
      classification: "embed_asset",
      src: surveySvg,
      alt: "Abstract survey and chart generated locally.",
      crop: { xPercent: 48, yPercent: 58, zoom: 1.2 },
      sourceNote: "Original SVG fixture, no copied survey.",
      tone: "success",
    },
    {
      id: "night",
      label: "Original night route",
      kind: "image",
      classification: "embed_asset",
      src: nightSvg,
      alt: "Abstract night route generated locally.",
      crop: { xPercent: 60, yPercent: 60, zoom: 1.1 },
      sourceNote: "Original SVG fixture, no branded city photography.",
      tone: "warning",
    },
  ],
  layers: [
    {
      id: "layer-wall",
      assetId: "wall",
      x: 4,
      y: 5,
      width: 55,
      height: 42,
      rotate: -1.4,
      zIndex: 2,
      tone: "accent",
      caption: {
        kicker: "Archive",
        text: "A clustered wall crop compresses many observations into one legible evidence source.",
        sourceLabel: "embed_asset / local abstraction",
      },
    },
    {
      id: "layer-survey",
      assetId: "survey",
      x: 52,
      y: 10,
      width: 42,
      height: 54,
      rotate: 1.8,
      zIndex: 5,
      tone: "success",
      caption: {
        kicker: "Measure",
        text: "Chart-like evidence is allowed only when the values are fixture-authored and not invented metrics.",
        sourceLabel: "embed_asset / local abstraction",
      },
    },
    {
      id: "layer-night",
      assetId: "night",
      x: 10,
      y: 47,
      width: 63,
      height: 47,
      rotate: -0.6,
      zIndex: 4,
      tone: "warning",
      caption: {
        kicker: "Trace",
        text: "The night crop becomes the connective tissue after archive and measure are established.",
        sourceLabel: "embed_asset / local abstraction",
      },
    },
  ],
  callouts: [
    { label: "Embed gate", detail: "All visible media in this fixture is classification embed_asset and carries original-source notes.", tone: "success" },
    { label: "Dense copy", detail: "Long captions remain tied to each crop so evidence does not become decorative wallpaper.", tone: "warning" },
    { label: "Motion", detail: "Reduced motion keeps the same stack order with shorter travel and no randomized drift.", tone: "accent" },
  ],
  recap: [
    "Archive source sets context.",
    "Survey source adds a measurable claim without external data.",
    "Trace source links the cultural pattern back to movement.",
  ],
  footer: {
    left: "Dense fixture validates caption readability and deterministic crop handling.",
    right: "experimental package",
  },
};
