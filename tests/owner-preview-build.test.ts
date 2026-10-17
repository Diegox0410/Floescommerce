import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const { assertOwnerPreviewConfig, assertOwnerPreviewArtifact, FLOES_SANDBOX_PROJECT_ID, FLOES_SANDBOX_OWNER_UID, FLOES_SANDBOX_AUTH_DOMAIN, FLOES_OWNER_PREVIEW_BRANCH } = await import(
  pathToFileURL(path.resolve("scripts/owner-preview-build-check.mjs")).href
);

const candidateEnv = () => ({
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: FLOES_OWNER_PREVIEW_BRANCH,
  VITE_OWNER_UID: FLOES_SANDBOX_OWNER_UID,
  FLOES_OWNER_UID: FLOES_SANDBOX_OWNER_UID,
  VITE_FIREBASE_API_KEY: "synthetic-firebase-api-key",
  VITE_FIREBASE_AUTH_DOMAIN: FLOES_SANDBOX_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: FLOES_SANDBOX_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: `${FLOES_SANDBOX_PROJECT_ID}.firebasestorage.app`,
  VITE_FIREBASE_MESSAGING_SENDER_ID: "100000000001",
  VITE_FIREBASE_APP_ID: "1:100000000001:web:synthetic-app-id",
  FIREBASE_PROJECT_ID: FLOES_SANDBOX_PROJECT_ID,
});

test("candidate Preview requires matching exact client/server UIDs and sandbox project", () => {
  assert.equal(assertOwnerPreviewConfig(candidateEnv()), true);
  const env = candidateEnv();
  const bundle = Object.values(env).map((value) => JSON.stringify(value)).join(";");
  assert.equal(assertOwnerPreviewArtifact(env, bundle), true);
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

test("candidate Preview rejects a Firebase Auth domain inherited from another project", () => {
  const mismatched = candidateEnv();
  mismatched.VITE_FIREBASE_AUTH_DOMAIN = "floes-commerce.firebaseapp.com";
  assert.throws(() => assertOwnerPreviewConfig(mismatched), /Auth domain is not the sandbox domain/);
});

test("candidate Preview requires all six Firebase Web SDK values", () => {
  const incomplete = candidateEnv();
  delete incomplete.VITE_FIREBASE_MESSAGING_SENDER_ID;
  assert.throws(() => assertOwnerPreviewConfig(incomplete), /Web SDK fields are missing or padded/);
});

test("candidate Preview rejects a Storage bucket from another Firebase project", () => {
  const mismatched = candidateEnv();
  mismatched.VITE_FIREBASE_STORAGE_BUCKET = "floes-commerce.appspot.com";
  assert.throws(() => assertOwnerPreviewConfig(mismatched), /Storage bucket is not the sandbox bucket/);
});

test("candidate Preview rejects a sender ID that does not match the Firebase web app ID", () => {
  const mismatched = candidateEnv();
  mismatched.VITE_FIREBASE_MESSAGING_SENDER_ID = "999999999999";
  assert.throws(() => assertOwnerPreviewConfig(mismatched), /sender ID and web app ID do not match/);
});

test("candidate Preview requires the exact authorized Owner UID", () => {
  const mismatched = candidateEnv();
  mismatched.VITE_OWNER_UID = "another-synthetic-owner";
  mismatched.FLOES_OWNER_UID = "another-synthetic-owner";
  assert.throws(() => assertOwnerPreviewConfig(mismatched), /not the authorized sandbox identity/);
});

test("candidate Preview artifact rejects any legacy Firebase host", () => {
  const env = candidateEnv();
  assert.throws(
    () => assertOwnerPreviewArtifact(env, `${Object.values(env).map((value) => JSON.stringify(value)).join(";")};floes-commerce.firebaseapp.com`),
    /legacy Firebase project host/,
  );
});

test("candidate Preview rejects a stale or padded compiled UID literal", () => {
  const env = candidateEnv();
  assert.throws(() => assertOwnerPreviewArtifact(env, `const owner=\`old-synthetic-owner\`;`), /compiled bundle/);
  assert.throws(() => assertOwnerPreviewArtifact(env, `const owner=\`${FLOES_SANDBOX_OWNER_UID} \`;`), /compiled bundle/);
});

test("other Vercel targets do not inherit the candidate Preview guard", () => {
  const production = candidateEnv();
  production.VERCEL_ENV = "production";
  production.VITE_OWNER_UID = "";
  production.FLOES_OWNER_UID = "";
  assert.equal(assertOwnerPreviewConfig(production), false);
});
