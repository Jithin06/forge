import { describe, expect, it } from "vitest";
import { isSample, SAMPLE_LINE } from "@/lib/sample";
import { SCRAP_TOTAL_NOTE, costStub } from "./cost-stub";

const priced = { total: { low: 12, high: 12 }, typical_from: null, prices_estimated: true };

describe("the cost stub never shows a with-scrap dollar figure", () => {
  it("shows the price new, and a sentence instead of a lower total, when a free piece matches", () => {
    const s = costStub(priced, true)!;
    expect(s.figure).toBe("$12");
    expect(s.label).toBe("Materials, about");
    expect(s.notes).toEqual(["Estimated prices", SCRAP_TOTAL_NOTE]);
    expect(JSON.stringify(s)).not.toMatch(/\$0|With free scrap/);
  });
  it("says nothing about scrap when no piece matches", () => {
    expect(costStub(priced, false)!.notes).toEqual(["Estimated prices"]);
  });
  it("keeps the bring-your-own wording where the space sells no material", () => {
    const s = costStub({ total: { low: 12, high: 12 }, typical_from: "typical price if you buy it yourself", bring_your_own: true, prices_estimated: true }, true)!;
    expect(s.label).toBe("Bring your own material. To buy it, about");
    expect(s.notes).toEqual([SCRAP_TOTAL_NOTE]);
  });
  it("has no figure at all when nothing is priced", () => {
    expect(costStub({ total: null, typical_from: null, prices_estimated: true }, true)).toBeNull();
  });
  it("the sentence is the agreed one", () => {
    expect(SCRAP_TOTAL_NOTE).toBe("Could cost less with free scrap. Check the piece is big enough.");
  });
});

describe("sample items", () => {
  it("are told by the sentence that ends their description", () => {
    expect(isSample(`A small piece of plywood. ${SAMPLE_LINE}`)).toBe(true);
    expect(isSample("A small piece of plywood.")).toBe(false);
    expect(isSample(null)).toBe(false);
  });
});
