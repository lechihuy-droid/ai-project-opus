import {
  assertHttpUrl,
  compactText,
  fetchText,
  makeProvenance,
  resolveInside,
  sha256,
} from "./shared.mjs";
import fs from "node:fs";
import path from "node:path";

const VERSION = "repository-collector/1";

const parseGithubRepo = (url) => {
  const parsed = new URL(assertHttpUrl(url, "repository url"));
  if (parsed.hostname !== "github.com") return null;
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
};

const githubJson = async (url) =>
  JSON.parse(
    await fetchText(url, {
      maxBytes: 1024 * 1024,
    }),
  );

const decodeBase64 = (value) => Buffer.from(value, "base64").toString("utf8");

const readGithubFile = async ({ owner, repo, filePath }) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath).replaceAll("%2F", "/")}`;
  const payload = await githubJson(url);
  if (!payload.content) return null;
  return {
    path: filePath,
    htmlUrl: payload.html_url,
    text: decodeBase64(payload.content),
  };
};

const defaultIncludes = [
  "README.md",
  "package.json",
  "src/index.css",
  "src/styles.css",
  "style.css",
  "styles.css",
  "terminal.css",
  "README.rst",
];

const summarizeFile = (file) => {
  if (/package\.json$/i.test(file.path)) {
    try {
      const pkg = JSON.parse(file.text);
      const deps = Object.keys({
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
      }).slice(0, 12);
      return compactText(
        `${pkg.name ?? file.path}: ${pkg.description ?? "package manifest"}${deps.length ? ` | deps: ${deps.join(", ")}` : ""}`,
        900,
      );
    } catch {
      return compactText(file.text, 900);
    }
  }
  if (/\.css$/i.test(file.path)) {
    const tokens = [...file.text.matchAll(/--[a-z0-9-]+\s*:\s*[^;]+/gi)]
      .map((match) => match[0])
      .slice(0, 18);
    return compactText(
      tokens.length
        ? `${file.path} tokens: ${tokens.join("; ")}`
        : `${file.path}: ${file.text}`,
      900,
    );
  }
  return compactText(file.text.replace(/^#+\s*/gm, ""), 900);
};

export const collectRepository = async ({ source, projectRoot }) => {
  if (source.path) {
    return collectLocalRepository({ source, projectRoot });
  }
  if (!source.url) {
    throw new Error(`Repository source ${source.id} requires url or path`);
  }
  const repo = parseGithubRepo(source.url);
  if (!repo) {
    throw new Error(`Repository collector currently supports GitHub URLs only`);
  }

  const repoMeta = await githubJson(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}`,
  );
  const includes = source.include?.length ? source.include : defaultIncludes;
  const files = [];
  for (const filePath of includes.slice(0, source.maxFiles ?? 8)) {
    try {
      const file = await readGithubFile({ ...repo, filePath });
      if (file) files.push(file);
    } catch {
      // Optional paths differ between repos; missing files are not fatal.
    }
  }

  const raw = JSON.stringify(
    {
      repository: source.url,
      description: repoMeta.description,
      topics: repoMeta.topics,
      files: files.map((file) => ({ path: file.path, text: file.text })),
    },
    null,
    2,
  );
  const checksum = sha256(raw);
  const sourceRef = repoMeta.html_url ?? source.url;
  const records = [
    {
      kind: "repository_summary",
      index: 0,
      text: compactText(
        `${repoMeta.full_name}: ${repoMeta.description ?? "visual reference repository"}${repoMeta.topics?.length ? ` | topics: ${repoMeta.topics.join(", ")}` : ""}`,
        900,
      ),
      data: {
        url: repoMeta.html_url,
        stars: repoMeta.stargazers_count,
        forks: repoMeta.forks_count,
        language: repoMeta.language,
        topics: repoMeta.topics ?? [],
        visualFamily: source.family,
        tags: source.tags ?? [],
      },
      provenance: makeProvenance({
        source,
        sourceRef,
        checksum,
        version: VERSION,
      }),
    },
    ...files.map((file, index) => ({
      kind: /\.css$/i.test(file.path) ? "design_token" : "code",
      index: index + 1,
      text: summarizeFile(file),
      data: {
        path: file.path,
        url: file.htmlUrl,
        visualFamily: source.family,
        tags: source.tags ?? [],
      },
      provenance: makeProvenance({
        source,
        sourceRef: file.htmlUrl ?? `${sourceRef}/${file.path}`,
        checksum: sha256(file.text),
        version: VERSION,
      }),
    })),
  ];

  return {
    sourceId: source.id,
    sourceType: source.type,
    collectorVersion: VERSION,
    checksum,
    metadata: {
      owner: repo.owner,
      repo: repo.repo,
      url: repoMeta.html_url,
      fileCount: files.length,
    },
    records,
  };
};

const collectLocalRepository = ({ source, projectRoot = process.cwd() }) => {
  const repoRoot = resolveInside(projectRoot, source.path);
  const includes = source.include?.length ? source.include : defaultIncludes;
  const files = [];
  for (const filePath of includes.slice(0, source.maxFiles ?? 8)) {
    const absolute = path.resolve(repoRoot, filePath);
    const relative = path.relative(repoRoot, absolute);
    if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
    if (!fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) continue;
    files.push({
      path: filePath,
      htmlUrl: `${source.path.replaceAll("\\", "/")}/${filePath}`,
      text: fs.readFileSync(absolute, "utf8"),
    });
  }
  const raw = JSON.stringify({ repository: source.path, files }, null, 2);
  const checksum = sha256(raw);
  const sourceRef = source.path.replaceAll("\\", "/");
  return {
    sourceId: source.id,
    sourceType: source.type,
    collectorVersion: VERSION,
    checksum,
    metadata: {
      owner: "local",
      repo: path.basename(repoRoot),
      url: sourceRef,
      fileCount: files.length,
    },
    records: [
      {
        kind: "repository_summary",
        index: 0,
        text: compactText(`${path.basename(repoRoot)}: local visual reference repository`, 900),
        data: { url: sourceRef, visualFamily: source.family, tags: source.tags ?? [] },
        provenance: makeProvenance({
          source,
          sourceRef,
          checksum,
          version: VERSION,
        }),
      },
      ...files.map((file, index) => ({
        kind: /\.css$/i.test(file.path) ? "design_token" : "code",
        index: index + 1,
        text: summarizeFile(file),
        data: {
          path: file.path,
          url: file.htmlUrl,
          visualFamily: source.family,
          tags: source.tags ?? [],
        },
        provenance: makeProvenance({
          source,
          sourceRef: file.htmlUrl,
          checksum: sha256(file.text),
          version: VERSION,
        }),
      })),
    ],
  };
};
