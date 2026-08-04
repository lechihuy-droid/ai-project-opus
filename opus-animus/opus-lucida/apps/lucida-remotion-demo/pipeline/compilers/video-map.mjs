const templateFor = {
  terminal: "code-panel",
  code: "code-panel",
  editorial: "animated-list",
  infographic: "animated-list",
  dashboard: "progress-steps",
  data_visualization: "progress-steps",
  product_demo: "split-screen",
  cinematic_typography: "cinematic-title-intro",
};

const videoMapIntentFor = (intent, legacyFamily) => {
  const normalized = typeof intent === "string" ? intent.replaceAll("-", "_") : null;
  const supported = new Set([
    "hook", "problem", "comparison", "process", "system_architecture",
    "list", "use_case", "takeaway", "quote", "code_explanation", "explain",
  ]);
  if (supported.has(normalized)) return normalized;
  return legacyFamily === "terminal" || legacyFamily === "code" ? "code_explanation" : "process";
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const comparisonClauseFor = (source, actor) => {
  const actorPattern = new RegExp(`\\b${escapeRegExp(actor)}\\b`, "iu");
  const clauses = source.split(/[,;]\s*|\s+(?=(?:and|but|while|whereas)\b)/iu);
  const clause = clauses.find((candidate) => actorPattern.test(candidate));
  if (!clause) return null;
  const concise = clause
    .replace(actorPattern, "")
    .replace(/^\s*(?:teams|users|operators|you|we)\s+(?:can|should|will)\s+/iu, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[a-z]/u, (letter) => letter.toUpperCase());
  return concise && !/\b(?:to|for|with|at|in|on)$/iu.test(concise) ? concise : null;
};

const contentFor = (scene, legacyFamily) => {
  const texts = scene.blocks.map((block) => block.text).filter(Boolean);
  const semanticInputs = scene.directorSelection?.semanticInputs ?? {};
  const actors = semanticInputs.actors ?? [];
  const base = {
    kicker: (scene.packageId ?? legacyFamily).toUpperCase().replaceAll("_", " "),
    title: scene.title ?? texts[0] ?? "Visual scene",
    subtitle: texts[1] ?? "",
    footer: scene.preset,
  };
  if (legacyFamily === "terminal" || legacyFamily === "code") {
    const lines = texts.flatMap((text) => text.split(/\r?\n/))
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines[0] === scene.title) lines.shift();
    return {
      ...base,
      codeTitle: scene.preset,
      lines: lines.length ? lines : ["No output"],
      highlights: lines.map((_, i) => i),
    };
  }
  if (
    legacyFamily === "dashboard" ||
    legacyFamily === "data_visualization"
  ) {
    return {
      ...base,
      steps: texts.map((text, index) => ({
        number: String(index + 1).padStart(2, "0"),
        title: text,
      })),
    };
  }
  if (scene.intent === "comparison" && actors.length >= 2) {
    const source = texts.join(" ");
    return {
      ...base,
      items: actors.slice(0, 2).map((actor, index) => {
        const body = comparisonClauseFor(source, actor);
        return {
          number: String(index + 1).padStart(2, "0"),
          title: actor,
          ...(body ? { body } : {}),
        };
      }),
    };
  }
  return {
    ...base,
    items: [...texts.map((text, index) => ({
      number: String(index + 1).padStart(2, "0"),
      title: text,
    })), ...actors.map((actor, index) => ({
      number: String(texts.length + index + 1).padStart(2, "0"),
      label: "Actor",
      title: actor,
    }))],
  };
};

export const compileVideoMap = (mapped, config) => {
  const scenes = mapped.scenes.map((scene) => {
    const legacyFamily = scene.legacyFamily ?? scene.visualFamily;
    const packageId = scene.packageId ?? scene.visualFamily;
    const text = scene.blocks
      .map((block) => block.text)
      .filter(Boolean)
      .join("\n");
    return {
      id: scene.sceneId,
      visualFamily: packageId,
      intent: videoMapIntentFor(scene.intent, legacyFamily),
      templateId: templateFor[legacyFamily] ?? "animated-list",
      templateRole: "scene",
      durationSec: scene.durationInFrames / config.fps,
      headline: scene.title ?? "Visual scene",
      subtitle: {
        text: text || scene.title || "Visual scene",
        segments: [text || scene.title || "Visual scene"],
      },
      content: contentFor(scene, legacyFamily),
      style: {
        density:
          scene.blocks.length > 6
            ? "high"
            : scene.blocks.length > 3
              ? "medium"
              : "low",
        safeArea: "tiktok",
      },
      motion:
        legacyFamily === "terminal"
          ? ["terminal_reveal", "line_typewriter"]
          : ["staggered_list", "title_reveal"],
      backgroundEffect:
        legacyFamily === "terminal" ? "matrix-rain" : "noise-grain",
      transitionIn: "cross-dissolve",
      transitionOut: "cross-dissolve",
      subtitleMode:
        legacyFamily === "terminal" || legacyFamily === "code"
          ? "none"
          : "bar",
      layout: scene.effectiveLayout ?? "top-title",
      reason: `Compiled from ${packageId} via ${legacyFamily}/${scene.preset} with provenance-backed blocks${scene.knowledgeEvidence?.length ? ` and ${scene.knowledgeEvidence.length} approved RAG evidence item(s)` : ""}.`,
    };
  });
  const durationSec = scenes.reduce((sum, scene) => sum + scene.durationSec, 0);
  return {
    brand: {
      id: "lucida-ai-v1",
      series: "lucida-now",
      contractRef: "docs/market-research/11-pipeline-contract.md",
    },
    video: {
      title: config.projectId,
      subtitle: "Generated by Lucida visual input pipeline",
      format: "vertical_9_16",
      width: 1080,
      height: 1920,
      fps: config.fps,
      durationSec,
      style: "lucida_visual_pipeline",
      language: "en",
      sourceBlocks: mapped.scenes.flatMap((scene) =>
        scene.blocks.flatMap((block) => block.sourceEventIds),
      ),
    },
    theme: {
      name: config.themeId,
      accent: "#D2B47A",
      accentSoft: "#F4E2BD",
      background: "#0B0C0E",
      foreground: "#F4F0E8",
      muted: "#A7A39B",
    },
    assets: [],
    scenes,
  };
};
