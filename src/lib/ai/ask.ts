import "server-only";
import type { Experience } from "../schemas";
import { AIError, callTool } from "./client";
import { parseImage } from "./image";
import { askSystem, ideaMessage, spaceContext } from "./prompts";
import { QUESTIONS, isValidAnswer, type Question, type QuestionId } from "./questions";
import { askOutputSchema } from "./schemas";

export type AskResult =
  | { blocked_reason: string; summary: string; usage: Usage; fixture: boolean }
  | {
      blocked_reason: null;
      summary: string;
      questions: Question[];
      prefilled: Partial<Record<QuestionId, string[]>>;
      usage: Usage;
      fixture: boolean;
    };
type Usage = { input_tokens: number; output_tokens: number };

export async function askFollowUps(
  input: { text: string; experience: Experience; image?: string },
  deps: { context?: () => Promise<{ json: string }> } = {},
): Promise<AskResult> {
  const { json } = await (deps.context ?? spaceContext)();
  const image = parseImage(input.image);
  const key = { text: input.text.trim(), experience: input.experience, image: image?.sha256 ?? null };
  const system = askSystem(json);
  const base = ideaMessage({ text: input.text, experience: input.experience, hasImage: !!image });

  const usage: Usage = { input_tokens: 0, output_tokens: 0 };
  let feedback: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await callTool({
        call: "ask",
        system,
        messages: [{ role: "user", content: feedback.length ? `${base}\n\nYour previous answer had problems:\n- ${feedback.join("\n- ")}` : base }],
        image: image ? { mediaType: image.mediaType, base64: image.base64 } : undefined,
        tool: { name: "choose_follow_ups", description: "Choose follow-up questions for this idea" },
        schema: askOutputSchema,
        fixtureKey: attempt === 1 ? key : { ...key, retry: feedback },
      });
      usage.input_tokens += res.usage.input_tokens;
      usage.output_tokens += res.usage.output_tokens;
      const out = res.input;

      if (out.blocked_reason) {
        return { blocked_reason: out.blocked_reason, summary: out.summary, usage, fixture: res.fixture };
      }
      // Code keeps only valid, unique questions and valid prefilled answers.
      const ids = [...new Set(out.question_ids)].slice(0, 3);
      const prefilled: Partial<Record<QuestionId, string[]>> = {};
      for (const p of out.prefilled) {
        if (isValidAnswer(p.question_id, p.option_ids)) prefilled[p.question_id] = p.option_ids;
      }
      return {
        blocked_reason: null,
        summary: out.summary,
        questions: ids.filter((q) => !prefilled[q]).map((q) => QUESTIONS[q]),
        prefilled,
        usage,
        fixture: res.fixture,
      };
    } catch (e) {
      if (e instanceof AIError && e.code === "INVALID_OUTPUT" && attempt === 1) {
        feedback = e.details;
        console.warn(`ask retry, the answer did not match the expected shape: ${feedback.join("; ")}`);
        continue;
      }
      throw e;
    }
  }
  throw new AIError("INVALID_OUTPUT", "unreachable");
}
