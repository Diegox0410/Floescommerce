import type { ApiRequest, ApiResponse } from "./_lib/http.js";
import { json } from "./_lib/http.js";
import { chopifyBaseUrl } from "./_lib/chopify.js";

const absoluteAssetUrls = (value: unknown, origin: string): unknown => {
  if (Array.isArray(value)) return value.map((entry) => absoluteAssetUrls(entry, origin));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if ((key === "url" || key === "imageUrl") && typeof entry === "string") {
        return [key, new URL(entry, `${origin}/`).toString()];
      }
      return [key, absoluteAssetUrls(entry, origin)];
    }),
  );
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "GET") return json(response, 405, { error: "Method not allowed" });

  try {
    const origin = chopifyBaseUrl();
    const upstream = await fetch(`${origin}/api/catalog`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) throw new Error(`Catalog upstream failed (${upstream.status})`);
    const catalog: unknown = await upstream.json();
    response.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify(absoluteAssetUrls(catalog, origin)));
  } catch (error) {
    console.error("FLOES catalog proxy:", error instanceof Error ? error.message : "unknown");
    return json(response, 502, { error: "El catálogo no está disponible temporalmente." });
  }
}
