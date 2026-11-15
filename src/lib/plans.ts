import "server-only";
import { randomBytes } from "node:crypto";
import type { Answers, PlanOutput } from "./ai/schemas";
import { finalize, type BasePlan, type FinalPlan } from "./compute/plan";
import type { ScrapItem } from "./compute/scrapMatch";
import { db } from "./db";
import type { Audience, Experience } from "./schemas";

export type StoredPlan = { base: BasePlan; model: PlanOutput; fixture: boolean; attempts: number };

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function shortId(len = 10): string {
  const bytes = randomBytes(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function savePlan(p: {
  idea_text: string;
  answers: Answers;
  audience: Audience;
  experience: Experience;
  had_image: boolean;
  stored: StoredPlan;
  usage: { input_tokens: number; output_tokens: number };
  user_id?: string | null;
}): Promise<string> {
  const top = p.stored.base.routes[0];
  for (let i = 0; i < 3; i++) {
    const id = shortId();
    const { error } = await db().from("plans").insert({
      id,
      user_id: p.user_id ?? null,
      idea_text: p.idea_text,
      answers: p.answers,
      audience: p.audience,
      experience: p.experience,
      had_image: p.had_image,
      plan: p.stored,
      space_ids: [...new Set(p.stored.base.routes.map((r) => r.space_id))],
      cost_low_usd: top?.total?.low ?? null,
      cost_high_usd: top?.total?.high ?? null,
      input_tokens: p.usage.input_tokens,
      output_tokens: p.usage.output_tokens,
    });
    if (!error) return id;
    if (error.code !== "23505") throw new Error(`Could not save plan: ${error.message}`); // retry only on id collision
  }
  throw new Error("Could not save plan: id collisions");
}

/** All available scrap, newest first. Never cached: availability changes. */
export async function availableScrap(): Promise<ScrapItem[]> {
  const { data, error } = await db()
    .from("scrap_items")
    .select("id, space_id, material_category, title, size_note, condition, restrictions, photo_url, posted_at")
    .eq("status", "available")
    .gt("expires_at", new Date().toISOString());
  if (error) throw new Error(`Could not load scrap: ${error.message}`);
  return data as ScrapItem[];
}

export type PlanView = {
  id: string;
  idea_text: string;
  answers: Answers;
  experience: Experience;
  plan: FinalPlan;
  fixture: boolean;
  created_at: string;
};

/** A stored plan with fresh scrap matches, labels and with-scrap totals. */
export async function getPlan(id: string): Promise<PlanView | null> {
  if (!/^[A-Za-z0-9]{6,20}$/.test(id)) return null;
  const { data, error } = await db()
    .from("plans")
    .select("id, idea_text, answers, experience, plan, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load plan: ${error.message}`);
  if (!data) return null;
  const stored = data.plan as StoredPlan;
  return {
    id: data.id,
    idea_text: data.idea_text,
    answers: data.answers as Answers,
    experience: data.experience as Experience,
    plan: finalize(stored.base, await availableScrap()),
    fixture: stored.fixture,
    created_at: data.created_at,
  };
}
