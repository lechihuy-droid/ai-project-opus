import type { EditorialCollageFixture } from "../../../../src/styles/families/editorial-collage";

const ledgerSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1500'%3E%3Crect width='1200' height='1500' fill='%23F1E7D0'/%3E%3Crect x='94' y='88' width='1012' height='1324' fill='%23FFF7E5' stroke='%2311100D' stroke-width='22'/%3E%3Cg stroke='%2311100D' stroke-width='18' opacity='0.74'%3E%3Cpath d='M170 260 H1010 M170 390 H920 M170 520 H980 M170 650 H870 M170 780 H1000'/%3E%3C/g%3E%3Crect x='170' y='910' width='370' height='274' fill='%23D8C08A'/%3E%3Crect x='592' y='910' width='332' height='120' fill='%23E84A3C'/%3E%3Crect x='592' y='1060' width='420' height='124' fill='%235B7C84'/%3E%3C/svg%3E";

const posterSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1300'%3E%3Crect width='1000' height='1300' fill='%2311100D'/%3E%3Crect x='92' y='104' width='816' height='1088' fill='%23E84A3C'/%3E%3Ccircle cx='500' cy='482' r='232' fill='%23F0B341'/%3E%3Cpath d='M182 832 H818 M182 920 H700 M182 1008 H772' stroke='%23FFF7E5' stroke-width='36'/%3E%3C/svg%3E";

const indexSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'%3E%3Crect width='1200' height='900' fill='%235B7C84'/%3E%3Cg fill='%23FFF7E5'%3E%3Crect x='130' y='120' width='288' height='172'/%3E%3Crect x='458' y='120' width='288' height='172'/%3E%3Crect x='786' y='120' width='288' height='172'/%3E%3Crect x='130' y='348' width='288' height='172'/%3E%3Crect x='458' y='348' width='288' height='172'/%3E%3Crect x='786' y='348' width='288' height='172'/%3E%3C/g%3E%3Cpath d='M130 684 H1074' stroke='%23F0B341' stroke-width='46'/%3E%3C/svg%3E";

export const editorialCollageVisualEssayFixture: EditorialCollageFixture = {
  key: "visual-essay",
  sceneType: "visual-essay",
  sceneLabel: "Visual essay",
  durationInFrames: 180,
  density: "dense",
  motionPolicy: "full",
  eyebrow: "Culture brief / visual essay",
  title: "A document-led collage can keep each supporting signal visible without flattening them into one claim",
  subtitle:
    "The archive page carries the reading order while a poster and index crop remain explicitly labelled local evidence surfaces.",
  deck: "Start with the archive, test its signal against the poster, then retain the index as a separate trace.",
  assets: [
    { id: "ledger", label: "Original archive ledger", kind: "image", classification: "embed_asset", src: ledgerSvg, alt: "Abstract local archive ledger.", crop: { xPercent: 52, yPercent: 46, zoom: 1.12 }, sourceNote: "Original SVG fixture, no copied document.", tone: "warning" },
    { id: "poster", label: "Original public poster", kind: "image", classification: "embed_asset", src: posterSvg, alt: "Abstract local poster.", crop: { xPercent: 50, yPercent: 48, zoom: 1.08 }, sourceNote: "Original SVG fixture, no branded poster.", tone: "accent" },
    { id: "index", label: "Original catalogue index", kind: "image", classification: "embed_asset", src: indexSvg, alt: "Abstract local catalogue index.", crop: { xPercent: 50, yPercent: 52, zoom: 1.06 }, sourceNote: "Original SVG fixture, no proprietary catalogue.", tone: "success" },
  ],
  layers: [
    { id: "layer-ledger", assetId: "ledger", x: 4, y: 5, width: 57, height: 57, rotate: -1.6, zIndex: 3, tone: "warning", caption: { kicker: "Archive", text: "The dominant document crop establishes the evidence order without claiming external provenance.", sourceLabel: "embed_asset / original vector" } },
    { id: "layer-poster", assetId: "poster", x: 49, y: 8, width: 44, height: 40, rotate: 2.3, zIndex: 5, tone: "accent", caption: { kicker: "Signal", text: "A compact poster crop adds a visible public-facing signal to the ledger.", sourceLabel: "embed_asset / original vector" } },
    { id: "layer-index", assetId: "index", x: 27, y: 54, width: 65, height: 39, rotate: 0.8, zIndex: 4, tone: "success", caption: { kicker: "Index", text: "The catalogue tile keeps the third trace distinct rather than blending it into the archive.", sourceLabel: "embed_asset / original vector" } },
  ],
  callouts: [
    { label: "Order", detail: "The document remains the first read, while supporting crops stay captioned and bounded.", tone: "warning" },
    { label: "Policy", detail: "Every visible crop is an original local SVG classified as embed_asset.", tone: "success" },
    { label: "Density", detail: "Dense source copy uses the existing caption rail instead of adding unbounded panels.", tone: "accent" },
  ],
  recap: ["Archive establishes the trace.", "Poster adds one local signal.", "Index keeps the comparison inspectable."],
  footer: { left: "Archive-ledger fixture uses original local vector assets only.", right: "full motion" },
};
