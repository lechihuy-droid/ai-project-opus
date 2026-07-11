import { registerRoot } from "remotion";
import { loadFont } from "@remotion/google-fonts/BeVietnamPro";
import { RemotionRoot } from "./Root";

loadFont("normal", {
  weights: ["400", "500", "600", "700", "800", "900"],
  subsets: ["vietnamese", "latin", "latin-ext"],
});

registerRoot(RemotionRoot);
