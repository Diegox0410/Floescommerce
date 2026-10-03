const TENANT_ID = "tenant-floes";

type AccessScope = "commerce" | "owner";

const requireEnvironment = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Server configuration missing: ${name}`);
  return value;
};

export const chopifyBaseUrl = () =>
  requireEnvironment("CHOPIFY_BASE_URL").replace(/\/$/, "");

export async function executeCommerce(
  operation: string,
  input: Record<string, unknown>,
  options: { idempotencyKey?: string; scope?: AccessScope } = {},
) {
  const scope = options.scope ?? "commerce";
  const token = requireEnvironment(
    scope === "owner"
      ? "CHOPIFY_OWNER_API_TOKEN_FLOES"
      : "CHOPIFY_COMMERCE_API_TOKEN",
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(`${chopifyBaseUrl()}/api/commerce`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Chopify-Tenant-Id": TENANT_ID,
        ...(scope === "owner" ? { "X-Chopify-Access-Scope": "owner" } : {}),
      },
      body: JSON.stringify({
        operation,
        input,
        ...(options.idempotencyKey
          ? { idempotencyKey: options.idempotencyKey }
          : {}),
      }),
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const detail =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error?: unknown }).error ?? "")
          : "";
      throw new Error(detail || `Chopify request failed (${response.status})`);
    }
    if (!payload || typeof payload !== "object" || !(payload as { ok?: boolean }).ok) {
      throw new Error("Chopify returned an invalid response");
    }
    return (payload as { data?: unknown }).data;
  } finally {
    clearTimeout(timeout);
  }
}

export const tenantId = TENANT_ID;
