import { Composition } from "remotion";
import { editorialCollageFixtures } from "../../../../pipeline/fixtures/styles/editorial-collage";
import {
  EDITORIAL_COLLAGE_COMPOSITION_ID,
  EditorialCollagePreview,
  type EditorialCollagePreviewProps,
} from "./EditorialCollagePreview";

const calculateMetadata = ({ props }: { props: EditorialCollagePreviewProps }) => ({
  durationInFrames: editorialCollageFixtures[props.sceneKey].durationInFrames,
  fps: 30,
  width: 1080,
  height: 1920,
});

export const EditorialCollageRemotionRoot = () => (
  <Composition
    id={EDITORIAL_COLLAGE_COMPOSITION_ID}
    component={EditorialCollagePreview}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={editorialCollageFixtures["source-montage"].durationInFrames}
    defaultProps={{ sceneKey: "source-montage" }}
    calculateMetadata={calculateMetadata}
  />
);
