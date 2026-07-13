import terminalComponentMapJson from "../../../design/visual-library/styles/terminal-command-center/component-map.json";
import terminalVisualJson from "../../../design/visual-library/styles/terminal-command-center/visual.json";
import technicalComponentMapJson from "../../../design/visual-library/styles/technical-editorial/component-map.json";
import technicalVisualJson from "../../../design/visual-library/styles/technical-editorial/visual.json";
import minimalComponentMapJson from "../../../design/visual-library/styles/minimal-education/component-map.json";
import minimalVisualJson from "../../../design/visual-library/styles/minimal-education/visual.json";
import cinematicComponentMapJson from "../../../design/visual-library/styles/cinematic-type/component-map.json";
import cinematicVisualJson from "../../../design/visual-library/styles/cinematic-type/visual.json";
import dashboardComponentMapJson from "../../../design/visual-library/styles/dashboard-data/component-map.json";
import dashboardVisualJson from "../../../design/visual-library/styles/dashboard-data/visual.json";
import notebookComponentMapJson from "../../../design/visual-library/styles/paper-notebook/component-map.json";
import notebookVisualJson from "../../../design/visual-library/styles/paper-notebook/visual.json";
import productComponentMapJson from "../../../design/visual-library/styles/product-showcase/component-map.json";
import productVisualJson from "../../../design/visual-library/styles/product-showcase/visual.json";
import collageComponentMapJson from "../../../design/visual-library/styles/editorial-collage/component-map.json";
import collageVisualJson from "../../../design/visual-library/styles/editorial-collage/visual.json";
import timelineComponentMapJson from "../../../design/visual-library/styles/timeline-documentary/component-map.json";
import timelineVisualJson from "../../../design/visual-library/styles/timeline-documentary/visual.json";
import type { ProductionVisualFamily, TemplateRole } from "../../data";
import type { RuntimePackageDescriptor, RuntimeRendererKind } from "./types";

type RuntimeVisualJson = {
  id: ProductionVisualFamily;
  label: string;
  status: string;
  visualFamily: string;
  supportedTemplateRoles: TemplateRole[];
  preferredTemplates?: string[];
  contentCapacity?: RuntimePackageDescriptor["contentCapacity"];
};

type RuntimeComponentMapJson = {
  templates?: {
    templateId: string;
  }[];
};

const assetLedFamilyIds: ProductionVisualFamily[] = [
  "product-showcase",
  "editorial-collage",
];

const numericFamilyIds: ProductionVisualFamily[] = ["dashboard-data"];

const templateBackedFamilyIds: ProductionVisualFamily[] = [
  "terminal-command-center",
];

const rendererKindFor = (id: ProductionVisualFamily): RuntimeRendererKind =>
  templateBackedFamilyIds.includes(id) ? "template-adapter" : "family-renderer";

const definePackage = (
  visualJson: RuntimeVisualJson,
  componentMapJson: RuntimeComponentMapJson,
): RuntimePackageDescriptor => {
  const packageTemplateIds = (componentMapJson.templates ?? []).map(
    (template) => template.templateId,
  );

  return {
    id: visualJson.id,
    label: visualJson.label,
    status: visualJson.status,
    visualFamily: visualJson.visualFamily,
    supportedTemplateRoles: visualJson.supportedTemplateRoles,
    preferredTemplates: visualJson.preferredTemplates ?? [],
    packageTemplateIds,
    contentCapacity: visualJson.contentCapacity ?? {},
    requiresEmbeddableAsset: assetLedFamilyIds.includes(visualJson.id),
    requiresNumericData: numericFamilyIds.includes(visualJson.id),
    rendererKind: rendererKindFor(visualJson.id),
    rendererId: `${visualJson.id}:${rendererKindFor(visualJson.id)}`,
  };
};

export const runtimePackageList: RuntimePackageDescriptor[] = [
  definePackage(terminalVisualJson as RuntimeVisualJson, terminalComponentMapJson),
  definePackage(technicalVisualJson as RuntimeVisualJson, technicalComponentMapJson),
  definePackage(minimalVisualJson as RuntimeVisualJson, minimalComponentMapJson),
  definePackage(cinematicVisualJson as RuntimeVisualJson, cinematicComponentMapJson),
  definePackage(dashboardVisualJson as RuntimeVisualJson, dashboardComponentMapJson),
  definePackage(notebookVisualJson as RuntimeVisualJson, notebookComponentMapJson),
  definePackage(productVisualJson as RuntimeVisualJson, productComponentMapJson),
  definePackage(collageVisualJson as RuntimeVisualJson, collageComponentMapJson),
  definePackage(timelineVisualJson as RuntimeVisualJson, timelineComponentMapJson),
];

export const runtimePackages = Object.fromEntries(
  runtimePackageList.map((runtimePackage) => [
    runtimePackage.id,
    runtimePackage,
  ]),
) as Record<ProductionVisualFamily, RuntimePackageDescriptor>;

export const isRuntimePackageId = (
  value: string,
): value is ProductionVisualFamily =>
  Object.prototype.hasOwnProperty.call(runtimePackages, value);
