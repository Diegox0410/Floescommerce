export const FLOES_OWNER_PREVIEW_BRANCH = "codex/preview-final-floes";
export const FLOES_SANDBOX_PROJECT_ID = "floes-commercial-sandbox-2026";
export const FLOES_SANDBOX_OWNER_UID = "49rU4c2DiMdyT5RQfCWHdNq30yZ2";
export const FLOES_SANDBOX_AUTH_DOMAIN = `${FLOES_SANDBOX_PROJECT_ID}.firebaseapp.com`;

const firebaseClientFields = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];
const legacyFirebaseHosts = ["floes-commerce.firebaseapp.com", "floes-commerce.appspot.com"];

export function assertOwnerPreviewConfig(env) {
  const isCandidatePreview = env.VERCEL_ENV === "preview"
    && env.VERCEL_GIT_COMMIT_REF === FLOES_OWNER_PREVIEW_BRANCH;
  if (!isCandidatePreview) return false;

  const clientUid = env.VITE_OWNER_UID;
  const serverUid = env.FLOES_OWNER_UID;
  if (!clientUid || !serverUid || clientUid !== clientUid.trim() || serverUid !== serverUid.trim()) {
    throw new Error("FLOES Owner Preview build requires exact, whitespace-free client and server UIDs.");
  }
  if (clientUid !== serverUid) {
    throw new Error("FLOES Owner Preview build rejected: frontend and backend Owner UIDs differ.");
  }
  if (clientUid !== FLOES_SANDBOX_OWNER_UID) {
    throw new Error("FLOES Owner Preview build rejected: Owner UID is not the authorized sandbox identity.");
  }
  if (env.VITE_FIREBASE_PROJECT_ID !== FLOES_SANDBOX_PROJECT_ID
    || env.FIREBASE_PROJECT_ID !== FLOES_SANDBOX_PROJECT_ID) {
    throw new Error("FLOES Owner Preview build rejected: Firebase client and server must use the sandbox project.");
  }
  const missingClientFields = firebaseClientFields.filter((name) => {
    const value = env[name];
    return !value || value !== value.trim();
  });
  if (missingClientFields.length) {
    throw new Error("FLOES Owner Preview build rejected: Firebase Web SDK fields are missing or padded.");
  }
  if (env.VITE_FIREBASE_AUTH_DOMAIN !== FLOES_SANDBOX_AUTH_DOMAIN) {
    throw new Error("FLOES Owner Preview build rejected: Firebase Auth domain is not the sandbox domain.");
  }
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET;
  if (storageBucket !== `${FLOES_SANDBOX_PROJECT_ID}.firebasestorage.app`
    && storageBucket !== `${FLOES_SANDBOX_PROJECT_ID}.appspot.com`) {
    throw new Error("FLOES Owner Preview build rejected: Firebase Storage bucket is not the sandbox bucket.");
  }
  const appIdProjectNumber = /^1:(\d+):web:[A-Za-z0-9_-]+$/.exec(env.VITE_FIREBASE_APP_ID)?.[1];
  if (!appIdProjectNumber || env.VITE_FIREBASE_MESSAGING_SENDER_ID !== appIdProjectNumber) {
    throw new Error("FLOES Owner Preview build rejected: Firebase sender ID and web app ID do not match.");
  }
  if (legacyFirebaseHosts.some((host) => firebaseClientFields.some((name) => env[name].includes(host)))) {
    throw new Error("FLOES Owner Preview build rejected: Firebase Web SDK contains a legacy Production project host.");
  }
  return true;
}

const hasExactStringLiteral = (source, value) =>
  [JSON.stringify(value), `\`${value}\``, `'${value}'`].some((literal) => source.includes(literal));

export function assertOwnerPreviewArtifact(env, bundleSource) {
  if (!assertOwnerPreviewConfig(env)) return false;
  if (!hasExactStringLiteral(bundleSource, env.VITE_OWNER_UID)) {
    throw new Error("FLOES Owner Preview build rejected: the compiled bundle does not contain the configured Owner UID exactly.");
  }
  for (const name of firebaseClientFields) {
    if (!hasExactStringLiteral(bundleSource, env[name])) {
      throw new Error("FLOES Owner Preview build rejected: the compiled Firebase Web SDK config does not match its Preview variables.");
    }
  }
  if (legacyFirebaseHosts.some((host) => bundleSource.includes(host))) {
    throw new Error("FLOES Owner Preview build rejected: the compiled bundle contains a legacy Firebase project host.");
  }
  return true;
}
