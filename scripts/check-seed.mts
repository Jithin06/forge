/**
 * M1 check: running the seed twice neither duplicates nor overwrites a space.
 *
 * 1. Run the seed.
 * 2. Simulate a staff edit to one space directly in the database.
 * 3. Run the seed again.
 * 4. Pass if the row count is unchanged and the staff edit survived.
 * The edit is undone at the end.
 *
 * Usage: npm run check:seed
 */
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const TARGET = "bfms";
const MARK = `Staff edit made by check-seed at ${new Date().toISOString()}`;

const seed = (label: string) => {
  console.log(`--- seed run ${label}`);
  console.log(execFileSync("npm", ["run", "-s", "seed"], { encoding: "utf8" }).trim());
};
const rows = async () => {
  const { data, error } = await db.from("spaces").select("id, doc, updated_by").order("id");
  if (error) throw error;
  return data;
};

seed("1");
const afterFirst = await rows();
const original = afterFirst.find((r) => r.id === TARGET);
if (!original) throw new Error(`${TARGET} was not seeded`);

const edited = { ...original.doc, blurb: MARK };
const { error: editErr } = await db
  .from("spaces")
  .update({ doc: edited, updated_by: "staff-simulated" })
  .eq("id", TARGET);
if (editErr) throw editErr;
console.log(`--- simulated staff edit on ${TARGET}`);

seed("2");
const afterSecond = await rows();
const survived = afterSecond.find((r) => r.id === TARGET);

const countOk = afterSecond.length === afterFirst.length;
const editOk = survived?.doc.blurb === MARK && survived?.updated_by === "staff-simulated";
console.log(`${countOk ? "PASS" : "FAIL"}  row count ${afterFirst.length} -> ${afterSecond.length} (ids: ${afterSecond.map((r) => r.id).join(", ")})`);
console.log(`${editOk ? "PASS" : "FAIL"}  staff edit kept: blurb=${JSON.stringify(survived?.doc.blurb)} updated_by=${survived?.updated_by}`);

// Put the original back.
await db.from("spaces").update({ doc: original.doc, updated_by: original.updated_by }).eq("id", TARGET);
console.log(`--- restored ${TARGET}`);
process.exit(countOk && editOk ? 0 : 1);
