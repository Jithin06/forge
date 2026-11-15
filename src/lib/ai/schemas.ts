import { z } from "zod";
import { AUDIENCES, CAPABILITIES, EXPERIENCES, MATERIAL_CATEGORIES } from "../schemas";
import { QUESTION_IDS, isValidAnswer, type QuestionId } from "./questions";

// ------------------------------------------------------- model outputs
// What the model may return. Code checks every field before use.

export const askOutputSchema = z.object({
  summary: z.string().min(1).max(300).describe("One sentence restating the idea in plain words"),
  question_ids: z
    .array(z.enum(QUESTION_IDS))
    .max(3)
    .describe("Questions from the bank whose answers would change the route or cost. Empty if the text already covers them"),
  prefilled: z
    .array(z.object({ question_id: z.enum(QUESTION_IDS), option_ids: z.array(z.string()).min(1) }))
    .describe("Answers already clear from the text, using option ids from the bank"),
  blocked_reason: z
    .string()
    .nullable()
    .describe("Set only if the idea is a weapon or weapon part, or is prohibited at every space. Otherwise null"),
});
export type AskOutput = z.infer<typeof askOutputSchema>;

const routeSchema = z.object({
  space_id: z.string().describe("A space id from the space documents"),
  equipment_ids: z.array(z.string()).max(6).describe("Equipment ids that belong to that space"),
  process: z.string().min(1).max(300).describe('Plain words, e.g. "Cut flat pieces from plywood and slot them together"'),
  fit_reason: z.string().min(1).max(400).describe("Two sentences at most: why this route suits this project and this student"),
  materials: z
    .array(
      z.object({
        category: z.enum(MATERIAL_CATEGORIES),
        material_id: z.string().nullable().describe("A material id from that space, or null if the space lists none that fits"),
        quantity_low: z.number().positive(),
        quantity_high: z.number().positive(),
        unit: z.string().min(1).describe("Use the material's price_unit when it has one"),
      }),
    )
    .max(5),
  steps: z.array(z.object({ title: z.string().min(1).max(80), detail: z.string().min(1).max(400) })).min(3).max(5),
  warnings: z.array(z.object({ issue: z.string().min(1).max(200), fix: z.string().min(1).max(300) })).max(3),
});

export const planOutputSchema = z
  .object({
    summary: z.string().min(1).max(300).describe("One sentence: what the student is making"),
    needs: z.array(z.object({ capability: z.enum(CAPABILITIES), why: z.string().min(1).max(200) })).max(5),
    routes: z.array(routeSchema).max(3).describe("1 to 3 real ways to build it"),
    clarifying_question: z.string().nullable().describe("Only if nothing useful can be said without it"),
    not_supported_reason: z.string().nullable().describe("When no space fits"),
  })
  .superRefine((p, ctx) => {
    if (p.routes.length === 0 && !p.clarifying_question && !p.not_supported_reason) {
      ctx.addIssue({ code: "custom", path: ["routes"], message: "give 1 to 3 routes, or a clarifying_question or not_supported_reason" });
    }
    p.routes.forEach((r, i) =>
      r.materials.forEach((m, j) => {
        if (m.quantity_high < m.quantity_low)
          ctx.addIssue({ code: "custom", path: ["routes", i, "materials", j], message: "quantity_high is below quantity_low" });
      }),
    );
  });
export type PlanOutput = z.infer<typeof planOutputSchema>;
export type ModelRoute = PlanOutput["routes"][number];

// --------------------------------------------------------- API bodies

const MAX_IMAGE_CHARS = 3_000_000; // about 2.2 MB of JPEG after base64
export const imageSchema = z
  .string()
  .max(MAX_IMAGE_CHARS, "Photo is too large. Try a smaller one.")
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Photo must be a JPEG, PNG or WebP image");

const ideaText = z
  .string()
  .trim()
  .min(10, "Tell us a bit more. One sentence is enough.")
  .max(1500, "Please keep it under 1,500 characters.");

export const askBodySchema = z.object({
  text: ideaText,
  experience: z.enum(EXPERIENCES),
  image: imageSchema.optional(),
});

export const answersSchema = z
  .partialRecord(z.enum(QUESTION_IDS), z.array(z.string()).max(6))
  .superRefine((answers, ctx) => {
    for (const [qid, opts] of Object.entries(answers)) {
      if (!isValidAnswer(qid as QuestionId, opts ?? []))
        ctx.addIssue({ code: "custom", path: [qid], message: "not a valid answer for this question" });
    }
  });
export type Answers = z.infer<typeof answersSchema>;

export const planBodySchema = z.object({
  text: ideaText,
  answers: answersSchema,
  audience: z.enum(AUDIENCES),
  experience: z.enum(EXPERIENCES),
  image: imageSchema.optional(),
});
export type PlanBody = z.infer<typeof planBodySchema>;
