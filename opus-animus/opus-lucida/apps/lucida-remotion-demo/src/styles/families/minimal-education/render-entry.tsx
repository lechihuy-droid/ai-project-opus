import { loadFont } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { registerRoot } from "remotion";
import { MinimalEducationRemotionRoot } from "./render-root";

loadFont("normal", {
  weights: ["400", "500", "600", "700", "800", "900"],
  subsets: ["vietnamese", "latin", "latin-ext"],
});

loadJetBrainsMono("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["vietnamese", "latin", "latin-ext"],
});

registerRoot(MinimalEducationRemotionRoot);
