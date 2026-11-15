import { describe, expect, it } from "vitest";
import { parseSpaceDoc } from "./schemas";
import { SEED_DOCS, clone } from "./test-fixtures";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

describe("space document schema", () => {
  it("accepts every seed file", () => {
    for (const raw of SEED_DOCS) {
      const r = parseSpaceDoc(raw);
      expect(r.ok ? [] : r.errors).toEqual([]);
    }
  });

  it("rejects an unknown capability tag and names it", () => {
    const doc: Raw = clone(SEED_DOCS[0]);
    doc.capabilities.push("glassblowing");
    const r = parseSpaceDoc(doc);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.join("\n")).toMatch(/capabilities\.\d+: unknown capability "glassblowing"\. Allowed: fdm_3d_printing/);
    }
  });

  it("rejects an unknown material category", () => {
    const doc: Raw = clone(SEED_DOCS[0]);
    doc.materials[0].category = "unobtainium";
    const r = parseSpaceDoc(doc);
    expect(!r.ok && r.errors.join("\n")).toMatch(/materials\.0\.category: unknown material category "unobtainium"/);
  });

  it("rejects a document missing an audience and names it", () => {
    const doc: Raw = clone(SEED_DOCS[0]);
    doc.access = doc.access.filter((a: Raw) => a.audience !== "usc_grad_other");
    const r = parseSpaceDoc(doc);
    expect(!r.ok && r.errors.join("\n")).toMatch(/access: missing audience "usc_grad_other"/);
  });

  it("rejects an audience listed twice", () => {
    const doc: Raw = clone(SEED_DOCS[0]);
    doc.access.push({ ...doc.access[0] });
    const r = parseSpaceDoc(doc);
    expect(!r.ok && r.errors.join("\n")).toMatch(/audience "viterbi_undergrad" appears 2 times/);
  });

  it("rejects equipment that needs a training the space does not have", () => {
    const doc: Raw = clone(SEED_DOCS[0]);
    doc.equipment[0].required_training_ids = ["level_9"];
    const r = parseSpaceDoc(doc);
    expect(!r.ok && r.errors.join("\n")).toMatch(/training "level_9" is not a training in this space/);
  });

  it("rejects keys that are not in the spec", () => {
    const doc: Raw = clone(SEED_DOCS[0]);
    doc.rating = 5;
    expect(parseSpaceDoc(doc).ok).toBe(false);
  });

  it("requires confirmed_by and confirmed_on when a group is confirmed", () => {
    const doc: Raw = clone(SEED_DOCS[0]);
    doc.status.prices = { state: "confirmed" };
    expect(parseSpaceDoc(doc).ok).toBe(false);
    doc.status.prices = { state: "confirmed", confirmed_by: "staff@usc.edu", confirmed_on: "2026-11-14" };
    expect(parseSpaceDoc(doc).ok).toBe(true);
  });
});
