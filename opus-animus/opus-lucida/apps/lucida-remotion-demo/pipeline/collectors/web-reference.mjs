import {
  compactText,
  extractHtmlMeta,
  fetchText,
  makeProvenance,
  sha256,
  stripHtml,
} from "./shared.mjs";

const VERSION = "web-reference-collector/1";

export const collectWebReference = async ({ source }) => {
  const urls = source.urls?.length ? source.urls : source.url ? [source.url] : [];
  if (!urls.length) throw new Error(`Web reference ${source.id} requires url(s)`);

  const records = [];
  const pages = [];
  for (const [pageIndex, url] of urls.entries()) {
    const html = await fetchText(url, { maxBytes: source.maxBytes ?? 700000 });
    const checksum = sha256(html);
    const meta = extractHtmlMeta(html);
    const readable = stripHtml(html);
    pages.push({ url, title: meta.title, checksum });
    records.push({
      kind: "layout_reference",
      index: records.length,
      text: compactText(
        [
          meta.title,
          meta.description,
          meta.headings?.length ? `Headings: ${meta.headings.join(" | ")}` : "",
        ]
          .filter(Boolean)
          .join(" - "),
        1000,
      ),
      data: {
        url,
        title: meta.title,
        description: meta.description,
        headings: meta.headings,
        family: source.family,
        tags: source.tags ?? [],
      },
      provenance: makeProvenance({
        source,
        sourceRef: url,
        checksum,
        version: VERSION,
      }),
    });
    for (const [snippetIndex, snippet] of meta.codeSnippets.entries()) {
      records.push({
        kind: "code",
        index: records.length,
        text: compactText(snippet, 900),
        data: { url, snippetIndex, family: source.family },
        provenance: makeProvenance({
          source,
          sourceRef: `${url}#code-${snippetIndex + 1}`,
          checksum,
          version: VERSION,
        }),
      });
    }
    if (!meta.headings?.length && readable) {
      records.push({
        kind: "narrative",
        index: records.length,
        text: compactText(readable, 900),
        data: { url, pageIndex, family: source.family },
        provenance: makeProvenance({
          source,
          sourceRef: `${url}#text`,
          checksum,
          version: VERSION,
        }),
      });
    }
  }

  return {
    sourceId: source.id,
    sourceType: source.type,
    collectorVersion: VERSION,
    checksum: sha256(JSON.stringify(pages)),
    metadata: { pages },
    records,
  };
};
