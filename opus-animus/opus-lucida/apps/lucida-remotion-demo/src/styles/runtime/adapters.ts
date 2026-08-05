import type {
  ProductionVisualFamily,
  SceneContentItem,
  VideoScene,
  VisualAsset,
} from "../../data";
import type {
  MinimalEducationAccentTone,
  MinimalEducationScene,
} from "../families/minimal-education/types";
import type { TechnicalEditorialFixture } from "../families/technical-editorial/types";

const textForItem = (item: SceneContentItem): string =>
  item.title ?? item.label ?? item.body ?? item.note ?? "";

const detailForItem = (item: SceneContentItem): string =>
  item.body ?? item.note ?? item.label ?? item.title ?? "";

const sceneItems = (scene: VideoScene): SceneContentItem[] =>
  scene.content.steps ?? scene.content.items ?? [];

const densityFor = (scene: VideoScene): MinimalEducationScene["density"] => {
  if (scene.style.density === "high") return "dense";
  if (scene.style.density === "low") return "sparse";
  return "balanced";
};

const accentToneFor = (scene: VideoScene): MinimalEducationAccentTone => {
  const source = `${scene.id} ${scene.accent}`.toLowerCase();
  if (source.includes("teal") || source.includes("cyan")) return "teal";
  if (source.includes("gold") || source.includes("yellow")) return "gold";
  if (source.includes("coral") || source.includes("red")) return "coral";
  return "blue";
};

const summaryFor = (scene: VideoScene): string =>
  [scene.content.subtitle, scene.subtitle.text, scene.narration[0]]
    .find((value) => typeof value === "string" && value.trim()) ?? "";

export const buildTechnicalEditorialScene = (
  scene: VideoScene,
): TechnicalEditorialFixture => {
  const items = sceneItems(scene).filter((item) => textForItem(item)).slice(0, 5);
  const sourceItems = items.length > 0 ? items : [{ title: scene.title, body: summaryFor(scene) }];
  const actorItems = sourceItems.filter((item) => item.label === "Actor");
  const structuralItems = actorItems.length > 0 ? actorItems : sourceItems;
  const codeLines = scene.content.lines?.length
    ? scene.content.lines
    : summaryFor(scene).split(/\r?\n/).filter(Boolean);
  return {
    key: scene.style.density === "high" ? "dense" : "normal",
    sceneLabel: scene.intent.replace(/_/g, " "),
    eyebrow: scene.kicker,
    title: scene.title,
    summary: summaryFor(scene),
    density: scene.style.density === "high" ? "dense" : scene.style.density === "low" ? "sparse" : "balanced",
    motionPolicy: "full",
    annotations: sourceItems.slice(0, 3).map((item, index) => ({
      label: item.label ?? `Evidence ${String(index + 1).padStart(2, "0")}`,
      value: textForItem(item),
      note: detailForItem(item) === textForItem(item) ? undefined : detailForItem(item),
      tone: index === 0 ? "accent" : "neutral",
    })),
    metrics: [
      { label: "Intent", value: scene.intent.replace(/_/g, " "), detail: "Director-selected scene role", tone: "accent" },
      { label: "Density", value: scene.style.density, detail: "VideoMap content density", tone: "neutral" },
    ],
    diagram: {
      title: scene.content.kicker ?? scene.kicker,
      subtitle: scene.content.subtitle ?? scene.subtitle.text,
      nodes: structuralItems.slice(0, 3).map((item, index) => ({
        kicker: String(index + 1).padStart(2, "0"),
        label: textForItem(item),
        detail: detailForItem(item) === textForItem(item) ? summaryFor(scene) : detailForItem(item),
        tone: index === 0 ? "accent" : "neutral",
      })),
      connectors: structuralItems.slice(1, 3).map((_, index) => `0${index + 1} -> 0${index + 2}`),
    },
    code: {
      filename: scene.content.codeTitle ?? `${scene.id}.txt`,
      language: scene.content.lines ? "text" : "evidence",
      lines: (codeLines.length > 0 ? codeLines : [scene.title]).slice(0, 5),
    },
    steps: structuralItems.slice(0, 4).map((item, index) => ({
      index: String(index + 1).padStart(2, "0"),
      label: textForItem(item),
      detail: detailForItem(item) === textForItem(item) ? summaryFor(scene) : detailForItem(item),
    })),
    footer: {
      left: scene.visualFamily ?? "technical-editorial",
      right: scene.reason,
    },
  };
};

