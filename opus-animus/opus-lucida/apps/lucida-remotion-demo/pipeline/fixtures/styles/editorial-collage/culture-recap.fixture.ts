import type { EditorialCollageFixture } from "../../../../src/styles/families/editorial-collage";

const broadcastSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1200'%3E%3Crect width='1200' height='1200' fill='%230A0A08'/%3E%3Ccircle cx='600' cy='600' r='180' fill='%23F0B341'/%3E%3Cg fill='none' stroke='%23FFF7E5' stroke-width='36' opacity='0.78'%3E%3Cpath d='M274 600 C274 420 420 274 600 274'/%3E%3Cpath d='M926 600 C926 420 780 274 600 274'/%3E%3Cpath d='M186 600 C186 372 372 186 600 186'/%3E%3Cpath d='M1014 600 C1014 372 828 186 600 186'/%3E%3C/g%3E%3C/svg%3E";

const fieldNoteSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1400'%3E%3Crect width='1000' height='1400' fill='%23FFF7E5'/%3E%3Cpath d='M110 190 H866 M110 330 H780 M110 470 H884 M110 610 H726 M110 750 H850' stroke='%2311100D' stroke-width='28' opacity='0.72'/%3E%3Cpath d='M154 970 C330 810 580 1140 842 920' stroke='%234FA86B' stroke-width='54' fill='none'/%3E%3Ccircle cx='202' cy='1084' r='68' fill='%23E84A3C'/%3E%3C/svg%3E";

const routeSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'%3E%3Crect width='1200' height='900' fill='%23D8C08A'/%3E%3Cg fill='none' stroke='%2311100D' stroke-width='26' opacity='0.72'%3E%3Cpath d='M80 770 C280 180 468 760 666 260 S948 230 1120 110'/%3E%3Cpath d='M86 138 C348 610 626 128 1114 726'/%3E%3C/g%3E%3Cg fill='%235B7C84'%3E%3Ccircle cx='186' cy='560' r='60'/%3E%3Ccircle cx='606' cy='398' r='72'/%3E%3Ccircle cx='950' cy='280' r='58'/%3E%3C/g%3E%3C/svg%3E";

export const editorialCollageCultureRecapFixture: EditorialCollageFixture = {
  key: "culture-recap",
  sceneType: "culture-recap",
  sceneLabel: "Culture recap",
  durationInFrames: 180,
  density: "balanced",
  motionPolicy: "reduce",
  eyebrow: "Culture brief / recap",
  title: "A closing collage can connect broadcast, field note, and route without turning the recap into decoration",
  subtitle:
    "Three original local signals hold their own captions while the fixed recap rail states the sequence that connects them.",
  deck: "Read the closing thread from broadcast cue to field note, then use the route to carry the signal forward.",
  assets: [
    { id: "broadcast", label: "Original broadcast signal", kind: "image", classification: "embed_asset", src: broadcastSvg, alt: "Abstract local broadcast signal.", crop: { xPercent: 50, yPercent: 50, zoom: 1.1 }, sourceNote: "Original SVG fixture, no broadcast brand.", tone: "warning" },
    { id: "field-note", label: "Original field note", kind: "image", classification: "embed_asset", src: fieldNoteSvg, alt: "Abstract local field note.", crop: { xPercent: 48, yPercent: 54, zoom: 1.12 }, sourceNote: "Original SVG fixture, no copied notebook.", tone: "accent" },
    { id: "route", label: "Original route signal", kind: "image", classification: "embed_asset", src: routeSvg, alt: "Abstract local route signal.", crop: { xPercent: 54, yPercent: 48, zoom: 1.05 }, sourceNote: "Original SVG fixture, no map brand.", tone: "success" },
  ],
  layers: [
    { id: "layer-broadcast", assetId: "broadcast", x: 4, y: 7, width: 54, height: 48, rotate: -2.1, zIndex: 3, tone: "warning", caption: { kicker: "Broadcast", text: "The opening cue appears as a visible signal, not an unlabelled atmosphere crop.", sourceLabel: "embed_asset / original vector" } },
    { id: "layer-note", assetId: "field-note", x: 52, y: 5, width: 41, height: 50, rotate: 2.1, zIndex: 5, tone: "accent", caption: { kicker: "Field note", text: "The local note gives the thread a concrete observation before the route carries it onward.", sourceLabel: "embed_asset / original vector" } },
    { id: "layer-route", assetId: "route", x: 22, y: 54, width: 69, height: 39, rotate: 0.6, zIndex: 4, tone: "success", caption: { kicker: "Route", text: "The final crop connects the two earlier signals through an explicit movement trace.", sourceLabel: "embed_asset / original vector" } },
  ],
  callouts: [
    { label: "Thread", detail: "The recap reads in a fixed sequence so the collage ends with an accountable connection.", tone: "success" },
    { label: "Captions", detail: "Each crop names its source role and remains attached to the corresponding local asset.", tone: "accent" },
    { label: "Motion", detail: "Reduced motion preserves the same final stack without randomized drift.", tone: "warning" },
  ],
  recap: ["Broadcast names the cue.", "Field note records the observation.", "Route carries the narrative connection."],
  footer: { left: "Signal-thread fixture uses original local vector assets only.", right: "reduced motion" },
};
