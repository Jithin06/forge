import bfms from "../../data/spaces/bfms.json";
import bme from "../../data/spaces/bme-innovation.json";

/** Raw seed documents, for tests only. */
export const SEED_DOCS: unknown[] = [bfms, bme];

/** Deep copy so a test can break one field without touching others. */
export function clone<T>(v: T): T {
  return structuredClone(v);
}

import phoneStand from "./test-data/plan-phone-stand.json";
import nightLight from "./test-data/plan-night-light.json";
import clubSign from "./test-data/plan-club-sign.json";
import defaultPlan from "./test-data/plan-default.json";
import { parseSpaceDoc, type SpaceDoc } from "./schemas";
import { planOutputSchema, type PlanOutput } from "./ai/schemas";

/** Hand-written plans with known quantities, so the arithmetic can be checked by hand. */
export const PLAN_FIXTURES: Record<string, unknown> = {
  "phone-stand": phoneStand,
  "night-light": nightLight,
  "club-sign": clubSign,
  default: defaultPlan,
};

/** The seed documents exactly as they are in data/spaces. For tests about the real facts. */
export function realSeedSpaces(): SpaceDoc[] {
  return SEED_DOCS.map((raw) => {
    const r = parseSpaceDoc(raw);
    if (!r.ok) throw new Error(r.errors.join("; "));
    return r.doc;
  });
}

/**
 * The seed spaces plus TEST-ONLY sheet stock at the Maker Space, so the
 * hand-written plans (which name those materials) still exercise grounding,
 * pricing by quantity, scrap matching and labels. The real Maker Space sells
 * no material; realSeedSpaces() has the truth.
 */
export function seedSpaces(): SpaceDoc[] {
  const spaces = realSeedSpaces();
  const bfms = spaces.find((s) => s.id === "bfms")!;
  const stock = (id: string, name: string, category: SpaceDoc["materials"][number]["category"], usd: number) =>
    bfms.materials.push({ id, name, category, unit_price_usd: usd, price_unit: "sheet", price_source: "test stock, not real", stocked: null });
  stock("plywood_sheet", "Plywood sheet (about 12 x 24 in)", "plywood", 6);
  stock("mdf_sheet", "MDF (fiberboard) sheet (about 12 x 24 in)", "mdf", 4);
  stock("acrylic_sheet", "Acrylic sheet (about 12 x 24 in)", "acrylic", 12);
  stock("petg_sheet", "PETG sheet (about 12 x 24 in)", "other_plastic_sheet", 10);
  stock("cardboard", "Cardboard sheet", "cardboard_paper", 1);
  return spaces;
}

export function planFixture(name: string): PlanOutput {
  const f = PLAN_FIXTURES[name] as { output: unknown };
  return planOutputSchema.parse(f.output);
}

/** The seed spaces with every price removed, for "no price data" cases. */
export function unpricedSpaces(): SpaceDoc[] {
  const spaces = seedSpaces();
  for (const s of spaces)
    for (const m of s.materials) {
      m.unit_price_usd = null;
      delete m.price_by_audience;
    }
  return spaces;
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
    delete m.price_by_audience;
  };
  price("plywood_sheet", 9.5, "sheet");
  price("cardboard", 1, "sheet");
  price("pla_filament", 0.05, "g");
  bfms.access = bfms.access.map((a) => (a.audience === "viterbi_undergrad" ? { ...a, status: "open" as const } : a));
  return spaces;
}
