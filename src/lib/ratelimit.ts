/**
 * 100 AI calls per IP per hour across /api/ask and /api/plan.
 *
 * SPEC 7.6 said 20. Raised to 100 on Nov 15: at the hackathon everyone on the
 * venue Wi-Fi shares one address, so 20 would lock the whole room out. The
 * daily cap (lib/ai/budget.ts) is what protects the quota.
 *
 * Kept in memory: on a serverless host each warm instance counts on its own,
 * so this caps bursts rather than guaranteeing a global limit.
 * RATE_LIMIT_PER_HOUR overrides the limit.
 */
export const DEFAULT_RATE_LIMIT_PER_HOUR = 100;
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

export function limitPerHour(): number {
  const n = Number(process.env.RATE_LIMIT_PER_HOUR);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RATE_LIMIT_PER_HOUR;
}

export function takeToken(ip: string, now = Date.now(), limit = limitPerHour()): { ok: boolean; retryAfterS: number } {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(ip, recent);
    return { ok: false, retryAfterS: Math.ceil((recent[0] + WINDOW_MS - now) / 1000) };
  }
  recent.push(now);
  hits.set(ip, recent);
  return { ok: true, retryAfterS: 0 };
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function resetRateLimit() {
  hits.clear();
}
