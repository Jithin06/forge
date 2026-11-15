import bfms from "../../data/spaces/bfms.json";
import bme from "../../data/spaces/bme-innovation.json";

/** Raw seed documents, for tests only. */
export const SEED_DOCS: unknown[] = [bfms, bme];

/** Deep copy so a test can break one field without touching others. */
export function clone<T>(v: T): T {
  return structuredClone(v);
}

import phoneStand from "../../data/fixtures/plan/phone-stand.json";
import nightLight from "../../data/fixtures/plan/night-light.json";
import clubSign from "../../data/fixtures/plan/club-sign.json";
import defaultPlan from "../../data/fixtures/plan/default.json";
import { parseSpaceDoc, type SpaceDoc } from "./schemas";
import { planOutputSchema, type PlanOutput } from "./ai/schemas";

export const PLAN_FIXTURES: Record<string, unknown> = {
  "phone-stand": phoneStand,
  "night-light": nightLight,
  "club-sign": clubSign,
  default: defaultPlan,
};

export function seedSpaces(): SpaceDoc[] {
  return SEED_DOCS.map((raw) => {
    const r = parseSpaceDoc(raw);
    if (!r.ok) throw new Error(r.errors.join("; "));
    return r.doc;
  });
}

export function planFixture(name: string): PlanOutput {
  const f = PLAN_FIXTURES[name] as { output: unknown };
  return planOutputSchema.parse(f.output);
}

/**
 * Test-only prices, so cost and labels can be checked by hand. These are
 * NOT real Maker Space prices and never leave the test suite.
 */
export function pricedSpaces(): SpaceDoc[] {
  const spaces = seedSpaces();
  const bfms = spaces.find((s) => s.id === "bfms")!;
  const price = (id: string, usd: number, unit: string) => {
    const m = bfms.materials.find((x) => x.id === id)!;
    m.unit_price_usd = usd;
    m.price_unit = unit;
  };
  price("plywood_sheet", 9.5, "sheet");
  price("cardboard", 1, "sheet");
  price("pla_filament", 0.05, "g");
  bfms.access = bfms.access.map((a) => (a.audience === "viterbi_undergrad" ? { ...a, status: "open" as const } : a));
  return spaces;
}
