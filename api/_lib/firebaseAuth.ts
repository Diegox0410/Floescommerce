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

let cachedCertificates: { expiresAt: number; values: Record<string, string> } | null = null;

const decodePart = (part: string) =>
  JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;

async function certificates() {
  if (cachedCertificates && cachedCertificates.expiresAt > Date.now()) return cachedCertificates.values;
  const response = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
    { signal: AbortSignal.timeout(8_000) },
  );
  if (!response.ok) throw new Error("Firebase certificate lookup failed");
  const values = (await response.json()) as Record<string, string>;
  const maxAge = Number(/max-age=(\d+)/i.exec(response.headers.get("cache-control") ?? "")?.[1] ?? 300);
  cachedCertificates = { values, expiresAt: Date.now() + maxAge * 1000 };
  return values;
}

export async function requireFloesOwner(request: ApiRequest) {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const ownerUid = process.env.FLOES_OWNER_UID?.trim();
  if (!projectId || !ownerUid) throw new Error("Owner authentication is not configured");
  const token = header(request.headers.authorization).replace(/^Bearer\s+/i, "");
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST?.trim();
  if (emulatorHost) {
    if (!projectId.startsWith("demo-") || !/^(127\.0\.0\.1|localhost|\[::1\]):\d{1,5}$/.test(emulatorHost)) {
      throw new Error("Firebase Auth Emulator is restricted to loopback and a demo project");
    }
    const response = await fetch(`http://${emulatorHost}/identitytoolkit.googleapis.com/v1/accounts:lookup?key=fake-api-key`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error("Unauthorized");
    const result = await response.json() as { users?: Array<{ localId?: string }> };
    if (!result.users?.some(user => user.localId === ownerUid)) throw new Error("Unauthorized");
    return ownerUid;
  }
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Unauthorized");

  const jwtHeader = decodePart(parts[0]);
  const claims = decodePart(parts[1]) as FirebaseClaims;
  if (jwtHeader.alg !== "RS256" || typeof jwtHeader.kid !== "string") throw new Error("Unauthorized");
  const certificate = (await certificates())[jwtHeader.kid];
  if (!certificate) throw new Error("Unauthorized");
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();
  if (!verifier.verify(certificate, Buffer.from(parts[2], "base64url"))) throw new Error("Unauthorized");

  const now = Math.floor(Date.now() / 1000);
  if (
    claims.aud !== projectId ||
    claims.iss !== `https://securetoken.google.com/${projectId}` ||
    claims.sub !== ownerUid ||
    typeof claims.exp !== "number" ||
    claims.exp <= now ||
    typeof claims.iat !== "number" ||
    claims.iat > now ||
    !claims.sub
  ) {
    throw new Error("Unauthorized");
  }
  return ownerUid;
}
