const SECRET_PATTERNS = [
  {
    name: "private-key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  },
  {
    name: "authorization",
    pattern: /authorization\s*:\s*(?:bearer|basic)\s+[A-Za-z0-9._~+/=-]{8,}/i,
  },
  {
    name: "credential-assignment",
    pattern:
      /(?:api[_-]?key|access[_-]?token|auth[_-]?token|password|secret)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{8,}/i,
  },
  { name: "github-token", pattern: /gh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: "openai-key", pattern: /sk-[A-Za-z0-9_-]{20,}/ },
];

const redactPaths = (value) =>
  value
    .replace(/\b[A-Za-z]:\\Users\\[^\\\s]+/gi, "%USERPROFILE%")
    .replace(/\/home\/[^/\s]+/g, "$HOME");

const visitStrings = (value, visit, path = "$") => {
  if (typeof value === "string") return visit(value, path);
  if (Array.isArray(value))
    return value.map((item, index) =>
      visitStrings(item, visit, `${path}[${index}]`),
    );
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        visitStrings(item, visit, `${path}.${key}`),
      ]),
    );
  }
  return value;
};

export const sanitizeRawInput = (raw) => {
  if (raw.schemaVersion !== "raw-visual-input/v1") {
    throw new Error(`Unsupported raw input schema: ${raw.schemaVersion}`);
  }

  const findings = [];
  const sanitized = visitStrings(raw, (value, jsonPath) => {
    for (const secret of SECRET_PATTERNS) {
      if (secret.pattern.test(value)) {
        findings.push({ severity: "error", type: secret.name, path: jsonPath });
      }
    }
    return redactPaths(value).replaceAll("\u0000", "");
  });

  if (findings.length > 0) {
    const error = new Error(
      `Sensitive content detected in ${findings.length} location(s)`,
    );
    error.findings = findings;
    throw error;
  }

  return {
    ...sanitized,
    schemaVersion: "sanitized-visual-input/v1",
    sanitizedAt: new Date().toISOString(),
    sanitization: { status: "passed", redactions: 0, findings: [] },
  };
};
