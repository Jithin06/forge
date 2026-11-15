import type { ModelRoute } from "../ai/schemas";
import type { MaterialCategory, SpaceDoc } from "../schemas";

export type CostLine = {
  category: MaterialCategory;
  material_id: string | null;
  name: string;
  quantity_low: number;
  quantity_high: number;
  unit: string;
  /** null when there is no stored price, or the units do not match */
  unit_price_usd: number | null;
  low_usd: number | null;
  high_usd: number | null;
};

export type RouteCost = {
  lines: CostLine[];
  /** null when nothing on the route has a price: show no dollar figure */
  total: { low: number; high: number } | null;
  prices_estimated: boolean;
};

const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const cents = (n: number) => Math.round(n * 100) / 100;

/** "sheets" and "Sheet" match; "g" and "kg" do not. */
export function sameUnit(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/s$/, "");
  return norm(a) === norm(b);
}

/**
 * Step 4: price x quantity from stored prices only. A material with no
 * stored price, or whose quantity unit differs from the price unit, is
 * left unpriced ("ask staff for the price") rather than guessed.
 */
export function routeCost(space: SpaceDoc, materials: ModelRoute["materials"]): RouteCost {
  const lines: CostLine[] = materials.map((m) => {
    const mat = m.material_id ? space.materials.find((x) => x.id === m.material_id) : undefined;
    const priced =
      mat?.unit_price_usd != null && (mat.price_unit === null || sameUnit(mat.price_unit, m.unit));
    const price = priced ? mat!.unit_price_usd! : null;
    return {
      category: m.category,
      material_id: m.material_id,
      name: mat?.name ?? sentenceCase(m.category.replaceAll("_", " ")),
      quantity_low: m.quantity_low,
      quantity_high: m.quantity_high,
      unit: m.unit,
      unit_price_usd: price,
      low_usd: price === null ? null : cents(price * m.quantity_low),
      high_usd: price === null ? null : cents(price * m.quantity_high),
    };
  });
  const priced = lines.filter((l) => l.low_usd !== null);
  return {
    lines,
    total: priced.length
      ? {
          low: cents(priced.reduce((s, l) => s + l.low_usd!, 0)),
          high: cents(priced.reduce((s, l) => s + l.high_usd!, 0)),
        }
      : null,
    prices_estimated: space.status.prices.state === "estimated",
  };
}

/** Total with matched materials counted as $0. null when nothing is priced. */
export function withScrapTotal(lines: CostLine[], freeIdx: Set<number>): { low: number; high: number } | null {
  const priced = lines.map((l, i) => ({ l, i })).filter(({ l }) => l.low_usd !== null);
  if (priced.length === 0) return null;
  return {
    low: cents(priced.reduce((s, { l, i }) => s + (freeIdx.has(i) ? 0 : l.low_usd!), 0)),
    high: cents(priced.reduce((s, { l, i }) => s + (freeIdx.has(i) ? 0 : l.high_usd!), 0)),
  };
}
