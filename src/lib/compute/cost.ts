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
   * True when this space lists no price and the figure comes from the
   * general table of typical prices for buying the material yourself.
   */
  typical?: boolean;
};

/** One row of the general price table (data/typical-prices.json). */
export type TypicalPrice = { category: MaterialCategory; name: string; unit_price_usd: number; price_unit: string };
export const TYPICAL_LABEL = "typical price if you buy it yourself";

export type RouteCost = {
  lines: CostLine[];
  /** null when nothing on the route has a price: show no dollar figure */
  total: { low: number; high: number } | null;
  prices_estimated: boolean;
  /** Set when any line uses the general table of typical prices. */
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
 * a space that lists no material of that kind uses the general table of
 * typical prices, marked typical.
 */
export function routeCost(
  space: SpaceDoc,
  materials: ModelRoute["materials"],
  audience: Audience,
  /** The general table: what a material typically costs if the student buys it. Estimated, the same for every space. */
  typicalPrices: TypicalPrice[] = [],
  /** False when the route's work is not making something from bought material (a poster, a recording). */
  allowTypical = true,
): RouteCost {
  let usedTypical = false;
  const lines: CostLine[] = materials.map((m) => {
    const mat = m.material_id ? space.materials.find((x) => x.id === m.material_id) : undefined;
    const unitOk = (x: { price_unit: string | null }) => x.price_unit === null || sameUnit(x.price_unit, m.unit);
    let price = mat && unitOk(mat) ? priceFor(mat, audience) : null;
    let typical = false;
    let typicalName: string | null = null;
    // The space lists no material of this kind: use the typical price for buying it yourself.
    if (price === null && !mat && allowTypical && !space.materials.some((x) => x.category === m.category)) {
      const ref = typicalPrices.find((x) => x.category === m.category && unitOk(x));
      if (ref) {
        price = ref.unit_price_usd;
        typical = true;
        typicalName = ref.name;
        usedTypical = true;
      }
    }
    return {
      category: m.category,
      material_id: m.material_id,
      name: mat?.name ?? typicalName ?? sentenceCase(m.category.replaceAll("_", " ")),
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
    // A typical price is always an estimate, whatever this space has confirmed.
    prices_estimated: usedTypical || space.status.prices.state === "estimated",
    typical_from: usedTypical ? TYPICAL_LABEL : null,
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
