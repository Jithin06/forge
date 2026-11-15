import { describe, expect, it } from "vitest";
import { EXPERIENCE_FOR_MODEL } from "./ai/prompts";
import { AUDIENCE_LABELS, EXPERIENCE_LABELS } from "./labels";

describe("chip labels", () => {
  it('each audience completes the sentence "I am a..."', () => {
    expect(AUDIENCE_LABELS.viterbi_undergrad).toBe("Viterbi undergraduate");
    expect(AUDIENCE_LABELS.viterbi_grad).toBe("Viterbi graduate");
    expect(AUDIENCE_LABELS.usc_undergrad_other).toBe("USC undergraduate (not Viterbi)");
    expect(AUDIENCE_LABELS.usc_grad_other).toBe("USC graduate (not Viterbi)");
    expect(Object.values(AUDIENCE_LABELS).some((l) => /^Other/.test(l))).toBe(false);
  });
  it('the third experience chip reads "Worked in a workshop"', () => {
    expect(EXPERIENCE_LABELS.workshop).toBe("Worked in a workshop");
  });
  it("rewording a chip does not change what the model is told", () => {
    expect(EXPERIENCE_FOR_MODEL).toEqual({ never: "Never built anything", basic_tools: "Used basic tools", workshop: "Comfortable in a workshop" });
  });
});
