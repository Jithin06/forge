import { beforeEach, describe, expect, it } from "vitest";
import { resetRateLimit, takeToken } from "./ratelimit";

describe("rate limit", () => {
  beforeEach(resetRateLimit);
  it("allows 20 calls an hour per IP, then refuses, then recovers", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 20; i++) expect(takeToken("1.1.1.1", t0 + i, 20).ok).toBe(true);
    const blocked = takeToken("1.1.1.1", t0 + 30, 20);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterS).toBeGreaterThan(3500);
    expect(takeToken("2.2.2.2", t0 + 30, 20).ok).toBe(true);
    expect(takeToken("1.1.1.1", t0 + 60 * 60 * 1000 + 1, 20).ok).toBe(true);
  });
});
