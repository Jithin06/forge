import { UNKNOWN_PLASTIC_RESTRICTION, type ScrapOutput } from "../ai/schemas";
import type { MaterialCategory, SpaceDoc } from "../schemas";

const PLASTICS: MaterialCategory[] = ["acrylic", "other_plastic_sheet", "unknown_plastic", "pla_filament", "other_filament", "resin"];

/** Rule 5.3.3: unknown plastic always carries the heat restriction. Staff cannot remove it. */
export function withRequiredRestrictions(category: MaterialCategory, restrictions: string[]): string[] {
  const clean = [...new Set(restrictions.map((r) => r.trim()).filter(Boolean))];
  if (category === "unknown_plastic" && !clean.includes(UNKNOWN_PLASTIC_RESTRICTION)) clean.unshift(UNKNOWN_PLASTIC_RESTRICTION);
  return clean;
}

/** Rule 5.3.4: a space's never_offer list wins over anything staff or the model say. */
export function publishBlockedReason(space: Pick<SpaceDoc, "name" | "scrap_policy">, category: MaterialCategory): string | null {
  return space.scrap_policy.never_offer.includes(category)
    ? `${space.name} does not give away ${category.replaceAll("_", " ")}. Its scrap policy lists it as never offered.`
    : null;
}

/**
 * Section 6.4, enforced in code whatever the model returns:
 * - below medium confidence the category becomes unknown_plastic (if it
 *   looked like a plastic) or other, and staff must check it;
 * - unknown plastic gets its restriction;
 * - the title is 6 words at most; the size says it is approximate.
 */
export function normalizeDraft(out: ScrapOutput): ScrapOutput {
  let category = out.material_category;
  let needsCheck = out.needs_staff_check;
  if (out.confidence === "low") {
    if (category !== "unknown_plastic" && category !== "other") category = PLASTICS.includes(category) ? "unknown_plastic" : "other";
    needsCheck = true;
  }
  if (category === "unknown_plastic" || category === "other") needsCheck = true;
  const size = out.size_note.trim();
  return {
    ...out,
    material_category: category,
    needs_staff_check: needsCheck,
    title: out.title.trim().split(/\s+/).slice(0, 6).join(" "),
    size_note: /about|approx|roughly|around/i.test(size) ? size : `About ${size.charAt(0).toLowerCase()}${size.slice(1)}`,
    restrictions: withRequiredRestrictions(category, out.restrictions),
  };
}
