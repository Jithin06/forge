import { moneyRange } from "@/lib/format";

/**
 * Scrap is matched by kind of material, never by size, so a plan must not
 * promise a lower total. Shown instead of a with-scrap dollar figure.
 */
export const SCRAP_TOTAL_NOTE = "Could cost less with free scrap. Check the piece is big enough.";

type StubRoute = {
  total: { low: number; high: number } | null;
  typical_from?: string | null;
  bring_your_own?: boolean;
  prices_estimated: boolean;
};

/**
 * The words on a route's cost stub when it has a total. The figure is always
 * the price of the materials new; a free scrap match adds a sentence, never
 * a second, lower figure.
 */
export function costStub(r: StubRoute, anyFree: boolean): { label: string; figure: string; notes: string[] } | null {
  if (!r.total) return null;
  const label = r.typical_from
    ? r.bring_your_own ? "Bring your own material. To buy it, about" : "Materials, if you buy them yourself, about"
    : "Materials, about";
  const notes: string[] = [];
  if (r.prices_estimated && !r.typical_from) notes.push("Estimated prices");
  if (anyFree) notes.push(SCRAP_TOTAL_NOTE);
  return { label, figure: moneyRange(r.total).replace(/^about /, ""), notes };
}
