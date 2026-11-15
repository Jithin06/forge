import "server-only";
import { groundPlan } from "../compute/grounding";
import type { Experience, SpaceDoc } from "../schemas";
import { AIError, callTool, type ToolResult } from "./client";
import { parseImage } from "./image";
import { ideaMessage, planSystem, spaceContext } from "./prompts";
import { describeAnswers } from "./questions";
import { planOutputSchema, type Answers, type PlanOutput } from "./schemas";

export type PlanBuildResult = {
  model: PlanOutput;
  spaces: SpaceDoc[];
  usage: { input_tokens: number; output_tokens: number };
  attempts: number;
  fixture: boolean;
};

type Caller = (req: Parameters<typeof callTool<PlanOutput>>[0]) => Promise<ToolResult<PlanOutput>>;

/**
 * Ask the model for routes, then validate (zod) and ground (ids exist and
 * belong together, no dollar amounts). On failure, retry once with the
 * specific problems appended; if that fails too, throw a clean error.
 *
 * The student's audience is deliberately not sent: eligibility is code's job,
 * so the same idea yields the same routes for every audience.
 */
export async function planBuild(
  input: { text: string; answers: Answers; experience: Experience; image?: string },
  deps: { call?: Caller; context?: () => Promise<{ spaces: SpaceDoc[]; json: string }> } = {},
): Promise<PlanBuildResult> {
  const call = deps.call ?? callTool<PlanOutput>;
  const { spaces, json } = await (deps.context ?? spaceContext)();
  const image = parseImage(input.image);
  const answersText = describeAnswers(input.answers);
  const key = {
    text: input.text.trim(),
    experience: input.experience,
    answers: input.answers,
    image: image?.sha256 ?? null,
  };
  const base = ideaMessage({ text: input.text, experience: input.experience, answers: answersText, hasImage: !!image });

  const usage = { input_tokens: 0, output_tokens: 0 };
  let feedback: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    let res: ToolResult<PlanOutput>;
    try {
      res = await call({
        call: "plan",
        system: planSystem(json),
        messages: [
          {
            role: "user",
            content: feedback.length
              ? `${base}\n\nYour previous answer had these problems. Fix them:\n- ${feedback.join("\n- ")}`
              : base,
          },
        ],
        image: image ? { mediaType: image.mediaType, base64: image.base64 } : undefined,
        tool: { name: "plan_build", description: "Plan how the student can build their idea at USC" },
        schema: planOutputSchema,
        fixtureKey: attempt === 1 ? key : { ...key, retry: feedback },
      });
    } catch (e) {
      if (e instanceof AIError && e.code === "INVALID_OUTPUT" && attempt === 1) {
        feedback = e.details;
        console.warn(`plan retry, the answer did not match the expected shape: ${feedback.join("; ")}`);
        continue;
      }
      throw e;
    }
    usage.input_tokens += res.usage.input_tokens;
    usage.output_tokens += res.usage.output_tokens;

    const grounded = groundPlan(res.input, spaces);
    if (grounded.ok) return { model: res.input, spaces, usage, attempts: attempt, fixture: res.fixture };
    if (attempt === 2) {
      throw new AIError("INVALID_OUTPUT", "The plan referred to things that are not in the space data.", grounded.errors);
    }
    feedback = grounded.errors;
    console.warn(`plan retry, grounding failed: ${feedback.join("; ")}`);
  }
  throw new AIError("INVALID_OUTPUT", "unreachable");
}
