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
    expect([...docs.keys()].sort()).toEqual(["ahmanson-lab", "bfms", "bme-innovation", "digital-creative-lab"]);
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

  it("Ahmanson Lab lists no equipment or capabilities, only what its page states", () => {
    const lab = docs.get("ahmanson-lab")!;
    expect([lab.capabilities, lab.equipment, lab.materials, lab.trainings]).toEqual([[], [], [], []]);
    expect(lab.hours).toBeNull();
    expect(lab.hours_note).toMatch(/9 AM to 9 PM/);
    expect(lab.services.map((s) => s.how_to_request)).toEqual(["Contact lvy@usc.edu", "Contact lvy@usc.edu"]);
    expect(firstVisit(lab, [])[0]).toBe("Go to Ahmanson Lab, Leavey Library, room 301. The official page lists 9 AM to 9 PM and does not say which days.");
  });

  it("Digital Creative Lab lists podcast studios and no hours, prices or trainings", () => {
    const lab = docs.get("digital-creative-lab")!;
    expect(lab.capabilities).toEqual(["audio_recording"]);
    expect(lab.equipment.map((e) => e.id)).toEqual(["podcast_studios"]);
    expect([lab.hours, lab.materials, lab.trainings]).toEqual([null, [], []]);
  });
});
