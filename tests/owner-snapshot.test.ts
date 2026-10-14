import assert from "node:assert/strict";
import test from "node:test";
import { isCanonicalOwnerSnapshot } from "../src/admin/components/chopifySnapshot.ts";

test("Owner download rejects catalog projections and accepts canonical tenant snapshot with inventory", () => {
  const snapshot = { schemaVersion: 2, canonical: true, tenantId: "tenant-floes", capturedAt: "2026-10-13T03:46:40.065Z", stateVersion: "revision-1", products: [{ id: "daniela", tenantId: "tenant-floes", variants: [] }], inventory: [], paymentConfiguration: null };
  assert.equal(isCanonicalOwnerSnapshot(snapshot), true);
  assert.equal(isCanonicalOwnerSnapshot({ ...snapshot, canonical: undefined }), false);
  assert.equal(isCanonicalOwnerSnapshot({ ...snapshot, inventory: undefined }), false);
  assert.equal(isCanonicalOwnerSnapshot({ ...snapshot, products: [{ id: "other", tenantId: "tenant-mg", variants: [] }] }), false);
  assert.equal(isCanonicalOwnerSnapshot({ schemaVersion: 1, products: [] }), false);
});
