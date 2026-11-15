/**
 * Hand corrections to the published sample scrap, asked for by Jithin on Nov 15.
 * Wording only; safe to run twice.   tsx --env-file=.env.local scripts/fix-sample-scrap.mts
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const drafts: Record<string, { published_id?: string }> = JSON.parse(await readFile("reports/sample-scrap-drafts.json", "utf8"));
type Row = { description: string; size_note: string | null; restrictions: string[] };
const FIXES: Record<string, (r: Row) => Partial<Row>> = {
  "plywood-offcut": (r) => ({ restrictions: r.restrictions.filter((x) => x !== "Do not laser cut PVC") }),
  "red-acrylic-strip": (r) => ({ description: r.description.replace("red plastic strip", "red acrylic strip"), restrictions: r.restrictions.filter((x) => x !== "Do not laser cut PVC") }),
  "acrylic-offcut": (r) => ({ restrictions: r.restrictions.filter((x) => x !== "Do not laser cut if uncertain of material safety") }),
  "failed-prints": () => ({ size_note: "Failed PLA prints, about 10 pieces" }),
  "filament-spool": (r) => ({ description: r.description.replace(" on a wooden spool", "") }),
};
for (const [name, fix] of Object.entries(FIXES)) {
  const id = drafts[name]?.published_id;
  if (!id) throw new Error(`${name}: no published id`);
  const { data: row, error } = await db.from("scrap_items").select("description, size_note, restrictions, status").eq("id", id).single();
  if (error) throw new Error(`${name}: ${error.message}`);
  const { data: after, error: e2 } = await db.from("scrap_items").update(fix(row)).eq("id", id).select("title, description, size_note, restrictions").single();
  if (e2) throw new Error(`${name}: ${e2.message}`);
  console.log(`${name}: ${JSON.stringify(after)}`);
}
