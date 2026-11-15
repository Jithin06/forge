import "server-only";

/**
 * Two different caps on live AI calls.
 *
 * Local work: AI_CALL_BUDGET is a fixed total, counted in logs/ai-calls.jsonl.
 * It never resets. Set it only in .env.local.
 *
 * The live site: a DAILY cap, AI_DAILY_BUDGET (default 450). The day is the
 * Pacific calendar day, because Gemini's requests-per-day quota resets at
 * midnight Pacific time. The count lives in the database, in one row per day,
 * so it is shared by every server copy and survives restarts. It applies
 * whenever AI_CALL_BUDGET is not set.
 */
export const DEFAULT_DAILY_BUDGET = 450;

export class BudgetReached extends Error {}

/** YYYY-MM-DD in Los Angeles. */
export function pacificDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now);
}

export function dailyLimit(): number {
  const n = Number(process.env.AI_DAILY_BUDGET);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_DAILY_BUDGET;
}

/** Atomic "add one if under the limit" in the database. Returns the new count, or -1 when the day is used up. */
export type SpendRpc = (day: string, limit: number) => Promise<{ data: number | null; error: { message: string } | null }>;

// Used only when the database counter is missing (schema not applied yet).
// Each server copy then counts on its own, so the cap is approximate.
const memory = new Map<string, number>();
let warned = false;

export async function spendDailyCall(rpc: SpendRpc, now = new Date()): Promise<{ day: string; count: number; limit: number; shared: boolean }> {
  const day = pacificDay(now);
  const limit = dailyLimit();
  const { data, error } = await rpc(day, limit).catch((e) => ({ data: null, error: { message: String(e) } }));
  if (!error && typeof data === "number") {
    if (data < 0) throw new BudgetReached(`Daily live AI budget reached (${limit} on ${day}, Pacific time).`);
    return { day, count: data, limit, shared: true };
  }
  if (!warned) {
    warned = true;
    console.warn(`Daily AI budget is counting in memory only (${error?.message}). Apply supabase/schema.sql to share the count.`);
  }
  for (const k of memory.keys()) if (k !== day) memory.delete(k); // a new day starts from zero
  const used = memory.get(day) ?? 0;
  if (used >= limit) throw new BudgetReached(`Daily live AI budget reached (${limit} on ${day}, Pacific time).`);
  memory.set(day, used + 1);
  return { day, count: used + 1, limit, shared: false };
}

export function resetDailyMemory() {
  memory.clear();
  warned = false;
}
