import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const mechanismRoot = path.join(root, "src/mechanism");
const tokenSource = fs.readFileSync(
  path.join(mechanismRoot, "tokens.ts"),
  "utf8",
);
const minimumMatch = tokenSource.match(/MIN_FONT_SIZE\s*=\s*(\d+)/u);
assert.ok(minimumMatch, "MIN_FONT_SIZE must be declared as a number");
const minimum = Number(minimumMatch[1]);

test("mechanism minimum font size is at least 32px", () => {
  assert.ok(minimum >= 32, `MIN_FONT_SIZE is ${minimum}`);
  assert.match(tokenSource, /champagneGold\s*=\s*"#D2B47A"/u);
});

test("every mechanism fontSize meets MIN_FONT_SIZE unless explicitly whitelisted", () => {
  const files = fs
    .readdirSync(mechanismRoot)
    .filter((file) => /\.tsx?$/u.test(file));
  const violations = [];
  let whitelistUseCount = 0;

  for (const file of files) {
    const source = fs.readFileSync(path.join(mechanismRoot, file), "utf8");
    for (const match of source.matchAll(/fontSize\s*:\s*([^,\n}]+)/gu)) {
      const expression = match[1].trim();
      if (/^\d+$/u.test(expression)) {
        const size = Number(expression);
        const isDeclaredWhitelist =
          file === "tokens.ts" &&
          size < minimum &&
          source
            .slice(Math.max(0, match.index - 120), match.index)
            .includes("diffAnnotation");
        if (size < minimum && !isDeclaredWhitelist) {
          violations.push(`${file}: ${size}px`);
        }
        continue;
      }
      if (expression === "FONT_SIZE_WHITELIST.diffAnnotation.fontSize") {
        whitelistUseCount += 1;
        continue;
      }
      violations.push(`${file}: unresolved ${expression}`);
    }
  }

  assert.match(
    tokenSource,
    /diffAnnotation:\s*\{\s*fontSize:\s*26,\s*reason:\s*"[^"]+"/u,
    "whitelisted annotation size must include a reason",
  );
  assert.equal(
    whitelistUseCount,
    1,
    "the annotation whitelist must have exactly one usage",
  );
  assert.deepEqual(violations, []);
});
