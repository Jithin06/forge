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

/**
 * Why a drafted listing may not be published at this space, or null.
 * Three reasons, all from the space's scrap policy: the piece is on its
 * never-post list, its category is never offered, or nobody can say what the
 * material is. Staff see the reason and cannot publish that draft.
 */
export function draftBlockedReason(space: Pick<SpaceDoc, "name" | "scrap_policy">, draft: Pick<ScrapOutput, "material_category" | "confidence" | "never_post_match">): string | null {
  const policy = space.scrap_policy;
  const match = draft.never_post_match?.trim();
  if (match && (policy.never_post?.length ?? 0) > 0) {
    return `This cannot be posted. ${space.name} never gives away: ${match.replace(/[.\s]+$/, "").toLowerCase()}.`;
  }
  const unidentified = draft.confidence === "low" || draft.material_category === "unknown_plastic";
  if (policy.block_unidentified && unidentified) {
    return `This cannot be posted. The material could not be identified, and ${space.name} never gives away material nobody can identify. If you know what it is, start over and say so in the note.`;
  }
  const category = publishBlockedReason(space, draft.material_category);
  return category ? `This cannot be posted. ${category}` : null;
}
