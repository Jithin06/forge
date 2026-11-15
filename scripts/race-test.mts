/**
 * Race test (SPEC M4): 5 users claim one item at the same instant.
 * Exactly 1 must succeed. Creates 5 throwaway users and 1 item, then deletes them.
 *   npm run race
 */
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const stamp = Date.now();
const users: string[] = [];
let itemId: string | null = null;
let ok = false;
try {
  for (let i = 1; i <= 5; i++) {
    const { data, error } = await db.auth.admin.createUser({ email: `forge-race-${stamp}-${i}@usc.edu`, email_confirm: true });
    if (error) throw error;
    users.push(data.user.id);
  }
  const { data: item, error } = await db
    .from("scrap_items")
    .insert({ space_id: "bfms", material_category: "plywood", title: `Race test piece ${stamp}`, condition: "good", posted_by: "race-test" })
    .select("id")
    .single();
  if (error) throw error;
  itemId = item.id;

  // Separate clients so the five requests really are separate connections.
  const results = await Promise.all(
    users.map((u) =>
      createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } }).rpc(
        "claim_scrap",
        { p_item_id: itemId, p_user_id: u },
      ),
    ),
  );
  const won = results.filter((r) => !r.error).length;
  const lost = results.filter((r) => /ALREADY_CLAIMED/.test(r.error?.message ?? "")).length;
  const other = results.filter((r) => r.error && !/ALREADY_CLAIMED/.test(r.error.message)).map((r) => r.error!.message);
  const { data: after } = await db.from("scrap_items").select("status").eq("id", itemId).single();
  const { count: active } = await db.from("scrap_claims").select("id", { count: "exact", head: true }).eq("item_id", itemId).eq("status", "active");
  console.log(`5 simultaneous claims from 5 users on one item: ${won} succeeded, ${lost} got ALREADY_CLAIMED${other.length ? `, other errors: ${other.join("; ")}` : ""}`);
  console.log(`item status: ${after?.status}; active claims on it: ${active}`);
  ok = won === 1 && lost === 4 && after?.status === "reserved" && active === 1;
  console.log(ok ? "PASS  exactly 1 succeeded" : "FAIL");
} finally {
  if (itemId) await db.from("scrap_items").delete().eq("id", itemId); // claims go with it
  for (const u of users) await db.auth.admin.deleteUser(u);
  console.log(`cleaned up 1 item and ${users.length} users`);
}
process.exit(ok ? 0 : 1);
