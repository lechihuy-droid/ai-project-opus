import { loadFont } from "@remotion/google-fonts/NotoSansJP";

export const { fontFamily: mechanismFontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["japanese", "latin", "vietnamese"],
  ignoreTooManyRequestsWarning: true,
});
