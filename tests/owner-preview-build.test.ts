import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const { assertOwnerPreviewConfig, assertOwnerPreviewArtifact, FLOES_SANDBOX_PROJECT_ID, FLOES_OWNER_PREVIEW_BRANCH } = await import(
  pathToFileURL(path.resolve("scripts/owner-preview-build-check.mjs")).href
);

const candidateEnv = () => ({
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: FLOES_OWNER_PREVIEW_BRANCH,
  VITE_OWNER_UID: "synthetic-owner-uid-for-test",
  FLOES_OWNER_UID: "synthetic-owner-uid-for-test",
  VITE_FIREBASE_PROJECT_ID: FLOES_SANDBOX_PROJECT_ID,
  FIREBASE_PROJECT_ID: FLOES_SANDBOX_PROJECT_ID,
});

test("candidate Preview requires matching exact client/server UIDs and sandbox project", () => {
  assert.equal(assertOwnerPreviewConfig(candidateEnv()), true);
  const bundle = `const owner=\`synthetic-owner-uid-for-test\`;const project=\`${FLOES_SANDBOX_PROJECT_ID}\`;`;
  assert.equal(assertOwnerPreviewArtifact(candidateEnv(), bundle), true);
});

test("candidate Preview rejects client/backend UID differences and whitespace", () => {
  const mismatched = candidateEnv();
  mismatched.FLOES_OWNER_UID = "another-synthetic-owner";
  assert.throws(() => assertOwnerPreviewConfig(mismatched), /frontend and backend Owner UIDs differ/);

  const padded = candidateEnv();
  padded.VITE_OWNER_UID = " synthetic-owner-uid-for-test";
  assert.throws(() => assertOwnerPreviewConfig(padded), /whitespace-free/);
});

test("candidate Preview rejects non-sandbox server or client project IDs", () => {
  const mismatched = candidateEnv();
  mismatched.FIREBASE_PROJECT_ID = "another-project";
  assert.throws(() => assertOwnerPreviewConfig(mismatched), /must use the sandbox project/);
});

test("candidate Preview rejects a stale or padded compiled UID literal", () => {
  const env = candidateEnv();
  assert.throws(() => assertOwnerPreviewArtifact(env, `const owner=\`old-synthetic-owner\`;`), /compiled bundle/);
  assert.throws(() => assertOwnerPreviewArtifact(env, `const owner=\`synthetic-owner-uid-for-test \`;`), /compiled bundle/);
});

test("other Vercel targets do not inherit the candidate Preview guard", () => {
  const production = candidateEnv();
  production.VERCEL_ENV = "production";
  production.VITE_OWNER_UID = "";
  production.FLOES_OWNER_UID = "";
  assert.equal(assertOwnerPreviewConfig(production), false);
});
