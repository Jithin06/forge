/**
 * Load space documents into the database (SPEC.md section 5.1).
 *
 *   npm run seed                 validate, then insert spaces not already present
 *   npm run seed -- --check      validate only; write nothing
 *   npm run seed -- --force      overwrite existing spaces (development only)
 *   npm run seed -- --dir path   read documents from another folder
 *
 * Every file is validated before anything is written. One bad file stops the
 * whole run. Without --force an existing space is never touched, so staff
 * edits survive a re-run.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { parseSpaceDoc, type SpaceDoc } from "../src/lib/schemas";

const args = process.argv.slice(2);
const force = args.includes("--force");
const checkOnly = args.includes("--check");
const dirFlag = args.indexOf("--dir");
const dir = dirFlag >= 0 ? args[dirFlag + 1] : "data/spaces";

// ---------------------------------------------------------------- validate
const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
if (files.length === 0) {
  console.error(`No .json files in ${dir}`);
  process.exit(1);
}

const docs: SpaceDoc[] = [];
let bad = 0;
for (const file of files) {
  const where = path.join(dir, file);
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(where, "utf8"));
  } catch (e) {
    console.error(`REJECTED ${where}\n  not valid JSON: ${(e as Error).message}`);
    bad++;
    continue;
  }
  const result = parseSpaceDoc(raw);
  const errors = result.ok ? [] : result.errors;
  if (result.ok && result.doc.id !== path.basename(file, ".json")) {
    errors.push(`id: "${result.doc.id}" must match the file name "${path.basename(file, ".json")}"`);
  }
  if (errors.length || !result.ok) {
    console.error(`REJECTED ${where}\n${errors.map((e) => `  ${e}`).join("\n")}`);
    bad++;
  } else {
    console.log(`valid    ${where}`);
    docs.push(result.doc);
  }
}
if (bad) {
  console.error(`\n${bad} of ${files.length} file(s) rejected. Nothing was written.`);
  process.exit(1);
}
if (checkOnly) {
  console.log(`\nAll ${files.length} file(s) valid. --check: nothing written.`);
  process.exit(0);
}

// ---------------------------------------------------------------- write
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const { data: existingRows, error: readErr } = await db.from("spaces").select("id");
if (readErr) throw new Error(`Could not read spaces: ${readErr.message}`);
const existing = new Set(existingRows.map((r) => r.id as string));

for (const doc of docs) {
  if (existing.has(doc.id) && !force) {
    console.log(`skipped  ${doc.id} (already in the database; staff edits are kept)`);
    continue;
  }
  const row = { id: doc.id, doc, updated_at: new Date().toISOString(), updated_by: "seed" };
  // ignoreDuplicates makes a race with another seed run a no-op, not an overwrite.
  const { error } = force
    ? await db.from("spaces").upsert(row)
    : await db.from("spaces").upsert(row, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`Could not write ${doc.id}: ${error.message}`);
  console.log(`${existing.has(doc.id) ? "replaced" : "inserted"} ${doc.id}`);
}

// ------------------------------------------------------ staff allow-list
const pairs = (process.env.STAFF_SEED ?? "")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);
const spaceIds = new Set([...existing, ...docs.map((d) => d.id)]);
for (const pair of pairs) {
  const [email, spaceId] = pair.split(":").map((s) => s?.trim().toLowerCase());
  if (!email?.endsWith("@usc.edu") || !spaceId) {
    console.error(`staff    skipped "${pair}": use email@usc.edu:space_id`);
    continue;
  }
  if (!spaceIds.has(spaceId)) {
    console.error(`staff    skipped ${email}: no space "${spaceId}"`);
    continue;
  }
  const { error } = await db
    .from("staff_members")
    .upsert({ email, space_id: spaceId }, { ignoreDuplicates: true });
  if (error) throw new Error(`Could not add staff ${email}: ${error.message}`);
  console.log(`staff    ${email} -> ${spaceId}`);
}
