import { describe, expect, it, vi } from "vitest";
import { planFixture, seedSpaces, PLAN_FIXTURES } from "../test-fixtures";
import { AIError, type ToolResult } from "./client";
import { missedSpaces } from "../compute/grounding";
import { planBuild } from "./plan";
import { isValidAnswer } from "./questions";
import type { PlanOutput } from "./schemas";

const context = async () => ({ spaces: seedSpaces(), json: "[]" });
const input = { text: "An engraved acrylic sign for my club", answers: {}, experience: "never" as const };
const reply = (model: PlanOutput): ToolResult<PlanOutput> => ({
  input: model,
  usage: { input_tokens: 0, output_tokens: 0 },
  provider: "fixture",
  fixture: true,
});
type Fn = (req: { messages: { content: string }[] }) => Promise<ToolResult<PlanOutput>>;
const wrongSpace = () => {
  const p = planFixture("club-sign");
  p.routes[0].equipment_ids = ["bme_laser"]; // BME equipment under the Maker Space
  return p;
};

describe("planBuild retry", () => {
  it("wrong-space equipment causes exactly one retry, then a clean error", async () => {
    const call = vi.fn<Fn>(async () => reply(wrongSpace()));
    const err = await planBuild(input, { call, context }).catch((e) => e);
    expect(call).toHaveBeenCalledTimes(2);
    expect(err).toBeInstanceOf(AIError);
    expect(err.code).toBe("INVALID_OUTPUT");
    expect(err.details).toEqual(['routes[0]: equipment "bme_laser" belongs to space "bme-innovation", not "bfms"']);
  });

  it("the retry tells the model exactly what was wrong", async () => {
    const call = vi.fn<Fn>(async () => reply(wrongSpace()));
    await planBuild(input, { call, context }).catch(() => {});
    const second = call.mock.calls[1][0].messages[0].content;
    expect(second).toContain('equipment "bme_laser" belongs to space "bme-innovation", not "bfms"');
    expect(call.mock.calls[0][0].messages[0].content).not.toContain("previous answer");
  });

  it("a corrected second answer is accepted", async () => {
    const call = vi.fn().mockResolvedValueOnce(reply(wrongSpace())).mockResolvedValueOnce(reply(planFixture("club-sign")));
    const r = await planBuild(input, { call, context });
    expect(r.attempts).toBe(2);
    expect(r.model.routes[0].equipment_ids).toEqual(["laser_vls675"]);
  });

  it("does not send the audience to the model", async () => {
    const call = vi.fn<Fn>(async () => reply(planFixture("club-sign")));
    await planBuild(input, { call, context });
    const sent = JSON.stringify(call.mock.calls[0][0]);
    expect(sent).not.toMatch(/viterbi_undergrad|usc_grad_other|audience/i);
  });
});

describe("a space with the same equipment was passed over", () => {
  const live = (model: PlanOutput): ToolResult<PlanOutput> => ({ ...reply(model), provider: "gemini", fixture: false });
  const withBme = () => {
    const p = planFixture("club-sign");
    p.routes.push({ ...p.routes[0], space_id: "bme-innovation", equipment_ids: ["bme_laser"], materials: [{ ...p.routes[0].materials[0], material_id: null }] });
    p.single_route_reason = null;
    return p;
  };

  it("names the space that also has a laser cutter", () => {
    expect(missedSpaces(planFixture("club-sign"), seedSpaces())).toEqual([expect.stringMatching(/^space "bme-innovation" also lists equipment for laser_cutting/)]);
    expect(missedSpaces(withBme(), seedSpaces())).toEqual([]);
  });

  it("the model is asked once to look again, and its second answer stands", async () => {
    const call = vi.fn().mockResolvedValueOnce(live(planFixture("club-sign"))).mockResolvedValueOnce(live(withBme()));
    const r = await planBuild(input, { call, context });
    expect(call).toHaveBeenCalledTimes(2);
    expect(call.mock.calls[1][0].messages[0].content).toContain("Who may use a space is never a reason");
    expect(r.model.routes.map((x) => x.space_id)).toEqual(["bfms", "bme-innovation"]);
  });

  it("if it still gives one route, that is accepted without a third call", async () => {
    const call = vi.fn<Fn>(async () => live(planFixture("club-sign")));
    const r = await planBuild(input, { call, context });
    expect(call).toHaveBeenCalledTimes(2);
    expect(r.model.routes).toHaveLength(1);
  });

  it("if the second answer is broken, the valid first answer is kept", async () => {
    const call = vi.fn().mockResolvedValueOnce(live(planFixture("club-sign"))).mockResolvedValueOnce(live(wrongSpace()));
    const r = await planBuild(input, { call, context });
    expect(r.model.routes[0].equipment_ids).toEqual(["laser_vls675"]);
  });
});

describe("fixture output", () => {
  it("raw output for every plan fixture contains no dollar amounts", () => {
    for (const [name, f] of Object.entries(PLAN_FIXTURES)) {
      expect(JSON.stringify((f as { output: unknown }).output), name).not.toMatch(/\$|dollar|usd/i);
    }
  });
});

describe("question bank", () => {
  it("accepts only listed options, one unless the question allows several", () => {
    expect(isValidAnswer("size", ["hand"])).toBe(true);
    expect(isValidAnswer("size", ["hand", "shoebox"])).toBe(false);
    expect(isValidAnswer("demands", ["weight", "outdoors"])).toBe(true);
    expect(isValidAnswer("size", ["enormous"])).toBe(false);
    expect(isValidAnswer("quantity", ["not_sure"])).toBe(true);
  });
});
