import { describe, expect, it } from "vitest";
import { AUDIENCES, parseSpaceDoc, type SpaceDoc } from "../schemas";
import { SEED_DOCS } from "../test-fixtures";
import { eligibility, eligibilityRank } from "./eligibility";

function seed(id: string): SpaceDoc {
  for (const raw of SEED_DOCS) {
    const r = parseSpaceDoc(raw);
    if (r.ok && r.doc.id === id) return r.doc;
  }
  throw new Error(`no seed ${id}`);
}

const mixed: Pick<SpaceDoc, "access"> = {
  access: [
    { audience: "viterbi_undergrad", status: "open", note: null },
    { audience: "viterbi_grad", status: "ask_first", note: "Email the manager" },
    { audience: "usc_undergrad_other", status: "not_open", note: "Viterbi only" },
    { audience: "usc_grad_other", status: "not_open", note: null },
  ],
};

describe("eligibility", () => {
  it("returns each of the four audiences' own entry", () => {
    expect(eligibility(mixed, "viterbi_undergrad")).toEqual({ status: "open", note: null });
    expect(eligibility(mixed, "viterbi_grad")).toEqual({ status: "ask_first", note: "Email the manager" });
    expect(eligibility(mixed, "usc_undergrad_other")).toEqual({ status: "not_open", note: "Viterbi only" });
    expect(eligibility(mixed, "usc_grad_other")).toEqual({ status: "not_open", note: null });
  });

  it("BME Innovation Space: ask first for Viterbi, not open for others", () => {
    const bme = seed("bme-innovation");
    expect(AUDIENCES.map((a) => [a, eligibility(bme, a).status])).toEqual([
      ["viterbi_undergrad", "ask_first"],
      ["viterbi_grad", "ask_first"],
      ["usc_undergrad_other", "not_open"],
      ["usc_grad_other", "not_open"],
    ]);
    for (const a of AUDIENCES) expect(eligibility(bme, a).note).toBe("BME-affiliated only");
  });

  it("Maker Space: open to Viterbi undergraduates, ask first for everyone else", () => {
    const bfms = seed("bfms");
    expect(AUDIENCES.map((a) => eligibility(bfms, a).status)).toEqual(["open", "ask_first", "ask_first", "ask_first"]);
    expect(eligibility(bfms, "viterbi_grad").note).toMatch(/ask staff about graduate access/);
  });

  it("falls back to ask first, never open, when an audience is missing", () => {
    expect(eligibility({ access: [] }, "viterbi_undergrad")).toEqual({ status: "ask_first", note: null });
  });

  it("ranks open before ask first before not open", () => {
    const sorted = (["not_open", "open", "ask_first"] as const)
      .slice()
      .sort((x, y) => eligibilityRank(x) - eligibilityRank(y));
    expect(sorted).toEqual(["open", "ask_first", "not_open"]);
  });
});
