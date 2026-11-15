import { describe, expect, it } from "vitest";
import { UNKNOWN_PLASTIC_RESTRICTION, type ScrapOutput } from "../ai/schemas";
import { seedSpaces } from "../test-fixtures";
import { normalizeDraft, publishBlockedReason, withRequiredRestrictions } from "./scrapRules";

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
    expect(publishBlockedReason(bfms, "resin")).toBeNull();
    bfms.scrap_policy.never_offer = ["resin"];
    expect(publishBlockedReason(bfms, "resin")).toBe("Baum Family Maker Space does not give away resin. Its scrap policy lists it as never offered.");
    expect(publishBlockedReason(bfms, "plywood")).toBeNull();
  });
});
