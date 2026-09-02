const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

export async function enforceRateLimit(db: any, request: Request, action: string, maximum: number, windowMinutes: number) {
  const source = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("cf-connecting-ip") || "unknown";
  const identifierHash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${action}:${source}`)));
  const windowMs = windowMinutes * 60_000;
  const windowStartedAt = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();
  const { data } = await db.from("endpoint_rate_limits").select("request_count").eq("identifier_hash", identifierHash).eq("action", action).eq("window_started_at", windowStartedAt).maybeSingle();
  if ((data?.request_count || 0) >= maximum) throw new Error("rate_limit_exceeded");
  await db.from("endpoint_rate_limits").upsert({ identifier_hash: identifierHash, action, window_started_at: windowStartedAt, request_count: (data?.request_count || 0) + 1 });
}

