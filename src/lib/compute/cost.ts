import type { ModelRoute } from "../ai/schemas";
import type { Audience, Material, MaterialCategory, SpaceDoc } from "../schemas";

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
  /**
   * True when this space lists no price and the figure is another space's
   * price for the same kind of material, used as a typical campus price.
   */
  typical?: boolean;
};

export type RouteCost = {
  lines: CostLine[];
  /** null when nothing on the route has a price: show no dollar figure */
  total: { low: number; high: number } | null;
  prices_estimated: boolean;
  /** Name of the space whose prices stand in as typical campus prices, when any line uses them. */
  typical_from: string | null;
};

/** The price this audience pays: the audience's own price where the space publishes one. */
export function priceFor(m: Material, audience: Audience): number | null {
  const special = m.price_by_audience;
  if (special && audience in special) return special[audience] ?? null;
  return m.unit_price_usd;
}

const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const cents = (n: number) => Math.round(n * 100) / 100;

/** "sheets" and "Sheet" match; "g" and "kg" do not. */
export function sameUnit(a: string, b: string): boolean {
  const norm = (s: string) => {
    const t = s.trim().toLowerCase().replace(/\.$/, "").replace(/inches\b/, "inch").replace(/centimetres?\b|centimeters\b/, "centimeter").replace(/s$/, "");
    if (/^(cubic inch|cu\.? ?in|in3|in³|inch3|inch³)$/.test(t)) return "cubic inch";
    if (/^(cubic centimeter|cm3|cm³|cc|cu\.? ?cm)$/.test(t)) return "cubic centimeter";
    if (/^(inch|in|")$/.test(t)) return "inch";
    if (/^(ml|milliliter|millilitre)$/.test(t)) return "ml";
    if (/^(g|gram)$/.test(t)) return "g";
    return t;
  };
  return norm(a) === norm(b);
}

/**
 * Step 4: price x quantity from stored prices only. A material with no
 * stored price, or whose quantity unit differs from the price unit, is
 * left unpriced ("ask staff for the price") rather than guessed. Two
 * exceptions, both from stored data: an audience may have its own price, and
 * a space that lists no material of that kind may borrow the reference
 * space's price, marked typical.
 */
export function routeCost(
  space: SpaceDoc,
  materials: ModelRoute["materials"],
  audience: Audience,
  /** A space whose prices may stand in, labelled typical, where this one lists none. */
  reference?: SpaceDoc,
  /** False when the route's work is not something the reference space does, so its prices would not be typical for it. */
  allowTypical = true,
): RouteCost {
  let usedTypical = false;
  const lines: CostLine[] = materials.map((m) => {
    const mat = m.material_id ? space.materials.find((x) => x.id === m.material_id) : undefined;
    const unitOk = (x: Material) => x.price_unit === null || sameUnit(x.price_unit, m.unit);
    let price = mat && unitOk(mat) ? priceFor(mat, audience) : null;
    let typical = false;
    // No material of this kind is listed here at all: borrow a typical campus price.
    if (price === null && !mat && allowTypical && reference && reference.id !== space.id && !space.materials.some((x) => x.category === m.category)) {
      const ref = reference.materials.find((x) => x.category === m.category && x.unit_price_usd !== null && unitOk(x));
      if (ref) {
        price = ref.unit_price_usd;
        typical = true;
        usedTypical = true;
      }
    }
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
      ...(typical ? { typical: true } : {}),
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
    // A borrowed price is always an estimate, whatever this space has confirmed.
    prices_estimated: usedTypical || space.status.prices.state === "estimated",
    typical_from: usedTypical ? reference!.name : null,
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
