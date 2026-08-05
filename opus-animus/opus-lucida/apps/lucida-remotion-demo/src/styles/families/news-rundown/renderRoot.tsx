import { Composition, registerRoot } from "remotion";
import { newsRundownFixtures } from "../../../../pipeline/fixtures/styles/news-rundown";
import { NEWS_RUNDOWN_COMPOSITION_ID, NewsRundownPreview, type NewsRundownPreviewProps } from "./NewsRundownPreview";

const calculateMetadata = ({ props }: { props: NewsRundownPreviewProps }) => ({ width: 1080, height: 1920, fps: 30, durationInFrames: newsRundownFixtures[props.sceneKey].motionPolicy === "static" ? 60 : 90 });
const NewsRundownRemotionRoot = () => <Composition id={NEWS_RUNDOWN_COMPOSITION_ID} component={NewsRundownPreview} width={1080} height={1920} fps={30} durationInFrames={90} defaultProps={{ sceneKey: "breaking-update" }} calculateMetadata={calculateMetadata} />;
registerRoot(NewsRundownRemotionRoot);
