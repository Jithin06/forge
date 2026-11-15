/**
 * M4 checks through the running app (AUTH_MODE=test). Everything it creates is deleted at the end.
 *   BASE=http://localhost:3123 npm run check:m4
 */
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BASE ?? "http://localhost:3000";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
let failures = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `\n      ${detail}` : ""}`);
};
const signIn = async (persona: string) => {
  const res = await fetch(`${BASE}/auth/test`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ persona, next: "/" }) });
  return (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
};
const call = async (method: string, path: string, cookie = "", body?: unknown) => {
  const res = await fetch(BASE + path, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}), "X-Forwarded-For": "10.0.4.1" }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const items: string[] = [];
const plans: string[] = [];
const image = `data:image/jpeg;base64,${(await readFile("data/samples/scrap-standin.jpg")).toString("base64")}`;
const staff = await signIn("staff");
const student = await signIn("student");
const { data: studentRow } = await db.from("profiles").select("user_id").eq("email", "forge-test-student@usc.edu").single();
await db.from("scrap_claims").delete().eq("user_id", studentRow!.user_id); // start with no claims for the test student
const seedItem = async (category: string, title: string) => {
  const { data, error } = await db.from("scrap_items").insert({ space_id: "bfms", material_category: category, title, condition: "good", posted_by: "check-m4", restrictions: category === "unknown_plastic" ? ["Not for laser cutting or heating"] : [] }).select("id").single();
  if (error) throw error;
  items.push(data.id);
  return data.id as string;
};
const available = async () => ((await call("GET", "/api/scrap")).body.items as { id: string }[]).map((i) => i.id);
const impact = async () => (await db.from("impact").select("items_picked_up").single()).data!.items_picked_up as number;
const standPlan = async () => {
  const r = await call("POST", "/api/plan", "", {
    text: "I want to make a phone stand for my desk out of wood. It should hold my phone at a slight angle, fit in my hand, and I only need one.",
    answers: { size: ["hand"], quantity: ["one"], demands: ["looks"] }, audience: "viterbi_undergrad", experience: "never",
  });
  plans.push(r.body.id);
  return r.body.plan.routes[0] as { total: { low: number; high: number }; with_scrap: { low: number; high: number }; scrap: { id: string; title: string }[][]; cost_lines: { name: string }[] };
};

try {
  console.log("0. Every staff route: 401 signed out, 403 for the test student; claiming needs sign-in");
  const routes: [string, string, unknown?][] = [
    ["GET", "/api/staff/claims?space_id=bfms"],
    ["GET", "/api/staff/scrap?space_id=bfms"],
    ["POST", "/api/staff/scrap/draft", { space_id: "bfms", image }],
    ["POST", "/api/staff/scrap", { space_id: "bfms", material_category: "plywood", title: "x", description: "", size_note: null, condition: "good", restrictions: [], image }],
    ["PATCH", "/api/staff/scrap/00000000-0000-4000-8000-000000000000", { status: "removed" }],
  ];
  for (const [m, p, b] of routes) {
    const out = await call(m, p, "", b);
    const stu = await call(m, p, student, b);
    check(out.status === 401 && stu.status === 403, `${m} ${p.split("?")[0]}: signed out ${out.status}, student ${stu.status}`);
  }

  console.log("\n1. A photo yields a draft; after editing and publishing it appears on /scrap");
  const before = await standPlan();
  const draft = await call("POST", "/api/staff/scrap/draft", staff, { space_id: "bfms", image, note: "thin plywood" });
  check(draft.status === 200 && !!draft.body?.draft?.title, `draft: ${draft.status} (${draft.body?.fixture ? "sample data, no live model" : "live model"})`, JSON.stringify(draft.body?.draft));
  const d = draft.body.draft;
  const pub = await call("POST", "/api/staff/scrap", staff, { space_id: "bfms", material_category: d.material_category, title: `${d.title} (edited)`, description: d.description, size_note: d.size_note, condition: d.condition, restrictions: d.restrictions, image });
  if (pub.body?.item) items.push(pub.body.item.id);
  const listed = (await call("GET", "/api/scrap")).body.items.find((i: { id: string }) => i.id === pub.body?.item?.id);
  const photo = listed ? await fetch(listed.photo_url) : null;
  check(pub.status === 201 && !!listed && listed.title.endsWith("(edited)"), `published ${pub.status}; listed on /api/scrap as "${listed?.title}"`);
  check(photo?.status === 200 && (photo.headers.get("content-type") ?? "").startsWith("image/"), `stored photo loads from the public bucket (${photo?.status} ${photo?.headers.get("content-type")})`);
  const anonUpload = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!).storage.from("scrap-photos").upload(`bfms/x-${Date.now()}.txt`, new Blob(["x"]));
  check(!!anonUpload.error, "the public key still cannot upload a photo");

  console.log("\n5. A new plan needing that material shows it as a possible free piece, and the with-scrap total (computed, not shown) drops");
  const after = await standPlan();
  check(
    before.scrap[0].length === 0 && after.scrap[0].some((s) => s.id === pub.body.item.id) && after.with_scrap.low < before.with_scrap.low && after.total.low === before.total.low,
    `${after.cost_lines[0].name}: free with "${after.scrap[0][0]?.title}"`,
    `before: materials ${JSON.stringify(before.total)}, with scrap ${JSON.stringify(before.with_scrap)}\n      after:  materials ${JSON.stringify(after.total)}, with scrap ${JSON.stringify(after.with_scrap)}`,
  );

  console.log("\n2. Race: 5 simultaneous claims from 5 users at one item");
  try {
    console.log("      " + execFileSync("npm", ["run", "-s", "race"], { encoding: "utf8" }).trim().split("\n").join("\n      "));
    check(true, "exactly 1 succeeded");
  } catch (e) {
    console.log((e as { stdout?: string }).stdout ?? e);
    check(false, "race test");
  }

  console.log("\n3. A fourth active claim by one user returns TOO_MANY_CLAIMS");
  const four = [await seedItem("acrylic", "check piece A"), await seedItem("mdf", "check piece B"), await seedItem("foam", "check piece C"), await seedItem("fabric", "check piece D")];
  check((await call("POST", `/api/scrap/${four[0]}/claim`)).status === 401, "claiming signed out: 401");
  const claims = [];
  for (const id of four) claims.push(await call("POST", `/api/scrap/${id}/claim`, student, {}));
  check(claims.slice(0, 3).every((c) => c.status === 201) && claims[3].status === 409 && claims[3].body.error.code === "TOO_MANY_CLAIMS", `claims 1 to 3: ${claims.slice(0, 3).map((c) => c.status).join(", ")}; 4th: ${claims[3].status} ${claims[3].body?.error?.code}`, claims[3].body?.error?.message);
  const again = await call("POST", `/api/scrap/${four[0]}/claim`, staff, {});
  check(again.status === 409 && again.body.error.code === "ALREADY_CLAIMED", `a second user claiming a held piece: ${again.status} ${again.body?.error?.code}`);
  const hours = (new Date(claims[0].body.claim.hold_until).getTime() - Date.now()) / 36e5;
  check(hours > 47.9 && hours < 48.1, `hold lasts ${hours.toFixed(1)} hours`);

  console.log("\n4. An item past its hold shows as available again");
  const heldBefore = !(await available()).includes(four[0]);
  await db.from("scrap_claims").update({ hold_until: new Date(Date.now() - 60_000).toISOString() }).eq("id", claims[0].body.claim.id);
  const backAgain = (await available()).includes(four[0]);
  const { data: lapsed } = await db.from("scrap_claims").select("status").eq("id", claims[0].body.claim.id).single();
  check(heldBefore && backAgain && lapsed?.status === "expired", `held piece hidden: ${heldBefore}; after the hold time passes it is listed again: ${backAgain}; claim status: ${lapsed?.status}`);

  console.log("\n   Cancel: the owner can cancel, nobody else can");
  const notMine = await call("DELETE", `/api/claims/${claims[1].body.claim.id}`, staff);
  const mine = await call("DELETE", `/api/claims/${claims[1].body.claim.id}`, student);
  check(notMine.status === 403 && mine.status === 204 && (await available()).includes(four[1]), `another user: ${notMine.status}; owner: ${mine.status}; piece is available again`);

  console.log("\n6. Publishing in a never_offer category is refused");
  const { data: spaceRow } = await db.from("spaces").select("doc").eq("id", "bfms").single();
  await db.from("spaces").update({ doc: { ...spaceRow!.doc, scrap_policy: { ...spaceRow!.doc.scrap_policy, never_offer: ["resin"] } } }).eq("id", "bfms");
  const refused = await call("POST", "/api/staff/scrap", staff, { space_id: "bfms", material_category: "resin", title: "Half bottle of resin", description: "", size_note: null, condition: "usable", restrictions: [], image });
  await db.from("spaces").update({ doc: spaceRow!.doc }).eq("id", "bfms"); // put the real policy back
  if (refused.body?.item) items.push(refused.body.item.id);
  check(refused.status === 400 && refused.body.error.code === "CATEGORY_NOT_ALLOWED", `${refused.status} ${refused.body?.error?.code}`, refused.body?.error?.message);
  const plastic = await call("POST", "/api/staff/scrap", staff, { space_id: "bfms", material_category: "unknown_plastic", title: "Clear sheet, type unknown", description: "", size_note: null, condition: "usable", restrictions: [], image });
  if (plastic.body?.item) items.push(plastic.body.item.id);
  check(plastic.status === 201 && plastic.body.item.restrictions.includes("Not for laser cutting or heating"), "unknown plastic published with no warnings still carries the heat restriction", JSON.stringify(plastic.body?.item?.restrictions));

  console.log("\n7. Picked up raises the impact counter by one");
  const n0 = await impact();
  const picked = await call("PATCH", `/api/staff/scrap/${four[2]}`, staff, { status: "picked_up" });
  const n1 = await impact();
  const { data: closed } = await db.from("scrap_claims").select("status").eq("id", claims[2].body.claim.id).single();
  check(picked.status === 200 && n1 === n0 + 1 && closed?.status === "picked_up", `impact ${n0} -> ${n1}; claim is now ${closed?.status}`);
  const wrongSpace = await seedItem("plywood", "other space piece");
  await db.from("scrap_items").update({ space_id: "bme-innovation" }).eq("id", wrongSpace);
  const other = await call("PATCH", `/api/staff/scrap/${wrongSpace}`, staff, { status: "removed" });
  check(other.status === 403, `Maker Space staff changing a BME item: ${other.status}`);
} finally {
  const { data: rows } = await db.from("scrap_items").select("photo_url").in("id", items);
  const paths = (rows ?? []).map((r) => r.photo_url?.split("/scrap-photos/")[1]).filter(Boolean) as string[];
  if (paths.length) await db.storage.from("scrap-photos").remove(paths);
  await db.from("scrap_items").delete().in("id", items);
  await db.from("plans").delete().in("id", plans);
  console.log(`\nCleaned up ${items.length} item(s), ${paths.length} photo(s), ${plans.length} plan(s). Impact counter is back to ${await impact()}.`);
}
console.log(failures === 0 ? "All M4 checks passed." : `${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
