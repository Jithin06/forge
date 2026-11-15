import { z } from "zod";
import { NO_STORE, apiError, zodMessage } from "@/lib/api";
import { MATERIAL_CATEGORIES } from "@/lib/schemas";
import { listAvailable } from "@/lib/scrap";
import { getSpaces } from "@/lib/spaces";

const query = z.object({ category: z.enum(MATERIAL_CATEGORIES).optional(), space_id: z.string().regex(/^[a-z0-9_-]+$/).optional() });

export async function GET(request: Request) {
  const parsed = query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", zodMessage(parsed.error.issues));
  const [items, spaces] = await Promise.all([listAvailable(parsed.data), getSpaces()]);
  const byId = new Map(spaces.map((s) => [s.id, s]));
  return Response.json(
    {
      items: items.map((i) => ({
        ...i,
        space_name: byId.get(i.space_id)?.name ?? i.space_id,
        space_location: byId.get(i.space_id)?.location ?? null,
        pickup_note: byId.get(i.space_id)?.scrap_policy.pickup_note ?? null,
      })),
      spaces: spaces.map((s) => ({ id: s.id, name: s.name })),
    },
    { headers: NO_STORE },
  );
}
