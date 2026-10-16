export const FLOES_OWNER_PREVIEW_BRANCH = "codex/preview-final-floes";
export const FLOES_SANDBOX_PROJECT_ID = "floes-commercial-sandbox-2026";

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
  if (env.VITE_FIREBASE_PROJECT_ID !== FLOES_SANDBOX_PROJECT_ID
    || env.FIREBASE_PROJECT_ID !== FLOES_SANDBOX_PROJECT_ID) {
    throw new Error("FLOES Owner Preview build rejected: Firebase client and server must use the sandbox project.");
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
  if (!hasExactStringLiteral(bundleSource, FLOES_SANDBOX_PROJECT_ID)) {
    throw new Error("FLOES Owner Preview build rejected: the compiled bundle does not contain the sandbox project ID exactly.");
  }
  return true;
}
