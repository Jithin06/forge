/**
 * Remove data made by test accounts and check scripts: scrap items posted by
 * the test staff account or a check script (with their photos and claims),
 * and plans owned by the test accounts. Real staff posts are never touched,
 * and neither are the demo's sample items (their description ends with the
 * sample sentence); KEEP_SAMPLES=0 removes those too.
 *   npm run clean:test
 */
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const TEST_POSTERS = ["forge-test-staff@usc.edu", "check-m4", "race-test", "ui-review"];
const SAMPLE_LINE = "Sample item. Generated photo, not real Maker Space stock.";
const { data: found } = await db.from("scrap_items").select("id, photo_url, description").in("posted_by", TEST_POSTERS);
const items = (found ?? []).filter((i) => process.env.KEEP_SAMPLES === "0" || !(i.description ?? "").endsWith(SAMPLE_LINE));
const paths = (items ?? []).map((i) => i.photo_url?.split("/scrap-photos/")[1]).filter(Boolean) as string[];
if (paths.length) await db.storage.from("scrap-photos").remove(paths);
await db.from("scrap_items").delete().in("id", (items ?? []).map((i) => i.id));
const { data: testers } = await db.from("profiles").select("user_id").in("email", ["forge-test-student@usc.edu", "forge-test-staff@usc.edu"]);
const ids = (testers ?? []).map((t) => t.user_id);
const { data: plans } = ids.length ? await db.from("plans").delete().in("user_id", ids).select("id") : { data: [] };
if (ids.length) await db.from("scrap_claims").delete().in("user_id", ids);
const { data: impact } = await db.from("impact").select("items_picked_up").single();
console.log(`removed ${items?.length ?? 0} test item(s), ${paths.length} photo(s), ${plans?.length ?? 0} test plan(s). Impact counter: ${impact?.items_picked_up}.`);
