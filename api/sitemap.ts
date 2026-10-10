/// <reference types="node" />

import type { ApiRequest, ApiResponse } from "./_lib/http.js";
import { header } from "./_lib/http.js";
import { chopifyProtectionHeaders, publicCatalogUrl } from "./_lib/chopify.js";

const xml = (value: string) => value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!);
export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "GET") { response.statusCode = 405; response.end(); return; }
  const configured = process.env.FLOES_SITE_URL;
  const host = header(request.headers.host);
  if (!configured && !/^[a-z0-9.-]+(?::\d+)?$/i.test(host)) { response.statusCode = 400; response.end(); return; }
  const origin = configured ? new URL(configured).origin : `https://${host}`;
  try {
    const upstream = await fetch(publicCatalogUrl(), { headers: chopifyProtectionHeaders(), signal: AbortSignal.timeout(10_000) });
    if (!upstream.ok) throw new Error("Catalog unavailable");
    const catalog: unknown = await upstream.json();
    if (!Array.isArray(catalog)) throw new Error("Invalid catalog");
    const locations = ["/", "/catalogo", ...catalog.filter((item) => item && item.status === "ACTIVE" && item.visibility === "VISIBLE").map((item) => `/producto/${encodeURIComponent(item.slug || item.productId)}`)];
    response.statusCode = 200; response.setHeader("Content-Type", "application/xml; charset=utf-8");
    response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    response.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(locations)].map((path) => `<url><loc>${xml(new URL(path, origin).href)}</loc></url>`).join("")}</urlset>`);
  } catch { response.statusCode = 503; response.setHeader("Cache-Control", "no-store"); response.end("Sitemap temporarily unavailable"); }
}
