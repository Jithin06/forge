import { z } from "zod";
import { invalidateSpaceContext } from "@/lib/ai/prompts";
import { NO_STORE, apiError, readJson, zodMessage } from "@/lib/api";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUS_GROUPS, accessEntrySchema, parseSpaceDoc, spaceDocSchema } from "@/lib/schemas";
import { authMode } from "@/lib/auth";
import { publicSpace } from "@/lib/public-space";
import { getSpaceRaw } from "@/lib/spaces";

const body = z
  .object({
    hours: spaceDocSchema.shape.hours.optional(),
    access: z.array(accessEntrySchema).optional(),
    prices: z
      .array(z.object({ material_id: z.string(), unit_price_usd: z.number().nonnegative().nullable(), price_unit: z.string().trim().max(30).nullable().optional() }))
      .optional(),
    confirm: z.enum(STATUS_GROUPS).optional(),
  })
  .strict()
  .refine((b) => Object.values(b).filter((v) => v !== undefined).length === 1, "Send exactly one of hours, access, prices or confirm.");

/** Today's date on campus (Los Angeles), as YYYY-MM-DD. */
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());

/**
 * Staff keep their own space's facts current (rule 5.3.5), and press Confirm
 * on a group of facts to turn "Estimated" into "Confirmed by staff".
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/staff/space/[id]">) {
  const { id } = await ctx.params;
  const staff = await requireStaff(id);
  if (staff instanceof Response) return staff;
  const parsed = body.safeParse(await readJson(request));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", zodMessage(parsed.error.issues));
  const space = await getSpaceRaw(id);
  if (!space) return apiError(404, "NOT_FOUND", "No space with that id.");

  const next = structuredClone(space);
  const b = parsed.data;
  if (b.hours !== undefined) next.hours = b.hours;
  if (b.access) next.access = b.access;
  if (b.prices) {
    for (const p of b.prices) {
      const m = next.materials.find((x) => x.id === p.material_id);
      if (!m) return apiError(400, "BAD_REQUEST", `prices: "${p.material_id}" is not a material at this space.`);
      const changed = m.unit_price_usd !== p.unit_price_usd || (p.price_unit !== undefined && p.price_unit !== m.price_unit);
      m.unit_price_usd = p.unit_price_usd;
      if (p.price_unit !== undefined) m.price_unit = p.price_unit;
      if (changed) m.price_source = `staff (${staff.email})`;
    }
  }
  if (b.confirm) next.status[b.confirm] = { state: "confirmed", confirmed_by: staff.email, confirmed_on: today() };

  // Every write is validated against the full schema (section 5.2).
  const valid = parseSpaceDoc(next);
  if (!valid.ok) return apiError(400, "BAD_REQUEST", valid.errors.join("; "));

  const { error } = await db().from("spaces").update({ doc: valid.doc, updated_at: new Date().toISOString(), updated_by: staff.email }).eq("id", id);
  if (error) throw new Error(error.message);
  invalidateSpaceContext();
  return Response.json({ space: publicSpace(valid.doc, authMode()) }, { headers: NO_STORE });
}
