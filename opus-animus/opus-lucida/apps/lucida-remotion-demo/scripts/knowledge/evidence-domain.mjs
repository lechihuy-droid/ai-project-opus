export const EVIDENCE_DOMAINS = Object.freeze(["factual", "visual-style"]);

export const isEvidenceDomain = (value) => EVIDENCE_DOMAINS.includes(value);

export const assertEvidenceDomain = (value, label = "evidence domain") => {
  if (!isEvidenceDomain(value)) {
    throw new Error(`${label} must be exactly one of: ${EVIDENCE_DOMAINS.join(", ")}.`);
  }
  return value;
};

export const domainCounts = (records, label = "records") => {
  const counts = Object.fromEntries(EVIDENCE_DOMAINS.map((domain) => [domain, 0]));
  for (const record of records) counts[assertEvidenceDomain(record?.domain, `${label} domain`)] += 1;
  return counts;
};
