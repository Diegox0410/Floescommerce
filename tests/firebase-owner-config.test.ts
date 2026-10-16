import assert from "node:assert/strict";
import test from "node:test";
import { OwnerAuthError, requireFloesOwner } from "../api/_lib/firebaseAuth.ts";

const withOwnerEnvironment = async (projectId: string, ownerUid: string, action: () => Promise<void>) => {
  const previousProject = process.env.FIREBASE_PROJECT_ID;
  const previousUid = process.env.FLOES_OWNER_UID;
  process.env.FIREBASE_PROJECT_ID = projectId;
  process.env.FLOES_OWNER_UID = ownerUid;
  try { await action(); }
  finally {
    if (previousProject === undefined) delete process.env.FIREBASE_PROJECT_ID;
    else process.env.FIREBASE_PROJECT_ID = previousProject;
    if (previousUid === undefined) delete process.env.FLOES_OWNER_UID;
    else process.env.FLOES_OWNER_UID = previousUid;
  }
};

test("server rejects whitespace-padded Owner authorization configuration", async () => {
  await withOwnerEnvironment("floes-commercial-sandbox-2026", "owner-uid ", async () => {
    await assert.rejects(
      () => requireFloesOwner({ headers: {} }),
      (error: unknown) => error instanceof OwnerAuthError && error.code === "FLOES_OWNER_CONFIG",
    );
  });
});

test("server checks the token only after exact Owner and Firebase project config exists", async () => {
  await withOwnerEnvironment("floes-commercial-sandbox-2026", "owner-uid", async () => {
    await assert.rejects(
      () => requireFloesOwner({ headers: {} }),
      (error: unknown) => error instanceof OwnerAuthError && error.code === "FLOES_OWNER_TOKEN_INVALID",
    );
  });
});
