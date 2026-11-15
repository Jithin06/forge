import { describe, expect, it } from "vitest";
import { publicSpace, isTestAccount } from "./public-space";
import { sameUnit } from "./compute/cost";
import { seedSpaces } from "./test-fixtures";

const REAL = "pat.staff@usc.edu";
const TEST = "forge-test-staff@usc.edu";
const confirmedBy = (email: string) => {
  const doc = seedSpaces().find((s) => s.id === "bfms")!;
  doc.status.equipment = { state: "confirmed", confirmed_by: email, confirmed_on: "2026-11-14" };
  doc.materials[0].price_source = `staff (${email})`;
  return doc;
};

describe("what leaves the server about a space", () => {
  it("never says who confirmed anything: only the state and the date", () => {
    for (const mode of ["test", "google"] as const) {
      for (const email of [REAL, TEST]) {
        const out = JSON.stringify(publicSpace(confirmedBy(email), mode));
        expect(out, `${mode} ${email}`).not.toContain("confirmed_by");
        expect(out, `${mode} ${email}`).not.toContain(email);
        expect(out, `${mode} ${email}`).not.toMatch(/@usc\.edu/); // no address of any kind in the Maker Space document
      }
    }
    const real = publicSpace(confirmedBy(REAL), "google");
    expect(real.status.equipment).toEqual({ state: "confirmed", confirmed_on: "2026-11-14" });
    expect(real.materials[0].price_source).toBe("staff");
  });

  it("a real staff confirmation shows as confirmed in both modes, and is not marked as a test", () => {
    for (const mode of ["test", "google"] as const) {
      expect(publicSpace(confirmedBy(REAL), mode).status.equipment).toEqual({ state: "confirmed", confirmed_on: "2026-11-14" });
    }
  });

  it("test sign-in on: a test account's confirmation reads 'Test confirmation'", () => {
    expect(publicSpace(confirmedBy(TEST), "test").status.equipment).toEqual({ state: "confirmed", confirmed_on: "2026-11-14", test: true });
  });

  it("test sign-in off: a test account's confirmation is ignored and the group shows as estimated", () => {
    const out = publicSpace(confirmedBy(TEST), "google");
    expect(out.status.equipment).toEqual({ state: "estimated" });
    expect(out.status.hours).toEqual({ state: "estimated" });
  });

  it("does not change the stored document", () => {
    const doc = confirmedBy(TEST);
    publicSpace(doc, "google");
    expect(doc.status.equipment).toMatchObject({ state: "confirmed", confirmed_by: TEST });
  });

  it("knows the test accounts", () => {
    expect([TEST, "forge-test-student@usc.edu", "forge-test@example.com"].every(isTestAccount)).toBe(true);
    expect([REAL, "forge@usc.edu", "", null].some(isTestAccount)).toBe(false);
  });
});

describe("units", () => {
  it("treats common spellings of the same unit as equal, and different units as different", () => {
    expect(sameUnit("cubic inch", "cubic inches")).toBe(true);
    expect(sameUnit("cubic inch", "in³")).toBe(true);
    expect(sameUnit("cubic centimeter", "cm3")).toBe(true);
    expect(sameUnit("inch", "inches")).toBe(true);
    expect(sameUnit("cubic inch", "cubic centimeter")).toBe(false);
    expect(sameUnit("inch", "cubic inch")).toBe(false);
    expect(sameUnit("g", "kg")).toBe(false);
  });
});
