/// <reference types="node" />

import { createVerify } from "node:crypto";

import { header, type ApiRequest } from "./http.js";

interface FirebaseClaims {
  aud?: unknown;
  exp?: unknown;
  iat?: unknown;
  iss?: unknown;
  sub?: unknown;
}

export type OwnerAuthFailureCode =
  | "FLOES_OWNER_CONFIG"
  | "FLOES_OWNER_PROJECT_MISMATCH"
  | "FLOES_OWNER_UID_NOT_ALLOWED"
  | "FLOES_OWNER_TOKEN_INVALID"
  | "FLOES_OWNER_VERIFICATION_UNAVAILABLE";

export class OwnerAuthError extends Error {
  readonly code: OwnerAuthFailureCode;

  constructor(code: OwnerAuthFailureCode) {
    super(code);
    this.name = "OwnerAuthError";
    this.code = code;
  }
}

let cachedCertificates: { expiresAt: number; values: Record<string, string> } | null = null;

const decodePart = (part: string) =>
  JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;

async function certificates() {
  if (cachedCertificates && cachedCertificates.expiresAt > Date.now()) return cachedCertificates.values;
  const response = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
    { signal: AbortSignal.timeout(8_000) },
  );
  if (!response.ok) throw new OwnerAuthError("FLOES_OWNER_VERIFICATION_UNAVAILABLE");
  const values = (await response.json()) as Record<string, string>;
  const maxAge = Number(/max-age=(\d+)/i.exec(response.headers.get("cache-control") ?? "")?.[1] ?? 300);
  cachedCertificates = { values, expiresAt: Date.now() + maxAge * 1000 };
  return values;
}

export async function requireFloesOwner(request: ApiRequest) {
  const rawProjectId = process.env.FIREBASE_PROJECT_ID;
  const rawOwnerUid = process.env.FLOES_OWNER_UID;
  if (!rawProjectId?.trim() || !rawOwnerUid?.trim()) throw new OwnerAuthError("FLOES_OWNER_CONFIG");
  if (rawProjectId !== rawProjectId.trim() || rawOwnerUid !== rawOwnerUid.trim()) {
    throw new OwnerAuthError("FLOES_OWNER_CONFIG");
  }
  const projectId = rawProjectId;
  const ownerUid = rawOwnerUid;
  const token = header(request.headers.authorization).replace(/^Bearer\s+/i, "");
  if (!token) throw new OwnerAuthError("FLOES_OWNER_TOKEN_INVALID");
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST?.trim();
  if (emulatorHost) {
    if (!projectId.startsWith("demo-") || !/^(127\.0\.0\.1|localhost|\[::1\]):\d{1,5}$/.test(emulatorHost)) {
      throw new OwnerAuthError("FLOES_OWNER_CONFIG");
    }
    const response = await fetch(`http://${emulatorHost}/identitytoolkit.googleapis.com/v1/accounts:lookup?key=fake-api-key`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new OwnerAuthError("FLOES_OWNER_TOKEN_INVALID");
    const result = await response.json() as { users?: Array<{ localId?: string }> };
    if (!result.users?.some(user => user.localId === ownerUid)) throw new OwnerAuthError("FLOES_OWNER_UID_NOT_ALLOWED");
    return ownerUid;
  }
  const parts = token.split(".");
  if (parts.length !== 3) throw new OwnerAuthError("FLOES_OWNER_TOKEN_INVALID");

  let jwtHeader: Record<string, unknown>;
  let claims: FirebaseClaims;
  try {
    jwtHeader = decodePart(parts[0]);
    claims = decodePart(parts[1]) as FirebaseClaims;
  } catch {
    throw new OwnerAuthError("FLOES_OWNER_TOKEN_INVALID");
  }
  if (jwtHeader.alg !== "RS256" || typeof jwtHeader.kid !== "string") throw new OwnerAuthError("FLOES_OWNER_TOKEN_INVALID");
  let certificate: string | undefined;
  try { certificate = (await certificates())[jwtHeader.kid]; }
  catch (error) {
    if (error instanceof OwnerAuthError) throw error;
    throw new OwnerAuthError("FLOES_OWNER_VERIFICATION_UNAVAILABLE");
  }
  if (!certificate) throw new OwnerAuthError("FLOES_OWNER_TOKEN_INVALID");
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();
  if (!verifier.verify(certificate, Buffer.from(parts[2], "base64url"))) throw new OwnerAuthError("FLOES_OWNER_TOKEN_INVALID");

  const now = Math.floor(Date.now() / 1000);
  if (claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new OwnerAuthError("FLOES_OWNER_PROJECT_MISMATCH");
  }
  if (claims.sub !== ownerUid) throw new OwnerAuthError("FLOES_OWNER_UID_NOT_ALLOWED");
  if (
    typeof claims.exp !== "number" ||
    claims.exp <= now ||
    typeof claims.iat !== "number" ||
    claims.iat > now ||
    !claims.sub
  ) {
    throw new OwnerAuthError("FLOES_OWNER_TOKEN_INVALID");
  }
  return ownerUid;
}
