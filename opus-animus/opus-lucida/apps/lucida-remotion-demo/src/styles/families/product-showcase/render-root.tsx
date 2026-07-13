import { Composition } from "remotion";
import { productShowcaseFixtures } from "../../../../pipeline/fixtures/styles/product-showcase";
import {
  PRODUCT_SHOWCASE_COMPOSITION_ID,
  ProductShowcasePreview,
  type ProductShowcasePreviewProps,
} from "./ProductShowcasePreview";

const calculateMetadata = ({
  props,
}: {
  props: ProductShowcasePreviewProps;
}) => ({
  durationInFrames: productShowcaseFixtures[props.sceneKey].durationInFrames,
  fps: 30,
  width: 1080,
  height: 1920,
});

export const ProductShowcaseRemotionRoot = () => {
  return (
    <Composition
      id={PRODUCT_SHOWCASE_COMPOSITION_ID}
      component={ProductShowcasePreview}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={productShowcaseFixtures.normal.durationInFrames}
      defaultProps={{ sceneKey: "normal" }}
      calculateMetadata={calculateMetadata}
    />
  );
};
