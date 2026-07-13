import type {
  ProductionVisualFamily,
  SceneContentItem,
  VideoScene,
  VisualAsset,
} from "../../data";
import { isRuntimePackageId, runtimePackages } from "./packages";
import { runtimeFamilySceneKey } from "./adapters";
import type {
  RuntimeFamilyResolution,
  RuntimePackageDescriptor,
  StyleRuntimeChoice,
  StyleRuntimeGuardSummary,
  StyleRuntimeRejection,
} from "./types";

const familyAliases: Record<string, ProductionVisualFamily> = {
  terminal: "terminal-command-center",
  code: "terminal-command-center",
  editorial: "editorial-collage",
  infographic: "technical-editorial",
  dashboard: "dashboard-data",
  data_visualization: "dashboard-data",
  product_demo: "product-showcase",
  cinematic_typography: "cinematic-type",
};

const isExternalNetworkAsset = (src: string): boolean =>
  /^(https?:)?\/\//i.test(src);

const isEmbeddableAsset = (asset: VisualAsset): boolean =>
  asset.usage === "embed_asset" &&
  (asset.kind === "image" || asset.kind === "video") &&
  !isExternalNetworkAsset(asset.src);

const itemText = (item: SceneContentItem): string =>
  [item.label, item.title, item.body, item.note].filter(Boolean).join(" ");

const itemCount = (scene: VideoScene): number =>
  Math.max(scene.content.items?.length ?? 0, scene.content.steps?.length ?? 0);

const bodyCharCount = (scene: VideoScene): number =>
  [
    scene.subtitle.text,
    scene.content.subtitle,
    scene.content.footer,
    ...(scene.content.items ?? []).map(itemText),
    ...(scene.content.steps ?? []).map(itemText),
    ...(scene.content.panels ?? []).map((panel) =>
      [panel.title, panel.body].filter(Boolean).join(" "),
    ),
  ].join(" ").length;

const numericPointsFor = (scene: VideoScene): string[] => {
  const metricPoints =
    scene.content.metrics
      ?.filter((metric) => Number.isFinite(metric.value))
      .map((metric) => `metric:${metric.label}`) ?? [];
  const itemPoints =
    scene.content.items
      ?.filter((item) => Number.isFinite(item.value))
      .map((item) => `item:${item.label ?? item.title ?? "value"}`) ?? [];
  const stepPoints =
    scene.content.steps
      ?.filter((step) => Number.isFinite(step.value))
      .map((step) => `step:${step.label ?? step.title ?? "value"}`) ?? [];

  return [...metricPoints, ...itemPoints, ...stepPoints];
};

export const summarizeRuntimeGuards = (
  scene: VideoScene,
  assets: VisualAsset[],
): StyleRuntimeGuardSummary => {
  const embeddableAssetIds = assets.filter(isEmbeddableAsset).map((asset) => asset.id);
  const numericDataPoints = numericPointsFor(scene);

  return {
    hasEmbeddableAsset: embeddableAssetIds.length > 0,
    embeddableAssetIds,
    hasNumericData: numericDataPoints.length > 0,
    numericDataPoints,
  };
};

export const resolveProductionFamily = (
  requestedFamily?: string,
): RuntimeFamilyResolution => {
  if (!requestedFamily) {
    return {
      requestedFamily,
      resolvedFamily: null,
      reason: "Scene has no production visualFamily; legacy templateId dispatch is preserved.",
    };
  }

  const normalized = requestedFamily.trim().toLowerCase();
  if (isRuntimePackageId(normalized)) {
    return { requestedFamily, resolvedFamily: normalized };
  }

  const aliasTarget = familyAliases[normalized];
  if (aliasTarget) {
    return {
      requestedFamily,
      resolvedFamily: aliasTarget,
      reason: `Resolved legacy visualFamily alias "${requestedFamily}" to package "${aliasTarget}".`,
    };
  }

  return {
    requestedFamily,
    resolvedFamily: null,
    reason: `No registered runtime package for visualFamily "${requestedFamily}".`,
  };
};

const reject = (
  family: string,
  codes: string[],
  reasons: string[],
): StyleRuntimeRejection => ({
  family,
  codes,
  reasons,
});

