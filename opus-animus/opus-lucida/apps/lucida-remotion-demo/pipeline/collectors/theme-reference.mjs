import fs from "node:fs";
import path from "node:path";
import {
  compactText,
  fetchText,
  makeProvenance,
  resolveInside,
  sha256,
} from "./shared.mjs";

const VERSION = "theme-reference-collector/1";

const readTheme = async ({ source, projectRoot }) => {
  if (source.url) return { ref: source.url, text: await fetchText(source.url) };
  if (!source.path) throw new Error(`Theme reference ${source.id} requires url or path`);
  const filePath = resolveInside(projectRoot, source.path);
  return {
    ref: path.relative(projectRoot, filePath).replaceAll("\\", "/"),
    text: fs.readFileSync(filePath, "utf8"),
  };
};

const cssTokens = (text) =>
  [...text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}{]+)/gi)]
    .map((match) => ({ name: match[1], value: match[2].trim() }))
    .slice(0, 80);

const hexColors = (text) =>
  [...new Set([...text.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((match) => match[0]))]
    .slice(0, 40);

export const collectThemeReference = async ({ source, projectRoot }) => {
  const theme = await readTheme({ source, projectRoot });
  const checksum = sha256(theme.text);
  const tokens = cssTokens(theme.text);
  const colors = hexColors(theme.text);
  const records = [
    {
      kind: "design_token",
      index: 0,
      text: compactText(
        [
          source.name ?? source.id,
          tokens.length ? `tokens: ${tokens.map((token) => `${token.name}=${token.value}`).join("; ")}` : "",
          colors.length ? `colors: ${colors.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
        1100,
      ),
      data: {
        ref: theme.ref,
        tokens,
        colors,
        family: source.family,
        tags: source.tags ?? [],
      },
      provenance: makeProvenance({
        source,
        sourceRef: theme.ref,
        checksum,
        version: VERSION,
      }),
    },
  ];

  return {
    sourceId: source.id,
    sourceType: source.type,
    collectorVersion: VERSION,
    checksum,
    metadata: {
      ref: theme.ref,
      tokenCount: tokens.length,
      colorCount: colors.length,
    },
    records,
  };
};
