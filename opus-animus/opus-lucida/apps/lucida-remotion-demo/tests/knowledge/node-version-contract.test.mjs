import assert from "node:assert/strict";
import test from "node:test";

import {
  NODE_VERSION_RANGE,
  assertSupportedNodeVersion,
  isSupportedNodeVersion,
  parseNodeVersion,
} from "../../scripts/check-node-version.mjs";

test("publishes the Node version range used by the runtime check", () => {
  assert.equal(NODE_VERSION_RANGE, ">=24.14 <25");
});

test("accepts Node 24.14.0 and the Node 24.15.x boundary", () => {
  const supportedVersions = ["24.14.0", "24.15.0", "24.15.99", "v24.15.7"];

  for (const version of supportedVersions) {
    assert.equal(isSupportedNodeVersion(version), true, version);
    assert.doesNotThrow(() => assertSupportedNodeVersion(version), version);
  }
});

test("rejects versions below the lower boundary, at Node 25, and in Node 23", () => {
  const unsupportedVersions = ["24.13.99", "25.0.0", "23.99.99"];

  for (const version of unsupportedVersions) {
    assert.equal(isSupportedNodeVersion(version), false, version);
    assert.throws(() => assertSupportedNodeVersion(version), /requires Node/);
  }
});

test("rejects malformed version input through the public contract", () => {
  const malformedVersions = [
    "",
    "24.14",
    "24.14.0.1",
    "node-v24.14.0",
    "24.14.0+build.1",
    null,
    undefined,
    24.14,
  ];

  for (const version of malformedVersions) {
    assert.equal(parseNodeVersion(version), null, String(version));
    assert.equal(isSupportedNodeVersion(version), false, String(version));
    assert.throws(() => assertSupportedNodeVersion(version), /requires Node/);
  }
});

test("rejects prerelease versions because the implementation requires an exact triple", () => {
  const prereleaseVersions = [
    "24.14.0-rc.1",
    "24.15.0-beta.1",
    "v24.15.0-rc.1",
  ];

  for (const version of prereleaseVersions) {
    assert.equal(parseNodeVersion(version), null, version);
    assert.equal(isSupportedNodeVersion(version), false, version);
    assert.throws(() => assertSupportedNodeVersion(version), /requires Node/);
  }
});
