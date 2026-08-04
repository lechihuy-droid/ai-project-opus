export const LEGACY_VISUAL_FAMILIES = [
  "terminal",
  "dashboard",
  "editorial",
  "infographic",
  "code",
  "data_visualization",
  "product_demo",
  "cinematic_typography",
];

export const PRODUCTION_PACKAGE_IDS = [
  "terminal-command-center",
  "technical-editorial",
  "minimal-education",
  "cinematic-type",
  "dashboard-data",
  "paper-notebook",
  "product-showcase",
  "editorial-collage",
  "timeline-documentary",
];

const packageForLegacyFamily = {
  terminal: "terminal-command-center",
  code: "terminal-command-center",
  editorial: "editorial-collage",
  infographic: "technical-editorial",
  dashboard: "dashboard-data",
  data_visualization: "dashboard-data",
  product_demo: "product-showcase",
  cinematic_typography: "cinematic-type",
};

const legacyFamilyForPackage = {
  "terminal-command-center": "terminal",
  "technical-editorial": "infographic",
  "minimal-education": "editorial",
  "cinematic-type": "cinematic_typography",
  "dashboard-data": "dashboard",
  "paper-notebook": "editorial",
  "product-showcase": "product_demo",
  "editorial-collage": "editorial",
  "timeline-documentary": "editorial",
};

export const isLegacyVisualFamily = (value) => LEGACY_VISUAL_FAMILIES.includes(value);
export const isProductionPackageId = (value) => PRODUCTION_PACKAGE_IDS.includes(value);

export const resolveProductionPackageId = (value) => {
  if (typeof value !== "string") return null;
  return isProductionPackageId(value) ? value : packageForLegacyFamily[value] ?? null;
};

export const legacyFamilyForPackageId = (packageId) =>
  legacyFamilyForPackage[packageId] ?? null;
