import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BudgetReached, pacificDay, resetDailyMemory, spendDailyCall, type SpendRpc } from "./budget";

const missing: SpendRpc = async () => ({ data: null, error: { message: "function spend_ai_call does not exist" } });

beforeEach(() => {
  resetDailyMemory();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("daily live AI budget", () => {
  it("the day is the Pacific calendar day, matching Gemini's quota reset", () => {
    expect(pacificDay(new Date("2026-11-15T07:59:00Z"))).toBe("2026-11-14"); // 11:59 PM PST
    expect(pacificDay(new Date("2026-11-15T08:01:00Z"))).toBe("2026-11-15"); // 12:01 AM PST
  });

  it("defaults to 450 a day and asks the database to count", async () => {
    const rpc = vi.fn<SpendRpc>(async () => ({ data: 7, error: null }));
    const r = await spendDailyCall(rpc, new Date("2026-11-15T20:00:00Z"));
    expect(rpc).toHaveBeenCalledWith("2026-11-15", 450);
    expect(r).toEqual({ day: "2026-11-15", count: 7, limit: 450, shared: true });
  });

  it("AI_DAILY_BUDGET changes the limit", async () => {
    vi.stubEnv("AI_DAILY_BUDGET", "200");
    const rpc = vi.fn<SpendRpc>(async () => ({ data: 1, error: null }));
    await spendDailyCall(rpc);
    expect(rpc.mock.calls[0][1]).toBe(200);
  });

  it("stops when the database says the day is used up", async () => {
    await expect(spendDailyCall(async () => ({ data: -1, error: null }))).rejects.toBeInstanceOf(BudgetReached);
  });

  it("without the database counter it still caps, per server copy, and resets on the next Pacific day", async () => {
    vi.stubEnv("AI_DAILY_BUDGET", "2");
    const day1 = new Date("2026-11-15T20:00:00Z");
    expect((await spendDailyCall(missing, day1)).shared).toBe(false);
    await spendDailyCall(missing, day1);
    await expect(spendDailyCall(missing, day1)).rejects.toBeInstanceOf(BudgetReached);
    const day2 = new Date("2026-11-16T09:00:00Z"); // 1 AM Pacific the next day
    expect((await spendDailyCall(missing, day2)).count).toBe(1);
  });
});
