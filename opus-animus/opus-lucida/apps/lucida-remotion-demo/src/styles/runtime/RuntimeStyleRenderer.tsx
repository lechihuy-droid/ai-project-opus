import type { ReactElement } from "react";
import type { TemplateAdapterProps } from "../../templateRegistry";
import { TechnicalEditorialScene } from "../families/technical-editorial";
import { MinimalEducationFamilyComposition } from "../families/minimal-education/renderer";
import { CinematicTypeScene } from "../families/cinematic-type";
import { DashboardDataScene } from "../families/dashboard-data";
import { PaperNotebookScene } from "../families/paper-notebook";
import { ProductShowcaseScene } from "../families/product-showcase";
import { EditorialCollageScene } from "../families/editorial-collage";
import { TimelineDocumentaryScene } from "../families/timeline-documentary";
import { buildMinimalEducationScene, buildTechnicalEditorialScene } from "./adapters";
import {
  cinematicTypeSceneKey,
  editorialCollageSceneKey,
  paperNotebookSceneKey,
  timelineDocumentarySceneKey,
} from "./family-scene-keys";
import type { StyleRuntimeChoice } from "./types";

type RuntimeStyleRendererProps = TemplateAdapterProps & {
  choice: StyleRuntimeChoice;
  fallback: ReactElement;
};

export const RuntimeStyleRenderer = ({
  choice,
  fallback,
  scene,
}: RuntimeStyleRendererProps) => {
  if (choice.rendererKind !== "family-renderer" || !choice.selectedFamily) {
    return fallback;
  }

  if (choice.selectedFamily === "technical-editorial") {
    return (
      <TechnicalEditorialScene
        fixture={buildTechnicalEditorialScene(scene)}
      />
    );
  }

  if (choice.selectedFamily === "minimal-education") {
    return <MinimalEducationFamilyComposition scene={buildMinimalEducationScene(scene)} />;
  }

  if (choice.selectedFamily === "cinematic-type") {
    return (
      <CinematicTypeScene
        sceneKey={cinematicTypeSceneKey(choice.familySceneKey)}
      />
    );
  }

  if (choice.selectedFamily === "dashboard-data") {
    return (
      <DashboardDataScene
        sceneKey={(choice.familySceneKey ?? "normal") as "normal" | "dense" | "edge"}
      />
    );
  }

  if (choice.selectedFamily === "paper-notebook") {
    return (
      <PaperNotebookScene
        sceneKey={paperNotebookSceneKey(choice.familySceneKey)}
      />
    );
  }

  if (choice.selectedFamily === "product-showcase") {
    return (
      <ProductShowcaseScene
        sceneKey={(choice.familySceneKey ?? "normal") as "normal" | "dense" | "edge"}
      />
    );
  }

  if (choice.selectedFamily === "editorial-collage") {
    return (
      <EditorialCollageScene
        sceneKey={editorialCollageSceneKey(choice.familySceneKey)}
      />
    );
  }

  if (choice.selectedFamily === "timeline-documentary") {
    return (
      <TimelineDocumentaryScene
        sceneKey={timelineDocumentarySceneKey(choice.familySceneKey)}
      />
    );
  }

  return fallback;
};
