import "server-only";
import { db } from "./db";

export const SCRAP_COLUMNS =
  "id, space_id, material_category, title, description, size_note, condition, restrictions, photo_url, status, posted_at, expires_at";

export type ScrapRow = {
  id: string;
  space_id: string;
  material_category: string;
  title: string;
  description: string;
  size_note: string | null;
  condition: string;
  restrictions: string[];
  photo_url: string | null;
  status: "available" | "reserved" | "picked_up" | "removed";
  posted_at: string;
  expires_at: string;
};

/** Rule 5.3.2: holds past their time go back to available. Applied on read; there is no background job. */
export async function expireHolds() {
  const { error } = await db().rpc("expire_holds");
  if (error) console.error("expire_holds failed:", error.message);
}

export async function listAvailable(filter: { category?: string; space_id?: string } = {}): Promise<ScrapRow[]> {
  await expireHolds();
  let q = db().from("scrap_items").select(SCRAP_COLUMNS).eq("status", "available").gt("expires_at", new Date().toISOString());
  if (filter.category) q = q.eq("material_category", filter.category);
  if (filter.space_id) q = q.eq("space_id", filter.space_id);
  const { data, error } = await q.order("posted_at", { ascending: false });
  if (error) throw new Error(`Could not load scrap: ${error.message}`);
  return data as ScrapRow[];
}

/** Rule 5.3.6: the impact figure is the number of items picked up, counted in SQL. */
export async function impactCount(): Promise<number> {
  const { data, error } = await db().from("impact").select("items_picked_up").maybeSingle();
  if (error) throw new Error(`Could not load the impact count: ${error.message}`);
  return data?.items_picked_up ?? 0;
}

/** Store a staff photo in the public bucket and return its URL. */
export async function uploadScrapPhoto(spaceId: string, dataUrl: string): Promise<string> {
  const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Unreadable photo");
  const path = `${spaceId}/${crypto.randomUUID()}.${m[2] === "jpeg" ? "jpg" : m[2]}`;
  const { error } = await db().storage.from("scrap-photos").upload(path, Buffer.from(m[3], "base64"), { contentType: m[1] });
  if (error) throw new Error(`Could not store the photo: ${error.message}`);
  return db().storage.from("scrap-photos").getPublicUrl(path).data.publicUrl;
}
