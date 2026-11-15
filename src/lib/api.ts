import { AIError } from "./ai/client";
import { clientIp, takeToken } from "./ratelimit";

export const NO_STORE = { "Cache-Control": "no-store" };

/** Error body shape from SPEC.md section 7.6. */
export function apiError(status: number, code: string, message: string, headers: Record<string, string> = {}) {
  return Response.json({ error: { code, message } }, { status, headers: { ...NO_STORE, ...headers } });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** Shared 429 for the AI routes. Returns a response when the caller is over the limit. */
export function rateLimited(request: Request): Response | null {
  const r = takeToken(clientIp(request));
  if (r.ok) return null;
  return apiError(
    429,
    "RATE_LIMITED",
    "You have asked a lot of questions in the last hour. Please wait a little and try again.",
    { "Retry-After": String(r.retryAfterS) },
  );
}

/** Model failures become one friendly sentence; details go to the server log. */
export function aiFailure(e: unknown): Response {
  if (e instanceof AIError) {
    console.error(`AI ${e.code}: ${e.message}`, e.details);
    if (e.code === "BUSY" || e.code === "BUDGET") {
      return apiError(429, "AI_BUSY", "Forge is busy, try again in a minute.", { "Retry-After": "60" });
    }
    if (e.code === "TIMEOUT") {
      return apiError(502, "AI_TIMEOUT", "This is taking longer than usual. Please try again.");
    }
    return apiError(502, "AI_FAILED", "We could not put a plan together just now. Please try again.");
  }
  console.error(e);
  return apiError(502, "AI_FAILED", "Something went wrong on our side. Please try again.");
}

export function zodMessage(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)).join("; ");
}