const contentFitRejections = (
  scene: VideoScene,
  runtimePackage: RuntimePackageDescriptor,
): { codes: string[]; reasons: string[] } => {
  const codes: string[] = [];
  const reasons: string[] = [];
  const capacity = runtimePackage.contentCapacity;

  if (!runtimePackage.supportedTemplateRoles.includes(scene.templateRole)) {
    codes.push("unsupported-template-role");
    reasons.push(
      `Template role "${scene.templateRole}" is not supported by ${runtimePackage.id}.`,
    );
  }

  if (
    capacity.headlineChars !== undefined &&
    scene.headline.length > capacity.headlineChars
  ) {
    codes.push("headline-over-capacity");
    reasons.push(
      `Headline has ${scene.headline.length} chars; ${runtimePackage.id} capacity is ${capacity.headlineChars}.`,
    );
  }

  if (capacity.bodyChars !== undefined && bodyCharCount(scene) > capacity.bodyChars) {
    codes.push("body-over-capacity");
    reasons.push(
      `Body copy has ${bodyCharCount(scene)} chars; ${runtimePackage.id} capacity is ${capacity.bodyChars}.`,
    );
  }

  if (capacity.maxItems !== undefined && itemCount(scene) > capacity.maxItems) {
    codes.push("items-over-capacity");
    reasons.push(
      `Scene has ${itemCount(scene)} item(s); ${runtimePackage.id} supports ${capacity.maxItems}.`,
    );
  }

  const panelCount = scene.content.panels?.length ?? 0;
  if (capacity.maxPanels !== undefined && panelCount > capacity.maxPanels) {
    codes.push("panels-over-capacity");
    reasons.push(
      `Scene has ${panelCount} panel(s); ${runtimePackage.id} supports ${capacity.maxPanels}.`,
    );
  }

  const metricCount = scene.content.metrics?.length ?? 0;
  if (capacity.maxMetrics !== undefined && metricCount > capacity.maxMetrics) {
    codes.push("metrics-over-capacity");
    reasons.push(
      `Scene has ${metricCount} metric(s); ${runtimePackage.id} supports ${capacity.maxMetrics}.`,
    );
  }

  const codeLineCount = scene.content.lines?.length ?? 0;
  if (capacity.maxCodeLines !== undefined && codeLineCount > capacity.maxCodeLines) {
    codes.push("code-over-capacity");
    reasons.push(
      `Scene has ${codeLineCount} code line(s); ${runtimePackage.id} supports ${capacity.maxCodeLines}.`,
    );
  }

  return { codes, reasons };
};

const guardRejections = (
  runtimePackage: RuntimePackageDescriptor,
  guards: StyleRuntimeGuardSummary,
): { codes: string[]; reasons: string[] } => {
  const codes: string[] = [];
  const reasons: string[] = [];

  if (runtimePackage.requiresEmbeddableAsset && !guards.hasEmbeddableAsset) {
    codes.push("requires-embeddable-asset");
    reasons.push(
      `${runtimePackage.id} is asset-led and requires at least one local/data embed_asset image or video.`,
    );
  }

  if (runtimePackage.requiresNumericData && !guards.hasNumericData) {
    codes.push("requires-numeric-data");
    reasons.push(
      `${runtimePackage.id} requires explicit numeric metrics or numeric item values.`,
    );
  }

  return { codes, reasons };
};

const legacyChoice = (
  scene: VideoScene,
  guards: StyleRuntimeGuardSummary,
  reasons: string[],
  rejected: StyleRuntimeRejection[] = [],
): StyleRuntimeChoice => ({
  requestedFamily: scene.visualFamily,
  selectedFamily: null,
  rendererKind: "template-adapter",
  rendererId: "legacy-templateId",
  templateId: scene.templateId,
  guards,
  reasons,
  rejected,
});

export const resolveStyleRuntimeChoice = ({
  scene,
  assets,
}: {
  scene: VideoScene;
  assets: VisualAsset[];
}): StyleRuntimeChoice => {
  const guards = summarizeRuntimeGuards(scene, assets);
  const resolved = resolveProductionFamily(scene.visualFamily);

  if (!resolved.resolvedFamily) {
    return legacyChoice(
      scene,
      guards,
      [resolved.reason ?? "No package-backed family was selected."],
      scene.visualFamily
        ? [
            reject(scene.visualFamily, ["unknown-visual-family"], [
              resolved.reason ?? "Unknown visualFamily.",
            ]),
          ]
        : [],
    );
  }

  const runtimePackage = runtimePackages[resolved.resolvedFamily];
  const fit = contentFitRejections(scene, runtimePackage);
  const requiredData = guardRejections(runtimePackage, guards);
  const rejectionCodes = [...fit.codes, ...requiredData.codes];
  const rejectionReasons = [...fit.reasons, ...requiredData.reasons];

  if (rejectionCodes.length > 0) {
    return legacyChoice(
      scene,
      guards,
      [
        resolved.reason,
        `Package "${runtimePackage.id}" was rejected; preserving legacy templateId "${scene.templateId}".`,
      ].filter((reason): reason is string => Boolean(reason)),
      [reject(runtimePackage.id, rejectionCodes, rejectionReasons)],
    );
  }

  const familySceneKey = runtimeFamilySceneKey(runtimePackage.id, scene, assets);
  const reasons = [
    resolved.reason,
    `Selected package "${runtimePackage.id}" (${runtimePackage.status}) for visualFamily "${scene.visualFamily}".`,
    runtimePackage.rendererKind === "template-adapter"
      ? `Package uses template adapter compatibility with templateId "${scene.templateId}".`
      : `Package uses runtime family renderer "${runtimePackage.rendererId}".`,
  ].filter((reason): reason is string => Boolean(reason));

  return {
    requestedFamily: scene.visualFamily,
    selectedFamily: runtimePackage.id,
    packageLabel: runtimePackage.label,
    packageStatus: runtimePackage.status,
    rendererKind: runtimePackage.rendererKind,
    rendererId: runtimePackage.rendererId,
    templateId: scene.templateId,
    familySceneKey,
    guards,
    reasons,
    rejected: [],
  };
};
