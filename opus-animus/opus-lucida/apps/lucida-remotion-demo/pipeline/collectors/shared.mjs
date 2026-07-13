import crypto from "node:crypto";
import path from "node:path";

export const sha256 = (value) =>
  `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;

export const resolveInside = (root, candidate) => {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, candidate);
  const relative = path.relative(resolvedRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path escapes approved root: ${candidate}`);
  }
  return resolved;
};

export const makeProvenance = ({ source, sourceRef, checksum, version }) => ({
  sourceId: source.id,
  sourceRef,
  sourceChecksum: checksum,
  collectorVersion: version,
});

export const assertHttpUrl = (value, label = "url") => {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${label} must be an http(s) URL: ${value}`);
  }
  return url.toString();
};

export const fetchText = async (url, { maxBytes = 512000 } = {}) => {
  const target = assertHttpUrl(url);
  const response = await fetch(target, {
    headers: {
      "user-agent": "lucida-visual-input-pipeline/1.0",
      accept: "text/html,text/plain,application/json,*/*;q=0.8",
    },
  });
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${target}`);
  }
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    return text.slice(0, maxBytes);
  }
  return text;
};

export const fetchHead = async (url) => {
  const target = assertHttpUrl(url);
  const response = await fetch(target, {
    method: "HEAD",
    headers: { "user-agent": "lucida-visual-input-pipeline/1.0" },
  });
  if (!response.ok) throw new Error(`HEAD failed ${response.status} for ${target}`);
  return {
    contentType: response.headers.get("content-type") ?? "",
    contentLength: response.headers.get("content-length") ?? "",
    lastModified: response.headers.get("last-modified") ?? "",
  };
};

export const stripHtml = (html) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export const extractHtmlMeta = (html) => {
  const pick = (pattern) => pattern.exec(html)?.[1]?.trim();
  const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
    pick(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) ??
    pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const headings = [...html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map((match) => stripHtml(match[2]))
    .filter(Boolean)
    .slice(0, 8);
  const codeSnippets = [...html.matchAll(/<code[^>]*>([\s\S]*?)<\/code>/gi)]
    .map((match) => stripHtml(match[1]))
    .filter((text) => text.length > 8)
    .slice(0, 6);
  return { title, description, headings, codeSnippets };
};

export const compactText = (value, maxLength = 800) => {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3)}...` : clean;
};
