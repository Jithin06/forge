import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { eligibility } from "./compute/eligibility";
import { firstVisit } from "./compute/firstVisit";
import { AUDIENCES, parseSpaceDoc, type SpaceDoc } from "./schemas";

const dir = path.join(process.cwd(), "data", "spaces");
const docs = new Map<string, SpaceDoc>();
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const r = parseSpaceDoc(JSON.parse(readFileSync(path.join(dir, f), "utf8")));
  if (!r.ok) throw new Error(`${f}: ${r.errors.join("; ")}`);
  docs.set(r.doc.id, r.doc);
}

describe("every seed file in data/spaces", () => {
  it("is valid, named after its id, and has nothing marked confirmed", () => {
    expect([...docs.keys()].sort()).toEqual(["ahmanson-lab", "bfms", "bme-innovation", "digital-creative-lab", "its-printing", "iya-hall", "roski-shops", "sda-technical-theatre-lab"]);
    for (const [id, doc] of docs) {
      expect(Object.values(doc.status).every((g) => g.state === "estimated"), id).toBe(true);
      expect(doc.source.urls.length, id).toBeGreaterThan(0);
    }
  });

  it("Ahmanson Lab and Digital Creative Lab are open to all four audiences", () => {
    for (const id of ["ahmanson-lab", "digital-creative-lab"]) {
      for (const a of AUDIENCES) expect(eligibility(docs.get(id)!, a).status, `${id} ${a}`).toBe("open");
    }
  });

  it("Ahmanson Lab lists only what its pages state: equipment, no trainings, prices or opening times", () => {
    const lab = docs.get("ahmanson-lab")!;
    expect(lab.equipment.map((e) => e.id)).toContain("ultimaker_s5");
    expect(lab.equipment.every((e) => e.required_training_ids.length === 0 && e.staff_operated === null)).toBe(true);
    expect([lab.materials, lab.trainings]).toEqual([[], []]);
    expect(lab.hours).toBeNull();
    expect(lab.hours_note).toMatch(/9 AM to 9 PM/);
    expect(lab.source.urls).toContain("https://polymathic.usc.edu/ahmanson-lab-equipment");
    expect(firstVisit(lab, [])[0]).toMatch(/^Go to Ahmanson Lab, Leavey Library, room 301\. /);
  });

  it("Digital Creative Lab lists what its ITS page lists, and no opening hours, prices or trainings", () => {
    const lab = docs.get("digital-creative-lab")!;
    expect(lab.equipment.map((e) => e.id)).toEqual(["podcast_studios", "production_studio", "dcl_plotters", "dcl_3d_printer"]);
    expect([lab.hours, lab.materials, lab.trainings]).toEqual([null, [], []]);
    expect(lab.hours_note).toMatch(/Podcast studio/);
  });

  it("what is estimated from typical practice is worded as likely or typically, and never covers hours, access or equipment", () => {
    for (const [id, doc] of docs) {
      const e = doc.estimates;
      if (!e) continue;
      expect(e.basis, id).toBe("typical for campus workshops");
      for (const line of [...e.first_visit, e.training_note, e.cost_note]) {
        if (line) expect(line, id).toMatch(/likely|typical/i);
      }
    }
    // Unknown access is never guessed open: the added school spaces are all "ask first".
    for (const id of ["iya-hall", "roski-shops", "sda-technical-theatre-lab"]) {
      for (const a of AUDIENCES) expect(eligibility(docs.get(id)!, a).status, id).toBe("ask_first");
      expect(docs.get(id)!.hours, id).toBeNull();
    }
    expect(docs.get("sda-technical-theatre-lab")!.equipment).toEqual([]);
  });

  it("every space records the official page it came from", () => {
    for (const [id, doc] of docs) expect(doc.source.urls.every((u) => /usc\.edu\//.test(u)), id).toBe(true);
  });

});