export const buildMinimalEducationScene = (
  scene: VideoScene,
): MinimalEducationScene => {
  const items = sceneItems(scene).filter((item) => textForItem(item)).slice(0, 6);
  const base = {
    sceneId: scene.id,
    durationInFrames: scene.durationFrames,
    motionPolicy: "full" as const,
    density: densityFor(scene),
    accentTone: accentToneFor(scene),
    eyebrow: scene.kicker,
    title: scene.title,
    summary: summaryFor(scene),
    footer: scene.footer || scene.reason,
    callout: {
      label: scene.intent.replace(/_/g, " "),
      value: scene.content.cta?.label ?? scene.content.kicker ?? scene.intent,
    },
  };

  if (scene.intent === "comparison" && items.length >= 2) {
    const [left, right, ...criteria] = items;
    const comparisonCriteria = criteria.length > 0
      ? criteria.slice(0, 5).map((item, index) => ({
          label: item.label ?? `Point ${index + 1}`,
          leftValue: item.title ?? item.body ?? textForItem(left),
          rightValue: item.note ?? item.body ?? textForItem(right),
          emphasis: index === 0 ? "right" as const : "neutral" as const,
        }))
      : [{
          label: "Decision point",
          leftValue: detailForItem(left),
          rightValue: detailForItem(right),
          emphasis: "right" as const,
        }];
    return {
      ...base,
      sceneType: "comparison",
      comparison: {
        leftTitle: textForItem(left),
        rightTitle: textForItem(right),
        criteria: comparisonCriteria,
      },
    };
  }

  if (scene.content.steps || scene.intent === "process" || items.length > 3) {
    return {
      ...base,
      sceneType: "steps",
      steps: {
        headline: scene.content.kicker ?? scene.headline,
        items: (items.length > 0 ? items : [{ title: scene.title }]).map(
          (item, index) => ({
            index: item.number ?? String(index + 1).padStart(2, "0"),
            title: textForItem(item),
            detail: detailForItem(item),
            state: index === 0 ? "active" : "ready",
          }),
        ),
      },
    };
  }

  const keyPoints = (items.length > 0 ? items : [{ title: scene.title }])
    .slice(0, 3)
    .map((item, index) => ({
      label: item.label ?? `Point ${index + 1}`,
      detail: detailForItem(item),
    }));

  return {
    ...base,
    sceneType: "definition",
    definition: {
      term: scene.content.kicker ?? scene.kicker,
      phonetic: scene.content.footer ?? scene.footer,
      meaning: scene.content.subtitle ?? scene.headline,
      keyPoints,
    },
  };
};

const countEmbeddableAssets = (assets: VisualAsset[]): number =>
  assets.filter((asset) => asset.usage === "embed_asset").length;

export const runtimeFamilySceneKey = (
  familyId: ProductionVisualFamily,
  scene: VideoScene,
  assets: VisualAsset[],
): string | undefined => {
  if (familyId === "technical-editorial") {
    return scene.style.density === "high"
      ? "dense"
      : scene.nodes.length > 0
        ? "normal"
        : "edge";
  }

  if (familyId === "minimal-education") {
    return buildMinimalEducationScene(scene).sceneType;
  }

  if (familyId === "cinematic-type") {
    if (scene.intent === "hook") return "hook";
    if (scene.intent === "quote") return "quote";
    return "transition";
  }

  if (familyId === "dashboard-data") {
    return scene.style.density === "high" ? "dense" : "normal";
  }

  if (familyId === "paper-notebook") {
    if (scene.content.steps) return "checklist";
    if (scene.content.lines) return "derivation";
    return "notes";
  }

  if (familyId === "product-showcase") {
    if (countEmbeddableAssets(assets) >= 2) return "edge";
    return scene.style.density === "high" ? "dense" : "normal";
  }

  if (familyId === "editorial-collage") {
    return scene.style.density === "high" ? "dense" : "normal";
  }

  if (familyId === "timeline-documentary") {
    if (scene.intent === "takeaway") return "conclusion";
    if (sceneItems(scene).length > 4) return "era-change";
    return "milestone";
  }

  return undefined;
};
