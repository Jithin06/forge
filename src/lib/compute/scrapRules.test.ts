import { describe, expect, it } from "vitest";
import { UNKNOWN_PLASTIC_RESTRICTION, type ScrapOutput } from "../ai/schemas";
import { realSeedSpaces, seedSpaces } from "../test-fixtures";
import { normalizeDraft, draftBlockedReason, publishBlockedReason, withRequiredRestrictions } from "./scrapRules";

const draft = (over: Partial<ScrapOutput>): ScrapOutput => ({
  error: null, material_category: "acrylic", title: "Clear sheet", description: "A clear plastic sheet.", size_note: "30 x 20 cm",
  condition: "good", suggested_uses: [], restrictions: [], confidence: "high", needs_staff_check: false, ...over,
});

describe("scrap rules", () => {
  it("an unidentifiable plastic sheet becomes unknown_plastic, restricted, and flagged for staff", () => {
    const d = normalizeDraft(draft({ material_category: "acrylic", confidence: "low" }));
    expect(d.material_category).toBe("unknown_plastic");
    expect(d.restrictions).toContain(UNKNOWN_PLASTIC_RESTRICTION);
    expect(d.needs_staff_check).toBe(true);
  });
  it("a low-confidence non-plastic becomes other and is flagged", () => {
    const d = normalizeDraft(draft({ material_category: "aluminum", confidence: "low" }));
    expect([d.material_category, d.needs_staff_check]).toEqual(["other", true]);
  });
  it("keeps a confident answer, trims the title to 6 words and marks the size approximate", () => {
    const d = normalizeDraft(draft({ title: "A very nice big clear acrylic sheet offcut", size_note: "30 x 20 cm" }));
    expect(d.material_category).toBe("acrylic");
    expect(d.title).toBe("A very nice big clear acrylic");
    expect(d.size_note).toBe("About 30 x 20 cm");
    expect(normalizeDraft(draft({ size_note: "Roughly 1 m long" })).size_note).toBe("Roughly 1 m long");
  });
  it("staff cannot remove the unknown-plastic restriction", () => {
    expect(withRequiredRestrictions("unknown_plastic", [])).toEqual([UNKNOWN_PLASTIC_RESTRICTION]);
    expect(withRequiredRestrictions("unknown_plastic", ["Sharp edge", UNKNOWN_PLASTIC_RESTRICTION])).toEqual(["Sharp edge", UNKNOWN_PLASTIC_RESTRICTION]);
    expect(withRequiredRestrictions("plywood", [" Has nails ", ""])).toEqual(["Has nails"]);
  });
  it("publishing in a never_offer category is refused with the reason", () => {
    const bfms = seedSpaces().find((s) => s.id === "bfms")!;
    bfms.scrap_policy.never_offer = [];
    expect(publishBlockedReason(bfms, "resin")).toBeNull();
    bfms.scrap_policy.never_offer = ["resin"];
    expect(publishBlockedReason(bfms, "resin")).toBe("Baum Family Maker Space does not give away resin. Its scrap policy lists it as never offered.");
    expect(publishBlockedReason(bfms, "plywood")).toBeNull();
  });

  describe("Maker Space scrap rules (from Jithin, estimated)", () => {
    const bfms = realSeedSpaces().find((s) => s.id === "bfms")!;
    const draft = { material_category: "plywood" as const, confidence: "high" as const, never_post_match: null };
    it("an ordinary offcut may be published", () => {
      expect(draftBlockedReason(bfms, draft)).toBeNull();
      expect(bfms.scrap_policy.pickup_note).toBe("Show this claim to a staff member at the Maker Space. They will hand the piece to you.");
    });
    it("something on the never-post list is blocked, and the reason names it", () => {
      expect(draftBlockedReason(bfms, { ...draft, material_category: "other", never_post_match: "Batteries" })).toBe(
        "This cannot be posted. Baum Family Maker Space never gives away: batteries.",
      );
    });
    it("resin is blocked by category even if the model does not flag it", () => {
      expect(draftBlockedReason(bfms, { ...draft, material_category: "resin" })).toMatch(/^This cannot be posted\. Baum Family Maker Space does not give away resin/);
      expect(publishBlockedReason(bfms, "resin")).not.toBeNull(); // the publish route refuses it too
    });
    it("material nobody can identify is blocked: low confidence, or unknown plastic", () => {
      expect(draftBlockedReason(bfms, { ...draft, confidence: "low" })).toMatch(/could not be identified/);
      expect(draftBlockedReason(bfms, { ...draft, material_category: "unknown_plastic", confidence: "medium" })).toMatch(/could not be identified/);
      expect(publishBlockedReason(bfms, "unknown_plastic")).not.toBeNull();
    });
    it("a space without such rules blocks none of these", () => {
      const bme = realSeedSpaces().find((s) => s.id === "bme-innovation")!;
      expect(draftBlockedReason(bme, { ...draft, confidence: "low", never_post_match: "Batteries" })).toBeNull();
    });
  });
});
