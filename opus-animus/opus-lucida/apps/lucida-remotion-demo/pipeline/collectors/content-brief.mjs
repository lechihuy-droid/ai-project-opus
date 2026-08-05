import { CONTENT_BRIEF_COLLECTOR_VERSION, readContentBriefFile } from "../contracts/content-brief-contracts.mjs";
import { makeProvenance } from "./shared.mjs";

const VERSION = CONTENT_BRIEF_COLLECTOR_VERSION;

export const collectContentBrief = ({ source, projectRoot, runEnvelope }) => {
  if (!source.path) throw new Error(`ContentBrief source ${source.id} requires a local path`);
  const { brief, relativePath, rawChecksum } = readContentBriefFile({ projectRoot, filePath: source.path, runEnvelope });
  return {
    sourceId: source.id,
    sourceType: source.type,
    collectorVersion: VERSION,
    checksum: rawChecksum,
    contentBriefPath: relativePath,
    contentBrief: brief,
    records: brief.beats.map((beat, index) => ({
      kind: "content_brief_beat",
      index,
      beatId: beat.id,
      title: beat.title,
      body: beat.body,
      intent: beat.intent ?? brief.intent,
      role: beat.role,
      actors: beat.actors,
      factRefs: beat.factRefs,
      data: {
        contentBriefTitle: brief.title,
        audience: brief.audience,
        factualSourceIds: brief.factualSourceIds,
        visualConstraints: brief.visualConstraints,
        styleMode: brief.styleMode,
      },
      provenance: makeProvenance({
        source,
        sourceRef: `${relativePath}#beat-${encodeURIComponent(beat.id)}`,
        checksum: rawChecksum,
        version: VERSION,
      }),
    })),
  };
};
