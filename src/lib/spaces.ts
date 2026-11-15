import "server-only";
import { db } from "./db";
import { parseSpaceDoc, type SpaceDoc } from "./schemas";

/** Every stored space that passes validation. Invalid ones are logged and left out. */
export async function getSpaces(): Promise<SpaceDoc[]> {
  const { data, error } = await db().from("spaces").select("id, doc").order("id");
  if (error) throw new Error(`Could not load spaces: ${error.message}`);
  const docs: SpaceDoc[] = [];
  for (const row of data) {
    const r = parseSpaceDoc(row.doc);
    if (r.ok) docs.push(r.doc);
    else console.error(`Space ${row.id} failed validation:\n  ${r.errors.join("\n  ")}`);
  }
  return docs.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSpace(id: string): Promise<SpaceDoc | null> {
  const { data, error } = await db().from("spaces").select("doc").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load space ${id}: ${error.message}`);
  if (!data) return null;
  const r = parseSpaceDoc(data.doc);
  if (!r.ok) {
    console.error(`Space ${id} failed validation:\n  ${r.errors.join("\n  ")}`);
    return null;
  }
  return r.doc;
}

export type ScrapCard = {
  id: string;
  title: string;
  material_category: string;
  size_note: string | null;
  condition: string;
  photo_url: string | null;
};

/** Available scrap for one space. Never cached: availability changes. */
export async function getAvailableScrap(spaceId: string): Promise<ScrapCard[]> {
  const { data, error } = await db()
    .from("scrap_items")
    .select("id, title, material_category, size_note, condition, photo_url")
    .eq("space_id", spaceId)
    .eq("status", "available")
    .gt("expires_at", new Date().toISOString())
    .order("posted_at", { ascending: false });
  if (error) throw new Error(`Could not load scrap: ${error.message}`);
  return data;
}
