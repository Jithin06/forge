import { z } from "zod";

// ---------------------------------------------------------------- vocab
// SPEC.md section 5.1. Add a tag only when a real space needs it.

export const AUDIENCES = [
  "viterbi_undergrad",
  "viterbi_grad",
  "usc_undergrad_other",
  "usc_grad_other",
] as const;
export type Audience = (typeof AUDIENCES)[number];

export const EXPERIENCES = ["never", "basic_tools", "workshop"] as const;
export type Experience = (typeof EXPERIENCES)[number];

export const CAPABILITIES = [
  "fdm_3d_printing",
  "resin_3d_printing",
  "laser_cutting",
  "woodworking",
  "metalworking",
  "cnc_machining",
  "electronics",
  "hand_tools",
  "textiles",
  "video_production",
  "audio_recording",
  "photography",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const MATERIAL_CATEGORIES = [
  "pla_filament",
  "other_filament",
  "resin",
  "plywood",
  "solid_wood",
  "mdf",
  "acrylic",
  "other_plastic_sheet",
  "aluminum",
  "steel",
  "other_metal",
  "cardboard_paper",
  "foam",
  "fabric",
  "electronic_components",
  "fasteners_hardware",
  "unknown_plastic",
  "other",
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const ACCESS_STATUSES = ["open", "ask_first", "not_open"] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];

export const STATUS_GROUPS = ["hours", "access", "trainings", "equipment", "prices"] as const;
export type StatusGroup = (typeof STATUS_GROUPS)[number];

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** An enum whose error names the bad value and lists the allowed ones. */
function vocab<const T extends readonly [string, ...string[]]>(kind: string, values: T) {
  return z.enum(values, {
    error: (iss) =>
      `unknown ${kind} ${JSON.stringify(iss.input)}. Allowed: ${values.join(", ")}`,
  });
}

// ------------------------------------------------------- space document

const id = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/, "use lowercase letters, digits, - or _");
const text = z.string().trim().min(1);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "use 24-hour HH:MM");

/** null for a day means "not listed", not "closed". */
const dayHours = z.object({ open: time, close: time }).nullable();

const groupStatus = z.discriminatedUnion("state", [
  z.object({ state: z.literal("estimated") }),
  z.object({
    state: z.literal("confirmed"),
    confirmed_by: text,
    confirmed_on: z.iso.date(),
  }),
]);

export const accessEntrySchema = z.object({
  audience: vocab("audience", AUDIENCES),
  status: vocab("access status", ACCESS_STATUSES),
  note: z.string().nullable(),
});

export const trainingSchema = z.object({
  id,
  name: text,
  covers: text,
  prerequisite_ids: z.array(id),
  duration_note: z.string().nullable(),
  how_to_sign_up: z.string().nullable(),
  restricted_to: z.string().nullable(),
});

export const equipmentSchema = z.object({
  id,
  name: text,
  capability: vocab("capability", CAPABILITIES),
  plain_name: text,
  required_training_ids: z.array(id),
  staff_operated: z.boolean().nullable(),
  work_area_note: z.string().nullable(),
  good_for: z.array(text),
  not_for: z.array(text),
});

export const materialSchema = z.object({
  id,
  name: text,
  category: vocab("material category", MATERIAL_CATEGORIES),
  unit_price_usd: z.number().nonnegative().nullable(),
  price_unit: z.string().nullable(),
  /** Where the price came from, e.g. an official page, staff, or "coder estimate, unverified". */
  price_source: z.string().nullable().optional(),
  /** null means we do not know whether the space stocks it. */
  stocked: z.boolean().nullable(),
});

export const spaceDocSchema = z
  .object({
    id,
    name: text,
    school: text,
    location: text,
    official_url: z.url(),
    blurb: text,
    capabilities: z.array(vocab("capability", CAPABILITIES)).min(1),
    hours: z.record(z.enum(WEEKDAYS), dayHours).nullable(),
    access: z.array(accessEntrySchema),
    access_steps: z.array(text),
    trainings: z.array(trainingSchema),
    equipment: z.array(equipmentSchema),
    materials: z.array(materialSchema),
    services: z.array(z.object({ name: text, how_to_request: z.string().nullable() })),
    usage_fee_note: z.string().nullable(),
    prohibited: z.array(text),
    scrap_policy: z.object({
      offers_scrap: z.boolean(),
      never_offer: z.array(vocab("material category", MATERIAL_CATEGORIES)),
      pickup_note: z.string().nullable(),
    }),
    source: z.object({
      urls: z.array(z.url()).min(1),
      checked_on: z.iso.date(),
    }),
    status: z.object({
      hours: groupStatus,
      access: groupStatus,
      trainings: groupStatus,
      equipment: groupStatus,
      prices: groupStatus,
    }),
  })
  .strict()
  .superRefine((doc, ctx) => {
    // Access: exactly one entry for each of the four audiences.
    for (const audience of AUDIENCES) {
      const n = doc.access.filter((a) => a.audience === audience).length;
      if (n !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["access"],
          message:
            n === 0
              ? `missing audience "${audience}". Every space needs one access entry for each of: ${AUDIENCES.join(", ")}`
              : `audience "${audience}" appears ${n} times; list it once`,
        });
      }
    }

    const unique = (kind: string, ids: string[]) => {
      const seen = new Set<string>();
      for (const i of ids) {
        if (seen.has(i)) ctx.addIssue({ code: "custom", path: [kind], message: `duplicate id "${i}"` });
        seen.add(i);
      }
      return seen;
    };
    const trainingIds = unique("trainings", doc.trainings.map((t) => t.id));
    unique("equipment", doc.equipment.map((e) => e.id));
    unique("materials", doc.materials.map((m) => m.id));

    doc.trainings.forEach((t, i) =>
      t.prerequisite_ids.forEach((p) => {
        if (!trainingIds.has(p))
          ctx.addIssue({
            code: "custom",
            path: ["trainings", i, "prerequisite_ids"],
            message: `prerequisite "${p}" is not a training in this space`,
          });
      }),
    );
    doc.equipment.forEach((e, i) => {
      e.required_training_ids.forEach((t) => {
        if (!trainingIds.has(t))
          ctx.addIssue({
            code: "custom",
            path: ["equipment", i, "required_training_ids"],
            message: `training "${t}" is not a training in this space`,
          });
      });
      if (!doc.capabilities.includes(e.capability))
        ctx.addIssue({
          code: "custom",
          path: ["equipment", i, "capability"],
          message: `"${e.capability}" is not in this space's capabilities`,
        });
    });
  });

export type SpaceDoc = z.infer<typeof spaceDocSchema>;
export type Training = z.infer<typeof trainingSchema>;
export type Equipment = z.infer<typeof equipmentSchema>;
export type Material = z.infer<typeof materialSchema>;
export type GroupStatus = SpaceDoc["status"][StatusGroup];

/** One readable line per problem: `access: missing audience "viterbi_grad" ...` */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((iss) => {
    const path = iss.path.length ? iss.path.join(".") : "(document)";
    return `${path}: ${iss.message}`;
  });
}

export type ParseResult = { ok: true; doc: SpaceDoc } | { ok: false; errors: string[] };

export function parseSpaceDoc(input: unknown): ParseResult {
  const r = spaceDocSchema.safeParse(input);
  return r.success ? { ok: true, doc: r.data } : { ok: false, errors: formatIssues(r.error) };
}

// ------------------------------------------------------ API helpers

export const audienceParam = vocab("audience", AUDIENCES);
export const capabilityParam = vocab("capability", CAPABILITIES);
