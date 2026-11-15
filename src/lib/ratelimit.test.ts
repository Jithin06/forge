import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_RATE_LIMIT_PER_HOUR, limitPerHour, resetRateLimit, takeToken } from "./ratelimit";

describe("rate limit", () => {
  beforeEach(resetRateLimit);
  it("the default is 100 an hour per address, so a room on one Wi-Fi address is not locked out", () => {
    expect(DEFAULT_RATE_LIMIT_PER_HOUR).toBe(100);
    if (!process.env.RATE_LIMIT_PER_HOUR) expect(limitPerHour()).toBe(100);
    const t0 = 5_000_000;
    for (let i = 0; i < 100; i++) expect(takeToken("9.9.9.9", t0 + i).ok).toBe(true);
    expect(takeToken("9.9.9.9", t0 + 200).ok).toBe(false);
  });
  it("allows the given number of calls an hour per IP, then refuses, then recovers", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 20; i++) expect(takeToken("1.1.1.1", t0 + i, 20).ok).toBe(true);
    const blocked = takeToken("1.1.1.1", t0 + 30, 20);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterS).toBeGreaterThan(3500);
    expect(takeToken("2.2.2.2", t0 + 30, 20).ok).toBe(true);
    expect(takeToken("1.1.1.1", t0 + 60 * 60 * 1000 + 1, 20).ok).toBe(true);
  });
});
