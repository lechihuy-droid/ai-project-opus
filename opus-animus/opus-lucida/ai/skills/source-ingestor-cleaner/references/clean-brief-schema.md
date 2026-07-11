# Clean Brief Schema

```ts
type CleanBrief = {
  project: {
    title: string;
    format: "vertical_9_16";
    durationSec: number;
    language: "vi" | "en";
    style: string;
  };
  sourceDecisions: SourceDecision[];
  narration: {
    sourceScript: string;
    cleanedScript: string;
    needsRewrite: boolean;
  };
  knowledge: {
    keyClaims: KeyClaim[];
    entities: string[];
    mechanisms: string[];
    useCases: string[];
    caveats: string[];
  };
  visualReferences: VisualReference[];
  usableAssets: UsableAsset[];
  constraints: {
    mustShow: string[];
    avoid: string[];
    openQuestions: string[];
  };
};

type SourceDecision = {
  id: string;
  type: "url" | "github_repo" | "pdf" | "local_file" | "image" | "script" | "text";
  location: string;
  usage: "content_truth" | "style_reference" | "embed_asset" | "context_only" | "ignore";
  confidence: "high" | "medium" | "low";
  reason: string;
};

type KeyClaim = {
  claim: string;
  sourceIds: string[];
  confidence: "high" | "medium" | "low";
};

type VisualReference = {
  sourceId: string;
  type: "image" | "repo_template" | "website" | "video_frame";
  analysis: {
    mood: string;
    palette: string[];
    composition: string;
    shapeLanguage: string;
    textTreatment: string;
    motionIdeas: string[];
  };
  usage: "style_reference_only";
  doNotCopy: string[];
};

type UsableAsset = {
  id: string;
  sourceId: string;
  type: "image" | "video" | "audio" | "svg";
  path: string;
  usage: "embed_in_video";
  sceneHints: string[];
  safeToUse: boolean;
  reason: string;
};
```
