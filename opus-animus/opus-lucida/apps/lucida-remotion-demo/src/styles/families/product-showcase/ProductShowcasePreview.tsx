import { ProductShowcaseScene } from "./ProductShowcaseScene";
import type { ProductShowcaseFixtureKey } from "./types";

export const PRODUCT_SHOWCASE_COMPOSITION_ID = "ProductShowcaseFamilyReview";

export type ProductShowcasePreviewProps = {
  sceneKey: ProductShowcaseFixtureKey;
};

export const ProductShowcasePreview = ({
  sceneKey,
}: ProductShowcasePreviewProps) => {
  return <ProductShowcaseScene sceneKey={sceneKey} />;
};
