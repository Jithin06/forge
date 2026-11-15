import { STATUS_GROUPS, type SpaceDoc } from "./schemas";

/** Accounts made for testing. A confirmation by one of them is never a real confirmation. */
export function isTestAccount(email: string | null | undefined): boolean {
  return !!email && /^forge-test(-[a-z]+)?@/i.test(email.trim());
}

/**
 * The space as anyone but the database may see it.
 *
 * - Who confirmed a group of facts is removed. Only the state and the date go out.
 * - A confirmation made by a test account shows as "Test confirmation" while
 *   test sign-in is on, and is ignored (the group reads as estimated) when it is off.
 * - A price source that names a staff account says only "staff".
 *
 * Every read in lib/spaces.ts goes through this, so no page or API route can
 * leak a name by forgetting to strip it.
 */
export function publicSpace(doc: SpaceDoc, authMode: "test" | "google"): SpaceDoc {
  const out = structuredClone(doc);
  for (const g of STATUS_GROUPS) {
    const st = doc.status[g];
    if (st.state !== "confirmed") continue;
    const byTest = isTestAccount(st.confirmed_by);
    out.status[g] =
      byTest && authMode !== "test"
        ? { state: "estimated" }
        : { state: "confirmed", confirmed_on: st.confirmed_on, ...(byTest ? { test: true } : {}) };
  }
  for (const m of out.materials) {
    if (m.price_source && /^staff\b/i.test(m.price_source)) m.price_source = "staff";
  }
  return out;
}
