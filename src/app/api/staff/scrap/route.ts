import { scrapListingSchema } from "@/lib/ai/schemas";
import { NO_STORE, apiError, readJson, zodMessage } from "@/lib/api";
import { requireStaff } from "@/lib/auth";
import { publishBlockedReason, withRequiredRestrictions } from "@/lib/compute/scrapRules";
import { db } from "@/lib/db";
import { SCRAP_COLUMNS, uploadScrapPhoto } from "@/lib/scrap";
import { getSpace } from "@/lib/spaces";

/** Publish a listing that staff have reviewed. */
export async function POST(request: Request) {
  const raw = (await readJson(request)) as { space_id?: string } | undefined;
  const staff = await requireStaff(typeof raw?.space_id === "string" ? raw.space_id : null);
  if (staff instanceof Response) return staff;
  const parsed = scrapListingSchema.safeParse(raw);
  if (!parsed.success) return apiError(400, "BAD_REQUEST", zodMessage(parsed.error.issues));
  const listing = parsed.data;
  const space = await getSpace(listing.space_id);
  if (!space) return apiError(400, "BAD_REQUEST", "No space with that id.");

  const blocked = publishBlockedReason(space, listing.material_category);
  if (blocked) return apiError(400, "CATEGORY_NOT_ALLOWED", blocked);

  const photo_url = await uploadScrapPhoto(space.id, listing.image);
  const { data, error } = await db()
    .from("scrap_items")
    .insert({
      space_id: space.id,
      material_category: listing.material_category,
      title: listing.title,
      description: listing.description,
      size_note: listing.size_note,
      condition: listing.condition,
      restrictions: withRequiredRestrictions(listing.material_category, listing.restrictions),
      photo_url,
      posted_by: staff.email,
    })
    .select(SCRAP_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return Response.json({ item: data }, { status: 201, headers: NO_STORE });
}

/** The space's own items that are not yet finished, for the staff portal. */
export async function GET(request: Request) {
  const spaceId = new URL(request.url).searchParams.get("space_id");
  const staff = await requireStaff(spaceId);
  if (staff instanceof Response) return staff;
  const { data, error } = await db()
    .from("scrap_items")
    .select(SCRAP_COLUMNS)
    .eq("space_id", spaceId!)
    .in("status", ["available", "reserved"])
    .order("posted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return Response.json({ items: data }, { headers: NO_STORE });
}
