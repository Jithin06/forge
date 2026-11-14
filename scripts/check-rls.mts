/**
 * M0 check: a request with the public (anon) key cannot read any table,
 * call the claim function, or upload to the scrap bucket.
 *
 * Usage: npx tsx --env-file=.env.local scripts/check-rls.mts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first.");
  process.exit(2);
}

const TABLES = [
  "spaces",
  "staff_members",
  "profiles",
  "plans",
  "scrap_items",
  "scrap_claims",
  "impact",
];

const anon = createClient(url, anonKey, { auth: { persistSession: false } });
let failures = 0;

// Only a permission error proves access is blocked. "Not found" means the
// schema has not been applied, which proves nothing.
const NOT_FOUND = /PGRST205|PGRST202|schema cache|Bucket not found|does not exist/i;
const blocked = (e: { message?: string; code?: string } | null) =>
  Boolean(e) && !NOT_FOUND.test(`${e?.code ?? ""} ${e?.message ?? ""}`);

for (const table of TABLES) {
  const { data, error } = await anon.from(table).select("*").limit(1);
  // Pass only on an explicit error. An empty list could hide a real leak
  // on a table that simply has no rows yet.
  const pass = blocked(error);
  if (!pass) failures++;
  console.log(
    `${pass ? "PASS" : "FAIL"}  select ${table}: ${
      error ? `${error.code ?? ""} ${error.message}` : `returned ${data?.length ?? 0} row(s)`
    }`,
  );
}

const rpc = await anon.rpc("claim_scrap", {
  p_item_id: "00000000-0000-0000-0000-000000000000",
  p_user_id: "00000000-0000-0000-0000-000000000000",
});
const rpcPass = blocked(rpc.error) && !/ALREADY_CLAIMED|TOO_MANY_CLAIMS/.test(rpc.error?.message ?? "");
if (!rpcPass) failures++;
console.log(`${rpcPass ? "PASS" : "FAIL"}  rpc claim_scrap: ${rpc.error?.message ?? "succeeded"}`);

const upload = await anon.storage
  .from("scrap-photos")
  .upload(`rls-check-${Date.now()}.txt`, new Blob(["x"]), { contentType: "text/plain" });
const uploadPass = blocked(upload.error);
if (!uploadPass) failures++;
console.log(`${uploadPass ? "PASS" : "FAIL"}  storage upload: ${upload.error?.message ?? "succeeded"}`);

console.log(failures === 0 ? "\nAll public-key checks passed." : `\n${failures} check(s) failed. If they say "not found", run supabase/schema.sql first.`);
process.exit(failures === 0 ? 0 : 1);
